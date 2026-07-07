/*
 * ──────────────────────────────────────────────
 * IoT Weather Station - ESP32 Firmware
 * MMUST Industrial IoT Capstone Project
 * 
 * Hardware:
 *   - ESP32 NodeMCU
 *   - DHT22 (Temperature & Humidity)
 *   - BMP280 (Pressure & Altitude)
 *   - YL-83 (Rain Detection)
 *   - LDR (Ambient Light)
 * 
 * Communication:
 *   - MQTT over WiFi
 *   - Publishes to: weather/live
 * 
 * Interval:
 *   - Reads sensors every 30 seconds
 * ──────────────────────────────────────────────
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Adafruit_BMP280.h>
#include <ArduinoJson.h>

// ─── WiFi Configuration ───────────────────────
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── MQTT Configuration ───────────────────────
const char* MQTT_BROKER = "YOUR_SERVER_IP";
const int   MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-weather-station";
const char* MQTT_TOPIC_LIVE = "weather/live";
const char* MQTT_TOPIC_STATUS = "weather/status";
const char* MQTT_TOPIC_LOGS = "weather/device/logs";
const char* DEVICE_ID = "station-001";

// ─── Pin Definitions ──────────────────────────
#define DHT_PIN      4
#define DHT_TYPE     DHT22
#define BMP_CS       5
#define LDR_PIN      34
#define RAIN_PIN     35
#define BATTERY_PIN  32

// ─── Sensor Objects ───────────────────────────
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP280 bmp;

// ─── MQTT Client ──────────────────────────────
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ─── Timing ───────────────────────────────────
const unsigned long READ_INTERVAL = 30000;
unsigned long lastReadTime = 0;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000;

// ─── Calibration ──────────────────────────────
const float VOLTAGE_DIVIDER_RATIO = 2.0;
const float ADC_MAX_VOLTAGE = 3.3;
const int ADC_RESOLUTION = 4095;

// ─── Forward Declarations ─────────────────────
void connectWiFi();
void connectMQTT();
void publishReading();
void publishLog(const char* message);
String getFormattedTimestamp();

void setup() {
  Serial.begin(115200);
  Serial.println(F("\n═══════════════════════════════════"));
  Serial.println(F("  IoT Weather Station - ESP32"));
  Serial.println(F("  MMUST Industrial IoT Project"));
  Serial.println(F("═══════════════════════════════════\n"));

  // Initialize sensors
  dht.begin();
  Serial.println(F("[OK] DHT22 initialized"));

  if (!bmp.begin(0x76)) {
    Serial.println(F("[WARN] BMP280 not found at 0x76, trying 0x77"));
    if (!bmp.begin(0x77)) {
      Serial.println(F("[ERROR] BMP280 initialization failed!"));
    }
  } else {
    Serial.println(F("[OK] BMP280 initialized"));
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,
                    Adafruit_BMP280::SAMPLING_X16,
                    Adafruit_BMP280::FILTER_X16,
                    Adafruit_BMP280::STANDBY_MS_500);
  }

  // Configure ADC
  analogReadResolution(12);
  pinMode(LDR_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);

  Serial.println(F("[OK] ADC pins configured"));

  // Connect to WiFi
  connectWiFi();

  // Configure MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  publishLog("System initialized");
}

void loop() {
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttempt > RECONNECT_INTERVAL) {
      lastReconnectAttempt = now;
      connectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL) {
    lastReadTime = now;
    publishReading();
  }
}

void connectWiFi() {
  Serial.print(F("Connecting to WiFi"));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("[OK] WiFi connected. IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println(F("[ERROR] WiFi connection failed!"));
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  Serial.print(F("Connecting to MQTT broker..."));

  if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_TOPIC_STATUS, 1, true, "{\"status\":\"offline\",\"deviceId\":\"station-001\"}")) {
    Serial.println(F(" connected"));

    // Publish status
    String statusPayload = "{\"status\":\"online\",\"deviceId\":\"station-001\",\"timestamp\":\"";
    statusPayload += getFormattedTimestamp();
    statusPayload += "\"}";
    mqttClient.publish(MQTT_TOPIC_STATUS, statusPayload.c_str(), true);
  } else {
    Serial.print(F(" failed, rc="));
    Serial.println(mqttClient.state());
  }
}

void publishReading() {
  // Read DHT22
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println(F("[ERROR] Failed to read DHT22"));
    publishLog("DHT22 read error");
    return;
  }

  // Read BMP280
  float pressure = 0;
  float altitude = 0;

  if (bmp.begin()) {
    pressure = bmp.readPressure() / 100.0F;
    altitude = bmp.readAltitude(1013.25);
  } else {
    Serial.println(F("[WARN] BMP280 not available"));
    pressure = 1013.25;
    altitude = 0;
  }

  // Read LDR (Light)
  int ldrRaw = analogRead(LDR_PIN);
  float ldrVoltage = (ldrRaw / (float)ADC_RESOLUTION) * ADC_MAX_VOLTAGE;
  int lightLux = (int)(ldrVoltage * 1000);

  // Read Rain Sensor
  int rainRaw = analogRead(RAIN_PIN);
  bool rainDetected = rainRaw < 2000;

  // Read Battery Voltage
  int battRaw = analogRead(BATTERY_PIN);
  float battVoltage = (battRaw / (float)ADC_RESOLUTION) * ADC_MAX_VOLTAGE * VOLTAGE_DIVIDER_RATIO;
  float batteryPercent = constrain(map(battVoltage * 100, 300, 420, 0, 10000) / 100.0, 0.0, 100.0);

  // Print to Serial
  Serial.println(F("──────────────────────────────"));
  Serial.printf("Temp:      %.1f °C\n", temperature);
  Serial.printf("Humidity:  %.1f %%\n", humidity);
  Serial.printf("Pressure:  %.1f hPa\n", pressure);
  Serial.printf("Altitude:  %.1f m\n", altitude);
  Serial.printf("Light:     %d lux\n", lightLux);
  Serial.printf("Rain:      %s\n", rainDetected ? "YES" : "NO");
  Serial.printf("Battery:   %.1f %%\n", batteryPercent);

  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"] = round(humidity * 10) / 10.0;
  doc["pressure"] = round(pressure * 10) / 10.0;
  doc["altitude"] = round(altitude * 10) / 10.0;
  doc["light"] = lightLux;
  doc["rain"] = rainDetected;
  doc["battery"] = round(batteryPercent * 10) / 10.0;
  doc["timestamp"] = getFormattedTimestamp();

  char buffer[512];
  size_t n = serializeJson(doc, buffer);

  if (mqttClient.publish(MQTT_TOPIC_LIVE, buffer, false)) {
    Serial.println(F("[OK] Published to weather/live"));
  } else {
    Serial.println(F("[ERROR] Failed to publish MQTT message"));
  }
  Serial.println(F("──────────────────────────────\n"));
}

void publishLog(const char* message) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["message"] = message;
  doc["timestamp"] = getFormattedTimestamp();

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(MQTT_TOPIC_LOGS, buffer);
}

String getFormattedTimestamp() {
  // Note: For production, use NTP time sync
  // This returns a placeholder ISO timestamp
  return "2026-01-01T00:00:00.000Z";
}
