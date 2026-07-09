import { useEffect } from "react";
import { mqttService } from "../services/mqtt";
import { useAppStore } from "../stores/useAppStore";
import type { TelemetryPayload, PresencePayload, DeviceStatus, SystemEvent, ConnectionStatus } from "../types";

export function useMqtt() {
  const { setConnection, setTelemetry, setDeviceStatus, setPresence, addEvent } = useAppStore();

  useEffect(() => {
    mqttService.connect();

    const unsubs = [
      mqttService.on("connection", (s: ConnectionStatus) => setConnection(s)),
      mqttService.on("telemetry", (t: TelemetryPayload) => {
        setTelemetry(t);
        addEvent({
          id: crypto.randomUUID(),
          type: t.rain ? "warning" : "info",
          message: t.rain ? "Rain detected — window may close" : `Telemetry: ${t.temperature}°C, ${t.humidity}%`,
          timestamp: t.timestamp || new Date().toISOString(),
        });
      }),
      mqttService.on("status", (s: DeviceStatus) => setDeviceStatus(s)),
      mqttService.on("events", (e: SystemEvent) => addEvent(e)),
      mqttService.on("presence", (p: PresencePayload) => {
        setPresence(p.mode);
        addEvent({
          id: crypto.randomUUID(),
          type: "info",
          message: `Presence changed to ${p.mode} by ${p.user}`,
          timestamp: p.timestamp || new Date().toISOString(),
        });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [setConnection, setTelemetry, setDeviceStatus, setPresence, addEvent]);

  return mqttService;
}
