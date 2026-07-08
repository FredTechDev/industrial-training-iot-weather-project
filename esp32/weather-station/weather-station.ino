#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// --- WiFi ---
const char* WIFI_SSID = "your_wifi_ssid";
const char* WIFI_PASS = "your_wifi_password";

const char* MQTT_HOST = "6f83a2bd234445aca1060e89e6171e19.s1.eu.hivemq.cloud";
const int  MQTT_PORT = 8883;
const bool MQTT_TLS  = true;
const char* MQTT_USER = "mmust-iot-001";
const char* MQTT_PASS = "Fred1234";

const char* DEVICE_ID = "station-001";
const char* TOPIC_LIVE = "weather/live";
const char* TOPIC_STATUS = "weather/status";

// --- Sensor pins ---
#define DHT22_PIN 4
#define BMP280_ADDR 0x76
#define LIGHT_SENSOR_PIN 34
#define RAIN_SENSOR_PIN 35
#define BATTERY_PIN 32

WiFiClient wifiClient;
WiFiClientSecure tlsClient;
PubSubClient mqtt(MQTT_TLS ? tlsClient : wifiClient);

unsigned long lastPublish = 0;
const long PUBLISH_INTERVAL = 30000;

void connectWiFi();
void connectMQTT();
void publishReading(float temp, float hum, float press, float alt, int light, bool rain, float bat);
void publishStatus(const char* state);

void setup() {
  Serial.begin(115200);

  if (MQTT_TLS) tlsClient.setInsecure();  // skip certificate fingerprint check

  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);

  connectWiFi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = millis();

    // --- Read sensors (replace with actual sensor libraries) ---
    float temp = 25.0 + random(-50, 50) / 10.0;
    float hum  = 60.0 + random(-100, 100) / 10.0;
    float press = 1008.0 + random(-20, 20) / 10.0;
    float alt  = 1780.0;
    int light   = analogRead(LIGHT_SENSOR_PIN);
    bool rain   = digitalRead(RAIN_SENSOR_PIN) == LOW;
    float bat   = analogRead(BATTERY_PIN) / 4095.0 * 3.3 * 2;

    publishReading(temp, hum, press, alt, light, rain, bat);
  }
}

void publishReading(float temp, float hum, float press, float alt, int light, bool rain, float bat) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["pressure"] = press;
  doc["altitude"] = alt;
  doc["light"] = light;
  doc["rain"] = rain;
  doc["battery"] = bat;
  doc["timestamp"] = "";

  char buffer[256];
  size_t n = serializeJson(doc, buffer);
  mqtt.publish(TOPIC_LIVE, buffer, n);
  Serial.print("Published: ");
  Serial.println(buffer);
}

void publishStatus(const char* state) {
  StaticJsonDocument<128> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = state;
  char buffer[128];
  serializeJson(doc, buffer);
  mqtt.publish(TOPIC_STATUS, buffer, false);
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
      publishStatus("online");
    } else {
      Serial.print("failed (rc=");
      Serial.print(mqtt.state());
      Serial.println(") retrying in 5s");
      delay(5000);
    }
  }
}
