export const MQTT_TOPICS = {
  TELEMETRY: "window/telemetry",
  STATUS: "window/status",
  EVENTS: "window/events",
  SYSTEM: "window/system",
  CONTROL: "window/control",
  CONFIG: "window/config",
  PRESENCE: "home/presence",
} as const;

export const MQTT_COMMANDS = {
  AUTO: "AUTO",
  FORCE_OPEN: "FORCE_OPEN",
  FORCE_CLOSE: "FORCE_CLOSE",
  STOP_AUTOMATION: "STOP_AUTOMATION",
  RESTART_DEVICE: "RESTART_DEVICE",
  PING_DEVICE: "PING_DEVICE",
} as const;

export const THREAT_COLORS: Record<string, string> = {
  SAFE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  WARNING: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  CRITICAL: "text-red-400 bg-red-500/10 border-red-500/30",
};

export const PRESENCE_OPTIONS = [
  { value: "HOME" as const, label: "Home", icon: "House", color: "bg-emerald-600 hover:bg-emerald-500", description: "Window automation active — system manages comfort" },
  { value: "AWAY" as const, label: "Away", icon: "DoorOpen", color: "bg-amber-600 hover:bg-amber-500", description: "Window secured — all openings closed for security" },
  { value: "VACATION" as const, label: "Vacation", icon: "Plane", color: "bg-purple-600 hover:bg-purple-500", description: "Extended lockdown — window stays closed until you return" },
] as const;

export const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  SAFE: { label: "All Parameters Normal", icon: "check-circle", color: "text-emerald-400" },
  RAIN: { label: "Rain Detected", icon: "cloud-rain", color: "text-blue-400" },
  STORM_PREDICTION: { label: "Storm Predicted", icon: "cloud-lightning", color: "text-purple-400" },
  HIGH_HUMIDITY: { label: "High Humidity", icon: "droplets", color: "text-cyan-400" },
  NIGHT_SECURITY: { label: "Night Security", icon: "moon", color: "text-indigo-400" },
  LOW_BATTERY: { label: "Low Battery", icon: "battery-warning", color: "text-red-400" },
  TEMP_LIMIT: { label: "Temperature Limit", icon: "thermometer", color: "text-orange-400" },
};

export const SENSOR_THRESHOLDS = {
  temp: { min: -10, max: 50, danger: { low: 5, high: 40 } },
  humidity: { min: 0, max: 100, danger: { low: 20, high: 85 } },
  pressure: { min: 900, max: 1100, danger: { low: 970, high: 1040 } },
  battery: { min: 0, max: 100, danger: { low: 20, high: 100 } },
} as const;

export const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { path: "/sensors", label: "Live Sensors", icon: "Activity" },
  { path: "/analytics", label: "Analytics", icon: "BarChart3" },
  { path: "/control", label: "Control Center", icon: "SlidersHorizontal" },
  { path: "/events", label: "Event Timeline", icon: "Clock" },
  { path: "/health", label: "Device Health", icon: "HeartPulse" },
  { path: "/settings", label: "Settings", icon: "Settings" },
  { path: "/about", label: "About", icon: "Info" },
] as const;
