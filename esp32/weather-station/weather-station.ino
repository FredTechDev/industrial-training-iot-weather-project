#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <time.h>

// --- WiFi ---
const char* WIFI_SSID = "DOMA";
const char* WIFI_PASS = "DOMA2025";

// --- MQTT ---
const char* MQTT_HOST = "6f83a2bd234445aca1060e89e6171e19.s1.eu.hivemq.cloud";
const int  MQTT_PORT = 8883;
const bool MQTT_TLS  = true;
const char* MQTT_USER = "mmust-iot-001";
const char* MQTT_PASS = "Fred1234";

const char* DEVICE_ID = "station-001";

// --- MQTT Topics (aligned with frontend) ---
const char* TOPIC_TELEMETRY = "clothesline/telemetry";
const char* TOPIC_STATUS    = "clothesline/status";
const char* TOPIC_EVENTS    = "clothesline/events";
const char* TOPIC_SYSTEM    = "clothesline/system";
const char* TOPIC_CONTROL   = "clothesline/control";
const char* TOPIC_CONFIG    = "clothesline/config";
const char* TOPIC_WEATHER   = "clothesline/weather";
const char* TOPIC_PRESENCE  = "home/presence";

// --- Sensor pins ---
#define RAIN_SENSOR_PIN 35
#define RAIN_ANALOG_PIN 32
#define LIGHT_SENSOR_PIN 34
#define SERVO_PIN 13

// --- Servo ---
Servo lineServo;
const int SERVO_EXTEND  = 90;
const int SERVO_RETRACT = 0;

// --- State ---
enum AutomationMode { MODE_AUTO, MODE_FORCE_RETRACT, MODE_FORCE_EXTEND, MODE_STOPPED };
AutomationMode currentMode = MODE_AUTO;

String lineState    = "RETRACTED";
String reason      = "SAFE";
String prediction  = "SAFE";
String currentModeStr = "AUTO";
String presence    = "HOME";

// --- OpenWeatherMap data (received from backend) ---
float owmTemperature = 0.0;
float owmHumidity    = 0.0;
float owmPressure    = 0.0;
String pressureTrend  = "stable";
float pressureRate    = 0.0;
bool  owmDataReceived = false;
unsigned long lastOwmUpdate = 0;

// --- Timing ---
unsigned long lastPublish = 0;
unsigned long lastStatus  = 0;
const long PUBLISH_INTERVAL = 15000;
const long STATUS_INTERVAL  = 30000;
unsigned long startTime = 0;

// --- Configurable thresholds ---
float tempHigh         = 30.0;
float tempLow          = 18.0;
float humidityHigh     = 80.0;
int   nightLightThresh = 200;

WiFiClient wifiClient;
WiFiClientSecure tlsClient;
PubSubClient mqtt(MQTT_TLS ? tlsClient : wifiClient);

void connectWiFi();
void connectMQTT();
void callback(char* topic, byte* payload, unsigned int length);
void publishTelemetry(bool rain, int rainIntensity, int lightRaw);
void publishStatus();
void publishEvent(const char* type, const char* message);
void evaluateAutoMode(bool rain, int rainIntensity, int lightRaw);
void moveServo(int angle);
String classifyPrediction(bool rain);
int getLocalHour();

