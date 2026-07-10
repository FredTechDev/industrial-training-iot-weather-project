export interface TelemetryPayload {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  light: number | null;
  lightState: "DAY" | "NIGHT" | null;
  rain: boolean | null;
  rainIntensity: number | null;
  line: "EXTENDED" | "RETRACTED";
  mode: "AUTO" | "MANUAL";
  prediction: "SAFE" | "WARNING" | "CRITICAL";
  reason: string;
  owmTemperature: number | null;
  owmHumidity: number | null;
  owmPressure: number | null;
  pressureTrend: string;
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
  nightLightThreshold: number;
  telemetryInterval: number;
}

export type LineMode = "AUTO" | "FORCE_EXTEND" | "FORCE_RETRACT" | "STOP_AUTOMATION" | "RESTART_DEVICE" | "PING_DEVICE";

export type ThreatLevel = "SAFE" | "WARNING" | "CRITICAL";

export type PresenceMode = "HOME" | "AWAY" | "VACATION";

export interface PresencePayload {
  mode: PresenceMode;
  user: string;
  timestamp: string;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
