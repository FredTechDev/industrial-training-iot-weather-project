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
      telemetry: "window/telemetry",
      control: "window/control",
      config: "window/config",
      status: "window/status",
      events: "window/events",
      system: "window/system",
      alerts: "window/alerts",
      presence: "home/presence",
    },
    subscribeTopic: "window/#",
    qos: 1,
  },

  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY || "",
    lat: parseFloat(process.env.OPENWEATHER_LAT || "-0.0797"),
    lon: parseFloat(process.env.OPENWEATHER_LON || "34.7316"),
  },

  thresholds: {
    maxTemperature: 60,
    minTemperature: -20,
    maxHumidity: 100,
    minHumidity: 0,
    maxPressure: 1100,
    minPressure: 700,
    maxLight: 100000,
    minLight: 0,
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

module.exports = config;
