import { useMemo } from "react";
import { useAppStore } from "../stores/useAppStore";
import { SENSOR_THRESHOLDS } from "../constants";

export function useTelemetry() {
  const telemetry = useAppStore((s) => s.telemetry);

  const tempLevel = useMemo(() => {
    if (!telemetry || telemetry.temperature == null) return "normal";
    const t = telemetry.temperature;
    if (t < SENSOR_THRESHOLDS.temp.danger.low || t > SENSOR_THRESHOLDS.temp.danger.high) return "danger";
    return "normal";
  }, [telemetry]);

  const humidityLevel = useMemo(() => {
    if (!telemetry || telemetry.humidity == null) return "normal";
    const h = telemetry.humidity;
    if (h > SENSOR_THRESHOLDS.humidity.danger.high || h < SENSOR_THRESHOLDS.humidity.danger.low) return "danger";
    return "normal";
  }, [telemetry]);

  const pressureLevel = useMemo(() => {
    if (!telemetry || telemetry.pressure == null) return "normal";
    const p = telemetry.pressure;
    if (p < SENSOR_THRESHOLDS.pressure.danger.low || p > SENSOR_THRESHOLDS.pressure.danger.high) return "danger";
    return "normal";
  }, [telemetry]);

  const threatColor = useMemo(() => {
    if (!telemetry) return "text-gray-400";
    switch (telemetry.prediction) {
      case "CRITICAL": return "text-red-400";
      case "WARNING": return "text-amber-400";
      default: return "text-emerald-400";
    }
  }, [telemetry]);

  return { telemetry, tempLevel, humidityLevel, pressureLevel, threatColor };
}
