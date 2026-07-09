#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// --- WiFi ---
const char* WIFI_SSID = "your_wifi_ssid";
const char* WIFI_PASS = "your_wifi_password";

// --- MQTT ---
const char* MQTT_HOST = "6f83a2bd234445aca1060e89e6171e19.s1.eu.hivemq.cloud";
const int  MQTT_PORT = 8883;
const bool MQTT_TLS  = true;
const char* MQTT_USER = "mmust-iot-001";
const char* MQTT_PASS = "Fred1234";

const char* DEVICE_ID = "station-001";

// --- MQTT Topics (aligned with frontend) ---
const char* TOPIC_TELEMETRY = "window/telemetry";
const char* TOPIC_STATUS    = "window/status";
const char* TOPIC_EVENTS    = "window/events";
const char* TOPIC_SYSTEM    = "window/system";
const char* TOPIC_CONTROL   = "window/control";
const char* TOPIC_CONFIG    = "window/config";
const char* TOPIC_PRESENCE  = "home/presence";

// --- Sensor pins ---
#define DHT22_PIN 4
#define BMP280_ADDR 0x76
#define LIGHT_SENSOR_PIN 34
#define RAIN_SENSOR_PIN 35
#define BATTERY_PIN 32
#define SERVO_PIN 13

// --- Servo ---
Servo windowServo;
const int SERVO_OPEN   = 90;
const int SERVO_CLOSED = 0;

// --- State ---
enum AutomationMode { MODE_AUTO, MODE_FORCE_CLOSE, MODE_FORCE_OPEN, MODE_STOPPED };
AutomationMode currentMode = MODE_AUTO;

String windowState = "CLOSED";
String reason      = "SAFE";
String prediction  = "SAFE";
String currentModeStr = "AUTO";
String presence    = "HOME";

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
float pressureDrop     = 5.0;
int   nightLightThresh = 200;
float batteryLow       = 20.0;

WiFiClient wifiClient;
WiFiClientSecure tlsClient;
PubSubClient mqtt(MQTT_TLS ? tlsClient : wifiClient);

float lastPressure = 0;

void connectWiFi();
void connectMQTT();
void callback(char* topic, byte* payload, unsigned int length);
void publishTelemetry(float temp, float hum, float press, int lightRaw, bool rain, float bat);
void publishStatus();
void publishEvent(const char* type, const char* message);
void evaluateAutoMode(float temp, float hum, float press, int lightRaw, bool rain, float bat);
void moveServo(int angle);
String classifyLight(int raw);
String classifyPrediction(float press, bool rain);

void setup() {
  Serial.begin(115200);
  startTime = millis();

  if (MQTT_TLS) tlsClient.setInsecure();

  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);

  windowServo.attach(SERVO_PIN);
  windowServo.write(SERVO_CLOSED);

  connectWiFi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(callback);
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  unsigned long now = millis();

  // Publish telemetry every 15s
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;

    float temp = 25.0 + random(-50, 50) / 10.0;
    float hum  = 60.0 + random(-100, 100) / 10.0;
    float press = 1008.0 + random(-20, 20) / 10.0;
    int lightRaw = analogRead(LIGHT_SENSOR_PIN);
    bool rain    = digitalRead(RAIN_SENSOR_PIN) == LOW;
    float bat_voltage = analogRead(BATTERY_PIN) / 4095.0 * 3.3 * 2;
    float bat = constrain((bat_voltage - 3.0) / (4.2 - 3.0) * 100.0, 0.0, 100.0);

    if (currentMode == MODE_AUTO) {
      evaluateAutoMode(temp, hum, press, lightRaw, rain, bat);
    }

    prediction = classifyPrediction(press, rain);
    publishTelemetry(temp, hum, press, lightRaw, rain, bat);

    lastPressure = press;
  }

  // Publish status every 30s
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
    } else if (strcmp(message, "FORCE_CLOSE") == 0) {
      currentMode = MODE_FORCE_CLOSE;
      currentModeStr = "MANUAL";
      moveServo(SERVO_CLOSED);
      windowState = "CLOSED";
      reason = "SAFE";
      publishEvent("info", "Window force closed by remote command");
      Serial.println("Mode: FORCE_CLOSE");
    } else if (strcmp(message, "FORCE_OPEN") == 0) {
      currentMode = MODE_FORCE_OPEN;
      currentModeStr = "MANUAL";
      moveServo(SERVO_OPEN);
      windowState = "OPEN";
      reason = "SAFE";
      publishEvent("info", "Window force opened by remote command");
      Serial.println("Mode: FORCE_OPEN");
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
    // Parse {"mode":"HOME","user":"Fredrick","timestamp":"..."}
    StaticJsonDocument<128> pdoc;
    if (deserializeJson(pdoc, message) == DeserializationOk) {
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
    if (deserializeJson(doc, message) == DeserializationOk) {
      if (doc.containsKey("tempHigh")) tempHigh = doc["tempHigh"];
      if (doc.containsKey("tempLow")) tempLow = doc["tempLow"];
      if (doc.containsKey("humidityHigh")) humidityHigh = doc["humidityHigh"];
      if (doc.containsKey("pressureDrop")) pressureDrop = doc["pressureDrop"];
      if (doc.containsKey("nightLightThreshold")) nightLightThresh = doc["nightLightThreshold"];
      if (doc.containsKey("batteryLow")) batteryLow = doc["batteryLow"];
      publishEvent("success", "Configuration updated");
      Serial.println("Config updated");
    }
  }
}

