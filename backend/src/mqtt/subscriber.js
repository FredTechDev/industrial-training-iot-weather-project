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

      // Also subscribe to presence topic
      this.client.subscribe("home/presence", { qos: config.mqtt.qos }, (err) => {
        if (!err) logger.info("Subscribed to home/presence");
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

      logger.debug(`MQTT message on ${topic}`);

      switch (topic) {
        case config.mqtt.topics.telemetry:
          await this.handleTelemetry(data);
          break;
        case config.mqtt.topics.control:
          this.handleControlCommand(data);
          break;
        case config.mqtt.topics.status:
          await this.handleDeviceStatus(data);
          break;
        case config.mqtt.topics.events:
          this.handleEvent(data);
          break;
        case config.mqtt.topics.system:
          await this.handleSystemMessage(data);
          break;
        case "home/presence":
          this.handlePresence(data);
          break;
        default:
          logger.debug("Unhandled topic", { topic });
      }
    } catch (err) {
      logger.error("Error handling MQTT message", { error: err.message, topic });
    }
  }

  async handleTelemetry(data) {
    const deviceId = data.deviceId || "station-001";
    const reading = {
      deviceId,
      temperature: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
      altitude: 0,
      light: data.light === "DAY" ? 3000 : 100,
      rain: data.rain,
      battery: data.battery,
    };

    const validation = validateSensorReading(reading);
    if (!validation.valid) {
      logger.warn("Sensor reading rejected", { errors: validation.errors });
      return;
    }

    const sanitized = sanitizeReading(reading);
    const saved = await weatherService.saveReading(sanitized);
    if (!saved) return;

    // Broadcast to any Socket.IO clients (legacy pages)
    socketService.broadcast("weather:reading", saved);

    const trends = await weatherService.computeTrends(saved.deviceId);
    socketService.broadcast("weather:trends", trends);

    await weatherService.updateDeviceStatus(saved.deviceId);

    const alerts = await alertEngine.evaluateReading(saved, trends);
    for (const alert of alerts) {
      socketService.broadcast("weather:alert", alert);
      this.publishAlert(alert.severity, alert.title, alert.message);
    }

    if (await aiService.shouldGenerateReport(saved)) {
      aiService.generateReport(saved, trends).then((report) => {
        if (report) socketService.broadcast("weather:report", report);
      }).catch((err) => {
        logger.error("Failed to generate AI report", { error: err.message });
      });
    }
  }

  handleControlCommand(data) {
    const command = typeof data === "string" ? data : data?.command;
    if (["AUTO", "FORCE_CLOSE", "FORCE_OPEN", "STOP_AUTOMATION", "RESTART_DEVICE", "PING_DEVICE"].includes(command)) {
      logger.info(`Control command: ${command}`);
      socketService.broadcast("window:command", { command, timestamp: new Date().toISOString() });
    } else {
      logger.warn("Invalid control command", { data });
    }
  }

  async handleDeviceStatus(data) {
    const deviceId = data.deviceId || "station-001";
    logger.info("Device status", { deviceId, online: data.online, uptime: data.uptime });
    await weatherService.updateDeviceStatus(deviceId, data.online ? "online" : "offline");
    socketService.broadcast("window:status", data);
  }

  handleEvent(data) {
    logger.info("Device event", { type: data.type, message: data.message });
    socketService.broadcast("window:event", data);
  }

  handlePresence(data) {
    logger.info("Presence update", { mode: data.mode, user: data.user });
    socketService.broadcast("window:presence", data);
  }

  async handleSystemMessage(data) {
    logger.info("System message", { data });
    socketService.broadcast("window:system", data);
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
      this.client.end(true);
    }
  }
}

module.exports = new MqttSubscriber();
