const mqtt = require("mqtt");
const config = require("../config");
const logger = require("../utils/logger");
const { validateSensorReading, sanitizeReading } = require("../utils/validation");
const weatherService = require("../services/weatherService");
const alertEngine = require("../services/alertEngine");
const socketService = require("../services/socketService");
const weatherApiService = require("../services/weatherApiService");

class MqttSubscriber {
  constructor() {
    this.client = null;
    this.connected = false;
    this.pressureHistory = [];
    this.lastPressure = null;
    this.weatherInterval = null;
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

    // Start periodic OWM publisher after connection
    this.client.on("connect", () => {
      this.startWeatherPublisher();
    });
  }

  startWeatherPublisher() {
    // Publish immediately on connect
    this.publishWeatherToEsp32();

    // Then every 5 minutes
    if (this.weatherInterval) clearInterval(this.weatherInterval);
    this.weatherInterval = setInterval(() => {
      this.publishWeatherToEsp32();
    }, 5 * 60 * 1000);

    logger.info("OWM weather publisher started (every 5 minutes)");
  }

  async publishWeatherToEsp32() {
    try {
      const apiData = await weatherApiService.getCurrentWeather();
      if (!apiData) {
        logger.warn("No OWM data available for ESP32 publish");
        return;
      }

      // Track pressure history for trend computation
      if (apiData.pressure) {
        this.pressureHistory.push({
          pressure: apiData.pressure,
          time: Date.now(),
        });
        // Keep last 12 readings (1 hour at 5min intervals)
        if (this.pressureHistory.length > 12) {
          this.pressureHistory.shift();
        }
      }

      // Compute pressure trend
      let pressureTrend = "stable";
      let pressureRate = 0;
      if (this.pressureHistory.length >= 2) {
        const oldest = this.pressureHistory[0];
        const newest = this.pressureHistory[this.pressureHistory.length - 1];
        const timeDiffHours = (newest.time - oldest.time) / (1000 * 60 * 60);
        if (timeDiffHours > 0) {
          pressureRate = (newest.pressure - oldest.pressure) / timeDiffHours;
          if (pressureRate < -1.0) pressureTrend = "dropping";
          else if (pressureRate > 1.0) pressureTrend = "rising";
        }
      }

      // Publish to ESP32
      const weatherPayload = {
        temperature: apiData.temperature,
        humidity: apiData.humidity,
        pressure: apiData.pressure,
        description: apiData.description || "",
        pressureTrend,
        pressureRate: Math.round(pressureRate * 100) / 100,
        fetchedAt: new Date().toISOString(),
      };

      if (this.client && this.connected) {
        this.client.publish(
          config.mqtt.topics.weather,
          JSON.stringify(weatherPayload),
          { qos: 1 }
        );
        logger.info("Published weather data to ESP32", {
          temp: weatherPayload.temperature,
          humidity: weatherPayload.humidity,
          pressure: weatherPayload.pressure,
          trend: pressureTrend,
          rate: pressureRate,
        });
      }
    } catch (err) {
      logger.error("Failed to publish weather to ESP32", { error: err.message });
    }
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

    const apiData = await weatherApiService.getCurrentWeather();

    const reading = {
      deviceId,
      temperature: apiData?.temperature ?? null,
      humidity: apiData?.humidity ?? null,
      pressure: apiData?.pressure ?? null,
      light: typeof data.light === "number" ? data.light : null,
      lightState: data.lightState || (typeof data.light === "string" ? data.light : null),
      rain: typeof data.rain === "boolean" ? data.rain : null,
      rainIntensity: typeof data.rainIntensity === "number" ? data.rainIntensity : null,
      owmTemperature: data.owmTemperature ?? null,
      owmHumidity: data.owmHumidity ?? null,
      owmPressure: data.owmPressure ?? null,
      pressureTrend: data.pressureTrend || "stable",
    };

    const validation = validateSensorReading(reading);
    if (!validation.valid) {
      logger.warn("Sensor reading rejected", { errors: validation.errors });
      return;
    }

    const sanitized = sanitizeReading(reading);
    const saved = await weatherService.saveReading(sanitized);
    if (!saved) return;

    const broadcast = { ...saved, lightState: reading.lightState, rainIntensity: reading.rainIntensity, owmTemperature: reading.owmTemperature, owmHumidity: reading.owmHumidity, owmPressure: reading.owmPressure, pressureTrend: reading.pressureTrend };

    // Broadcast to any Socket.IO clients (legacy pages)
    socketService.broadcast("weather:reading", broadcast);

    const trends = await weatherService.computeTrends(saved.deviceId);
    socketService.broadcast("weather:trends", trends);

    await weatherService.updateDeviceStatus(saved.deviceId);

    const alerts = await alertEngine.evaluateReading(saved, trends);
    for (const alert of alerts) {
      socketService.broadcast("weather:alert", alert);
      this.publishAlert(alert.severity, alert.title, alert.message);
    }
  }

  handleControlCommand(data) {
    const command = typeof data === "string" ? data : data?.command;
    if (["AUTO", "FORCE_RETRACT", "FORCE_EXTEND", "STOP_AUTOMATION", "RESTART_DEVICE", "PING_DEVICE"].includes(command)) {
      logger.info(`Control command: ${command}`);
      socketService.broadcast("line:command", { command, timestamp: new Date().toISOString() });
    } else {
      logger.warn("Invalid control command", { data });
    }
  }

  async handleDeviceStatus(data) {
    const deviceId = data.deviceId || "station-001";
    logger.info("Device status", { deviceId, online: data.online, uptime: data.uptime });
    await weatherService.updateDeviceStatus(deviceId, data.online ? "online" : "offline");
    socketService.broadcast("line:status", data);
  }

  handleEvent(data) {
    logger.info("Device event", { type: data.type, message: data.message });
    socketService.broadcast("line:event", data);
  }

  handlePresence(data) {
    logger.info("Presence update", { mode: data.mode, user: data.user });
    socketService.broadcast("line:presence", data);
  }

  async handleSystemMessage(data) {
    logger.info("System message", { data });
    socketService.broadcast("line:system", data);
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
    if (this.weatherInterval) clearInterval(this.weatherInterval);
    if (this.client) {
      this.client.end(true);
    }
  }
}

module.exports = new MqttSubscriber();
