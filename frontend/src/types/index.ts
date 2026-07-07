export interface WeatherReading {
  id: string;
  deviceId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  altitude: number;
  light: number;
  rain: boolean;
  battery: number;
  recordedAt: string;
  createdAt: string;
}

export interface AiReport {
  id: string;
  readingId: string;
  summary: string;
  prediction: string;
  forecast: string;
  recommendation: string;
  confidence: number;
  reasoning: string;
  createdAt: string;
  reading?: WeatherReading;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  status: "active" | "acknowledged" | "resolved";
  createdAt: string;
  resolvedAt?: string;
}

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  firmwareVersion: string;
  lastSeen: string;
  status: "online" | "offline" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface TrendStats {
  period: string;
  sampleCount: number;
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  avgPressure: number;
  minPressure: number;
  maxPressure: number;
  avgLight: number;
  rainCount: number;
}

export interface TrendData {
  current: WeatherReading | null;
  shortTerm: TrendStats;
  hourly: TrendStats;
  sixHour: TrendStats;
  pressure: {
    direction: string;
    rate: number;
    description: string;
  };
  temperature: {
    direction: string;
    rate: number;
    description: string;
  };
  humidity: {
    direction: string;
    rate: number;
    description: string;
  };
  light: {
    direction: string;
    rate: number;
    description: string;
  };
  rainFrequency: {
    frequency: number;
    description: string;
  };
}

export interface SystemStatus {
  uptime: number;
  totalReadings: number;
  lastHourReadings: number;
  activeAlerts: number;
  devices: Device[];
  latestReading: WeatherReading | null;
  websocketClients: number;
  timestamp: string;
}

export interface ChartDataPoint {
  recordedAt: string;
  temperature: number;
  humidity: number;
  pressure: number;
  light: number;
  rain: boolean;
}