void setup() {
  Serial.begin(115200);
  startTime = millis();

  if (MQTT_TLS) tlsClient.setInsecure();

  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(RAIN_ANALOG_PIN, INPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);

  lineServo.attach(SERVO_PIN);
  lineServo.write(SERVO_RETRACT);

  connectWiFi();

  configTime(3 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("NTP sync started (EAT UTC+3)...");

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(callback);
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  unsigned long now = millis();

  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;

    bool rain      = digitalRead(RAIN_SENSOR_PIN) == LOW;
    int rainRaw     = analogRead(RAIN_ANALOG_PIN);
    int rainIntensity = map(rainRaw, 0, 4095, 100, 0);
    int lightRaw   = analogRead(LIGHT_SENSOR_PIN);

    if (currentMode == MODE_AUTO) {
      evaluateAutoMode(rain, rainIntensity, lightRaw);
    }

    prediction = classifyPrediction(rain);
    publishTelemetry(rain, rainIntensity, lightRaw);
  }

  if (now - lastStatus >= STATUS_INTERVAL) {
    lastStatus = now;
    publishStatus();
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  char message[64];
  unsigned int copyLen = length < sizeof(message) - 1 ? length : sizeof(message) - 1;
  memcpy(message, payload, copyLen);
  message[copyLen] = '\0';

  Serial.print("MSG [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  if (String(topic) == TOPIC_CONTROL) {
    if (strcmp(message, "AUTO") == 0) {
      currentMode = MODE_AUTO;
      currentModeStr = "AUTO";
      reason = "SAFE";
      publishEvent("success", "Automation resumed");
      Serial.println("Mode: AUTO");
    } else if (strcmp(message, "FORCE_RETRACT") == 0) {
      currentMode = MODE_FORCE_RETRACT;
      currentModeStr = "MANUAL";
      moveServo(SERVO_RETRACT);
      lineState = "RETRACTED";
      reason = "SAFE";
      publishEvent("info", "Clothesline retracted by remote command");
      Serial.println("Mode: FORCE_RETRACT");
    } else if (strcmp(message, "FORCE_EXTEND") == 0) {
      currentMode = MODE_FORCE_EXTEND;
      currentModeStr = "MANUAL";
      moveServo(SERVO_EXTEND);
      lineState = "EXTENDED";
      reason = "SAFE";
      publishEvent("info", "Clothesline extended by remote command");
      Serial.println("Mode: FORCE_EXTEND");
    } else if (strcmp(message, "STOP_AUTOMATION") == 0) {
      currentMode = MODE_STOPPED;
      currentModeStr = "MANUAL";
      publishEvent("warning", "Automation stopped by remote command");
      Serial.println("Mode: STOPPED");
    } else if (strcmp(message, "RESTART_DEVICE") == 0) {
      publishEvent("warning", "Device restarting...");
      delay(500);
      ESP.restart();
    } else if (strcmp(message, "PING_DEVICE") == 0) {
      publishEvent("info", "Pong — device is alive");
      Serial.println("Ping responded");
    }
  }

  if (String(topic) == TOPIC_PRESENCE) {
    StaticJsonDocument<128> pdoc;
    if (deserializeJson(pdoc, message) == DeserializationError::Ok) {
      const char* pMode = pdoc["mode"];
      if (pMode) {
        presence = String(pMode);
        Serial.print("Presence → ");
        Serial.println(presence);
        publishEvent("info", ("Presence: " + presence).c_str());
      }
    }
  }

  if (String(topic) == TOPIC_CONFIG) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, message) == DeserializationError::Ok) {
      if (doc.containsKey("tempHigh")) tempHigh = doc["tempHigh"];
      if (doc.containsKey("tempLow")) tempLow = doc["tempLow"];
      if (doc.containsKey("humidityHigh")) humidityHigh = doc["humidityHigh"];
      if (doc.containsKey("nightLightThreshold")) nightLightThresh = doc["nightLightThreshold"];
      publishEvent("success", "Configuration updated");
      Serial.println("Config updated");
    }
  }

  if (String(topic) == TOPIC_WEATHER) {
    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, message) == DeserializationError::Ok) {
      if (doc.containsKey("temperature")) owmTemperature = doc["temperature"];
      if (doc.containsKey("humidity"))    owmHumidity = doc["humidity"];
      if (doc.containsKey("pressure"))    owmPressure = doc["pressure"];
      if (doc.containsKey("pressureTrend")) pressureTrend = doc["pressureTrend"].as<String>();
      if (doc.containsKey("pressureRate")) pressureRate = doc["pressureRate"];
      owmDataReceived = true;
      lastOwmUpdate = millis();
      publishEvent("info", "Weather data updated from OpenWeatherMap");
      Serial.println("OWM data received");
    }
  }
}

void evaluateAutoMode(bool rain, int rainIntensity, int lightRaw) {
  // Check if OWM data is fresh (within 15 minutes)
  bool owmFresh = owmDataReceived && (millis() - lastOwmUpdate < 900000);

  // Priority 1: Presence mode
  if (presence == "AWAY" || presence == "VACATION") {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = (presence == "VACATION") ? "NIGHT_SECURITY" : "STORM_PREDICTION";
    return;
  }

  // Priority 2: Actual rain (local sensor) — always wins
  if (rain) {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = "RAIN";
    return;
  }

  // Priority 3: Storm predicted — pressure dropping rapidly (OWM)
  if (owmFresh && pressureTrend == "dropping" && pressureRate < -1.0) {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = "STORM_PREDICTION";
    return;
  }

  // Priority 4: High humidity — rain likely (OWM)
  if (owmFresh && owmHumidity > humidityHigh) {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = "HIGH_HUMIDITY";
    return;
  }

  // Priority 5: Night time (NTP clock, EAT UTC+3)
  int hour = getLocalHour();
  if (hour >= 0 && (hour >= 18 || hour < 6)) {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = "NIGHT_SECURITY";
    return;
  }

  // Priority 6: Low light — night security
  if (lightRaw < nightLightThresh) {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = "NIGHT_SECURITY";
    return;
  }

  // Priority 7: Low temperature — cold/wet conditions (OWM)
  if (owmFresh && owmTemperature < tempLow) {
    moveServo(SERVO_RETRACT);
    lineState = "RETRACTED";
    reason = "TEMP_LIMIT";
    return;
  }

  // Priority 8: All conditions safe — extend clothesline
  moveServo(SERVO_EXTEND);
  lineState = "EXTENDED";
  reason = "SAFE";
}

