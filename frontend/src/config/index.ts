export const mqttConfig = {
  brokerUrl: import.meta.env.VITE_MQTT_BROKER_URL || "wss://localhost:8884/mqtt",
  username: import.meta.env.VITE_MQTT_USERNAME || "",
  password: import.meta.env.VITE_MQTT_PASSWORD || "",
  clientPrefix: import.meta.env.VITE_MQTT_CLIENT_PREFIX || "dashboard",
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  qos: 1 as const,
};
