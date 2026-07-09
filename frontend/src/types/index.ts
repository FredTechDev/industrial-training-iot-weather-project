export interface TelemetryPayload {
  temperature: number;
  humidity: number;
  pressure: number;
  rain: boolean;
  light: "DAY" | "NIGHT" | string;
  battery: number;
  window: "OPEN" | "CLOSED";
  mode: "AUTO" | "MANUAL";
  prediction: "SAFE" | "WARNING" | "CRITICAL";
  reason: string;
  timestamp: string;
}

export interface DeviceStatus {
  online: boolean;
  uptime: number;
  firmware: string;
  ip: string;
  wifiSignal: number;
  heapFree: number;
  mqttLatency: number;
  lastHeartbeat: string;
}

export interface SystemEvent {
  id: string;
  type: "info" | "warning" | "critical" | "success";
  message: string;
  timestamp: string;
  icon?: string;
}

export interface DeviceConfig {
  tempHigh: number;
  tempLow: number;
  humidityHigh: number;
  pressureDrop: number;
  nightLightThreshold: number;
  batteryLow: number;
  telemetryInterval: number;
}

export type WindowMode = "AUTO" | "FORCE_OPEN" | "FORCE_CLOSE" | "STOP_AUTOMATION" | "RESTART_DEVICE" | "PING_DEVICE";

export type ThreatLevel = "SAFE" | "WARNING" | "CRITICAL";

export type PresenceMode = "HOME" | "AWAY" | "VACATION";

export interface PresencePayload {
  mode: PresenceMode;
  user: string;
  timestamp: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