String classifyPrediction(bool rain) {
  if (rain) return "WARNING";
  bool owmFresh = owmDataReceived && (millis() - lastOwmUpdate < 900000);
  if (owmFresh && pressureTrend == "dropping" && pressureRate < -1.0) return "WARNING";
  if (owmFresh && owmHumidity > humidityHigh) return "WARNING";
  if (owmFresh && owmTemperature < tempLow) return "WARNING";
  if (reason == "NIGHT_SECURITY") return "WARNING";
  return "SAFE";
}

void moveServo(int angle) {
  lineServo.write(angle);
  Serial.print("Servo → ");
  Serial.println(angle);
}

void publishTelemetry(bool rain, int rainIntensity, int lightRaw) {
  const char* lightState = lightRaw >= nightLightThresh ? "DAY" : "NIGHT";

  StaticJsonDocument<512> doc;
  doc["deviceId"]       = DEVICE_ID;
  doc["rain"]           = rain;
  doc["rainIntensity"]  = rainIntensity;
  doc["light"]          = lightRaw;
  doc["lightState"]     = lightState;
  doc["line"]           = lineState;
  doc["mode"]           = currentModeStr;
  doc["prediction"]     = prediction;
  doc["reason"]         = reason;
  if (owmDataReceived) {
    doc["owmTemperature"] = owmTemperature;
    doc["owmHumidity"]    = owmHumidity;
    doc["owmPressure"]    = owmPressure;
  }
  doc["pressureTrend"]  = pressureTrend;
  doc["timestamp"]      = "";

  char buffer[512];
  size_t n = serializeJson(doc, buffer);
  mqtt.publish(TOPIC_TELEMETRY, buffer, n);
  Serial.print("Published: ");
  Serial.println(buffer);
}

void publishStatus() {
  StaticJsonDocument<320> doc;
  doc["deviceId"]      = DEVICE_ID;
  doc["online"]      = true;
  doc["uptime"]      = (millis() - startTime) / 1000;
  doc["firmware"]    = "3.0.0";
  doc["ip"]          = WiFi.localIP().toString();
  doc["wifiSignal"]  = WiFi.RSSI();
  doc["heapFree"]    = ESP.getFreeHeap();
  doc["mqttLatency"] = 0;
  doc["lastHeartbeat"] = "";

  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  mqtt.publish(TOPIC_STATUS, buffer, n);
}

void publishEvent(const char* type, const char* message) {
  StaticJsonDocument<256> doc;
  doc["id"]        = String(millis());
  doc["type"]      = type;
  doc["message"]   = message;
  doc["timestamp"] = "";

  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  mqtt.publish(TOPIC_EVENTS, buffer, n);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected, IP: " + WiFi.localIP().toString());
}

void connectMQTT() {
  while (!mqtt.connected()) {
    Serial.print("Connecting to MQTT...");
    boolean ok = (strlen(MQTT_USER) > 0)
      ? mqtt.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)
      : mqtt.connect(DEVICE_ID);
    if (ok) {
      Serial.println("connected");
      publishStatus();
      publishEvent("success", "Device connected");
      mqtt.subscribe(TOPIC_CONTROL, 1);
      mqtt.subscribe(TOPIC_CONFIG, 1);
      mqtt.subscribe(TOPIC_WEATHER, 1);
      mqtt.subscribe(TOPIC_PRESENCE, 1);
      Serial.println("Subscribed: clothesline/control, clothesline/config, clothesline/weather, home/presence");
    } else {
      Serial.print("failed (rc=");
      Serial.print(mqtt.state());
      Serial.println(") retrying in 5s");
      delay(5000);
    }
  }
}

int getLocalHour() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return -1;
  }
  if (timeinfo.tm_year < 100) {
    return -1;
  }
  return timeinfo.tm_hour;
}