void evaluateAutoMode(float temp, float hum, float press, int lightRaw, bool rain, float bat) {
  // Priority 1: AWAY or VACATION → always close window (security first)
  if (presence == "AWAY" || presence == "VACATION") {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = (presence == "VACATION") ? "NIGHT_SECURITY" : "STORM_PREDICTION";
    return;
  }

  // Priority 2: Rain → close
  if (rain) {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = "RAIN";
    return;
  }

  // Priority 3: Storm prediction (rapid pressure drop)
  if (lastPressure > 0 && (lastPressure - press) > pressureDrop) {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = "STORM_PREDICTION";
    return;
  }

  // Priority 4: Low battery → emergency safe-close
  if (bat < batteryLow) {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = "LOW_BATTERY";
    return;
  }

  // Priority 5: Night security
  int hour = (millis() / 3600000) % 24;
  if (hour >= 22 || hour < 6) {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = "NIGHT_SECURITY";
    return;
  }

  // Priority 6: Temperature out of comfort range
  if (temp > tempHigh || temp < tempLow) {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = "TEMP_LIMIT";
    return;
  }

  // Priority 7: High humidity
  if (hum > humidityHigh) {
    moveServo(SERVO_CLOSED);
    windowState = "CLOSED";
    reason = "HIGH_HUMIDITY";
    return;
  }

  // All clear → open window (only if HOME)
  moveServo(SERVO_OPEN);
  windowState = "OPEN";
  reason = "SAFE";
}

String classifyLight(int raw) {
  return (raw < nightLightThresh) ? "NIGHT" : "DAY";
}

String classifyPrediction(float press, bool rain) {
  if (rain) return "WARNING";
  if (lastPressure > 0 && (lastPressure - press) > pressureDrop) return "CRITICAL";
  if (press < 990) return "WARNING";
  return "SAFE";
}

void moveServo(int angle) {
  windowServo.write(angle);
  Serial.print("Servo → ");
  Serial.println(angle);
}

void publishTelemetry(float temp, float hum, float press, int lightRaw, bool rain, float bat) {
  StaticJsonDocument<384> doc;
  doc["deviceId"]   = DEVICE_ID;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;
  doc["pressure"]    = press;
  doc["rain"]        = rain;
  doc["light"]       = classifyLight(lightRaw);
  doc["battery"]     = bat;
  doc["window"]      = windowState;
  doc["mode"]        = currentModeStr;
  doc["prediction"]  = prediction;
  doc["reason"]      = reason;
  doc["timestamp"]   = "";

  char buffer[384];
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
  doc["firmware"]    = "2.0.0";
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
      mqtt.subscribe(TOPIC_PRESENCE, 1);
      Serial.println("Subscribed: window/control, window/config, home/presence");
    } else {
      Serial.print("failed (rc=");
      Serial.print(mqtt.state());
      Serial.println(") retrying in 5s");
      delay(5000);
    }
  }
}
