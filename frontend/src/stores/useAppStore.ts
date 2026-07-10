import { create } from "zustand";
import type { TelemetryPayload, DeviceStatus, SystemEvent, ConnectionStatus, DeviceConfig, PresenceMode } from "../types";

interface AppState {
  connection: ConnectionStatus;
  telemetry: TelemetryPayload | null;
  deviceStatus: DeviceStatus | null;
  presence: PresenceMode;
  events: SystemEvent[];
  config: DeviceConfig;
  commandHistory: { command: string; timestamp: string; ack: boolean }[];
  sidebarOpen: boolean;

  setConnection: (s: ConnectionStatus) => void;
  setTelemetry: (t: TelemetryPayload) => void;
  setDeviceStatus: (s: DeviceStatus) => void;
  setPresence: (p: PresenceMode) => void;
  addEvent: (e: SystemEvent) => void;
  addCommand: (cmd: string, ack?: boolean) => void;
  updateConfig: (c: Partial<DeviceConfig>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const MAX_EVENTS = 200;
const MAX_COMMANDS = 50;

export const useAppStore = create<AppState>((set) => ({
  connection: "disconnected",
  telemetry: null,
  deviceStatus: null,
  presence: "HOME" as PresenceMode,
  events: [],
  config: {
    tempHigh: 30,
    tempLow: 18,
    humidityHigh: 80,
    nightLightThreshold: 200,
    batteryLow: 20,
    telemetryInterval: 15,
  },
  commandHistory: [],
  sidebarOpen: true,

  setConnection: (connection) => set({ connection }),
  setTelemetry: (telemetry) => set({ telemetry }),
  setDeviceStatus: (deviceStatus) => set({ deviceStatus }),
  setPresence: (presence) => set({ presence }),
  addEvent: (e) =>
    set((s) => ({ events: [e, ...s.events].slice(0, MAX_EVENTS) })),
  addCommand: (command, ack = false) =>
    set((s) => ({
      commandHistory: [
        { command, timestamp: new Date().toISOString(), ack },
        ...s.commandHistory,
      ].slice(0, MAX_COMMANDS),
    })),
  updateConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
