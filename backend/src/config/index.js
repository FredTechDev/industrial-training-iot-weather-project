const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3001,
  backendUrl: process.env.BACKEND_URL || "http://localhost:3001",

  database: {
    url: process.env.DATABASE_URL || "postgresql://weather:weather@localhost:5432/weather_db",
  },

  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
    username: process.env.MQTT_USERNAME || "",
    password: process.env.MQTT_PASSWORD || "",
    clientId: process.env.MQTT_CLIENT_ID || "weather-backend",
    topics: {
      live: "weather/live",
      alerts: "weather/alerts",
      status: "weather/status",
      system: "weather/system",
      logs: "weather/device/logs",
    },
    subscribeTopic: "weather/#",
    qos: 1,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  },

  simulator: {
    enabled: process.env.SIMULATOR_MODE === "true",
    interval: parseInt(process.env.SIMULATOR_INTERVAL, 10) || 30,
    deviceId: process.env.SIMULATOR_DEVICE_ID || "station-001",
  },

  thresholds: {
    maxTemperature: 60,
    minTemperature: -20,
    maxHumidity: 100,
    minHumidity: 0,
    maxPressure: 1100,
    minPressure: 700,
    maxAltitude: 5000,
    minAltitude: -500,
    maxLight: 100000,
    minLight: 0,
    maxBattery: 100,
    minBattery: 0,
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

module.exports = config;
