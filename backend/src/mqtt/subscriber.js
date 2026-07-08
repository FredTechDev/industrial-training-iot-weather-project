const mqtt = require("mqtt");
const config = require("../config");
const logger = require("../utils/logger");
const { validateSensorReading, sanitizeReading } = require("../utils/validation");
const weatherService = require("../services/weatherService");
const alertEngine = require("../services/alertEngine");
const aiService = require("../services/aiService");
const socketService = require("../services/socketService");

class MqttSubscriber {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  connect() {
    const options = {
      clientId: `${config.mqtt.clientId}-${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      rejectUnauthorized: false,
      username: config.mqtt.username || undefined,
      password: config.mqtt.password || undefined,
      // will not used — HiveMQ Cloud free tier restricts will messages
    };

    this.client = mqtt.connect(config.mqtt.brokerUrl, options);

    this.client.on("connect", () => {
      logger.info(`Connected to MQTT broker at ${config.mqtt.brokerUrl}`);
      this.connected = true;

      this.client.subscribe(config.mqtt.subscribeTopic, { qos: config.mqtt.qos }, (err) => {
        if (err) {
          logger.error("Failed to subscribe to topics", { error: err.message });
        } else {
          logger.info(`Subscribed to ${config.mqtt.subscribeTopic}`);
        }
      });
    });

    this.client.on("message", (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.client.on("error", (err) => {
      logger.error("MQTT connection error", { error: err.message });
    });

    this.client.on("close", () => {
      this.connected = false;
      logger.warn("MQTT connection closed");
    });

    this.client.on("offline", () => {
      this.connected = false;
      logger.warn("MQTT client went offline");
    });
  }

  async handleMessage(topic, payload) {
    try {
      const raw = payload.toString();
      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        logger.warn("Invalid JSON on topic", { topic, payload: raw.substring(0, 200) });
        return;
      }

      logger.debug(`MQTT message on ${topic}`, { deviceId: data.deviceId });

      switch (topic) {
        case config.mqtt.topics.live:
          await this.handleLiveReading(data);
          break;
        case config.mqtt.topics.status:
          await this.handleDeviceStatus(data);
          break;
        case config.mqtt.topics.system:
          await this.handleSystemMessage(data);
          break;
        case config.mqtt.topics.logs:
          await this.handleDeviceLogs(data);
          break;
        default:
          logger.debug("Unhandled topic", { topic });
      }
    } catch (err) {
      logger.error("Error handling MQTT message", { error: err.message, topic });
    }
  }

  async handleLiveReading(data) {
    const validation = validateSensorReading(data);
    if (!validation.valid) {
      logger.warn("Invalid sensor reading rejected", { errors: validation.errors, deviceId: data.deviceId });
      this.publishAlert("warning", "Invalid Sensor Data", `Validation failed: ${validation.errors.join("; ")}`);
      return;
    }

    const reading = sanitizeReading(data);
    const saved = await weatherService.saveReading(reading);
    if (!saved) return;

    socketService.broadcast("weather:reading", saved);

    const trends = await weatherService.computeTrends(reading.deviceId);
    socketService.broadcast("weather:trends", trends);

    await weatherService.updateDeviceStatus(reading.deviceId);

    const alerts = await alertEngine.evaluateReading(saved, trends);
    for (const alert of alerts) {
      socketService.broadcast("weather:alert", alert);
      this.publishAlert(alert.severity, alert.title, alert.message);
    }

    if (await aiService.shouldGenerateReport(saved)) {
      aiService.generateReport(saved, trends).then((report) => {
        if (report) {
          socketService.broadcast("weather:report", report);
        }
      }).catch((err) => {
        logger.error("Failed to generate AI report", { error: err.message });
      });
    }
  }

  async handleDeviceStatus(data) {
    logger.info("Device status update", { deviceId: data.deviceId, status: data.status });
    await weatherService.updateDeviceStatus(data.deviceId, data.status);
    socketService.broadcast("weather:status", data);
  }

  async handleSystemMessage(data) {
    logger.info("System message", { data });
    socketService.broadcast("weather:system", data);
  }

  async handleDeviceLogs(data) {
    logger.info("Device log", { deviceId: data.deviceId, message: data.message });
  }

  publishStatus(status) {
    if (!this.client || !this.connected) return;
    this.client.publish(
      config.mqtt.topics.status,
      JSON.stringify({ status, deviceId: "backend", timestamp: new Date().toISOString() }),
      { qos: 1 }
    );
  }

  publishAlert(severity, title, message) {
    if (!this.client || !this.connected) return;
    this.client.publish(
      config.mqtt.topics.alerts,
      JSON.stringify({ severity, title, message, timestamp: new Date().toISOString() }),
      { qos: 1 }
    );
  }

  disconnect() {
    if (this.client) {
      this.publishStatus("offline");
      this.client.end(true);
    }
  }
}

module.exports = new MqttSubscriber();
