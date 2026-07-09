import mqtt, { MqttClient } from "mqtt";
import { mqttConfig } from "../config";
import { MQTT_TOPICS } from "../constants";
import type { TelemetryPayload, DeviceStatus, SystemEvent, ConnectionStatus, PresencePayload } from "../types";

type Callback<T> = (data: T) => void;

class MqttService {
  private client: MqttClient | null = null;
  private _status: ConnectionStatus = "disconnected";
  private _lastTelemetry: TelemetryPayload | null = null;

  private listeners = {
    telemetry: new Set<Callback<TelemetryPayload>>(),
    status: new Set<Callback<DeviceStatus>>(),
    events: new Set<Callback<SystemEvent>>(),
    system: new Set<Callback<unknown>>(),
    presence: new Set<Callback<PresencePayload>>(),
    connection: new Set<Callback<ConnectionStatus>>(),
  };

  get status() { return this._status; }
  get lastTelemetry() { return this._lastTelemetry; }
  get connected() { return this._status === "connected"; }

  connect() {
    if (this.client?.connected) return;

    const clientId = `${mqttConfig.clientPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    this.client = mqtt.connect(mqttConfig.brokerUrl, {
      clientId,
      username: mqttConfig.username,
      password: mqttConfig.password,
      clean: true,
      connectTimeout: mqttConfig.connectTimeout,
      reconnectPeriod: mqttConfig.reconnectPeriod,
      rejectUnauthorized: false,
    });

    this.client.on("connect", () => {
      this.setStatus("connected");
      this.subscribeAll();
    });

    this.client.on("message", (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        this.handleMessage(topic, data);
      } catch { /* ignore malformed */ }
    });

    this.client.on("error", () => this.setStatus("disconnected"));
    this.client.on("close", () => this.setStatus("disconnected"));
    this.client.on("reconnect", () => this.setStatus("reconnecting"));
    this.client.on("offline", () => this.setStatus("disconnected"));
  }

  private subscribeAll() {
    if (!this.client) return;
    // Subscribe to all read topics (not CONTROL, CONFIG, or PRESENCE — those are publish-only)
    const readTopics = [
      MQTT_TOPICS.TELEMETRY,
      MQTT_TOPICS.STATUS,
      MQTT_TOPICS.EVENTS,
      MQTT_TOPICS.SYSTEM,
    ];
    readTopics.forEach((topic) => {
      this.client!.subscribe(topic, { qos: mqttConfig.qos });
    });
  }

  private handleMessage(topic: string, data: Record<string, unknown>) {
    switch (topic) {
      case MQTT_TOPICS.TELEMETRY: {
        const t = data as unknown as TelemetryPayload;
        this._lastTelemetry = t;
        this.listeners.telemetry.forEach((cb) => cb(t));
        break;
      }
      case MQTT_TOPICS.STATUS:
        this.listeners.status.forEach((cb) => cb(data as unknown as DeviceStatus));
        break;
      case MQTT_TOPICS.EVENTS:
        this.listeners.events.forEach((cb) => cb(data as unknown as SystemEvent));
        break;
      case MQTT_TOPICS.SYSTEM:
        this.listeners.system.forEach((cb) => cb(data));
        break;
      case MQTT_TOPICS.PRESENCE:
        this.listeners.presence.forEach((cb) => cb(data as unknown as PresencePayload));
        break;
    }
  }

  publish(topic: string, message: string) {
    if (!this.client?.connected) return false;
    this.client.publish(topic, message, { qos: mqttConfig.qos });
    return true;
  }

  publishControl(command: string) {
    return this.publish(MQTT_TOPICS.CONTROL, command);
  }

  publishConfig(config: Record<string, unknown>) {
    return this.publish(MQTT_TOPICS.CONFIG, JSON.stringify(config));
  }

  publishPresence(mode: "HOME" | "AWAY" | "VACATION", user = "Fredrick") {
    const payload = JSON.stringify({
      mode,
      user,
      timestamp: new Date().toISOString(),
    });
    return this.publish(MQTT_TOPICS.PRESENCE, payload);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: any): () => void {
    const set = this.listeners[event as keyof typeof this.listeners];
    if (set) (set as Set<Callback<unknown>>).add(callback);
    return () => { if (set) (set as Set<Callback<unknown>>).delete(callback); };
  }

  private setStatus(s: ConnectionStatus) {
    this._status = s;
    this.listeners.connection.forEach((cb) => cb(s));
  }

  disconnect() {
    this.client?.end(true);
    this.client = null;
    this.setStatus("disconnected");
  }
}

export const mqttService = new MqttService();
