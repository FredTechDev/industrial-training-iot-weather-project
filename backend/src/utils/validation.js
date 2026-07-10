const config = require("../config");

const { thresholds } = config;

function validateSensorReading(data) {
  const warnings = [];

  if (!data.deviceId || typeof data.deviceId !== "string") {
    return { valid: false, errors: ["Missing or invalid deviceId"] };
  }

  if (data.temperature === undefined || data.temperature === null || typeof data.temperature !== "number" || data.temperature < thresholds.minTemperature || data.temperature > thresholds.maxTemperature) {
    warnings.push(`temperature`);
  }

  if (data.humidity === undefined || data.humidity === null || typeof data.humidity !== "number" || data.humidity < thresholds.minHumidity || data.humidity > thresholds.maxHumidity) {
    warnings.push(`humidity`);
  }

  if (data.pressure === undefined || data.pressure === null || typeof data.pressure !== "number" || data.pressure < thresholds.minPressure || data.pressure > thresholds.maxPressure) {
    warnings.push(`pressure`);
  }

  if (data.light !== undefined && data.light !== null && (typeof data.light !== "number" || data.light < thresholds.minLight || data.light > thresholds.maxLight)) {
    warnings.push(`light`);
  }

  if (data.rainIntensity !== undefined && data.rainIntensity !== null && (typeof data.rainIntensity !== "number" || data.rainIntensity < 0 || data.rainIntensity > 100)) {
    warnings.push(`rainIntensity`);
  }

  return {
    valid: true,
    warnings,
  };
}

function sanitizeReading(data) {
  return {
    deviceId: data.deviceId || "station-001",
    temperature: data.temperature !== undefined && typeof data.temperature === "number" && data.temperature >= thresholds.minTemperature && data.temperature <= thresholds.maxTemperature
      ? parseFloat(data.temperature.toFixed(1))
      : null,
    humidity: data.humidity !== undefined && typeof data.humidity === "number" && data.humidity >= thresholds.minHumidity && data.humidity <= thresholds.maxHumidity
      ? parseFloat(data.humidity.toFixed(1))
      : null,
    pressure: data.pressure !== undefined && typeof data.pressure === "number" && data.pressure >= thresholds.minPressure && data.pressure <= thresholds.maxPressure
      ? parseFloat(data.pressure.toFixed(1))
      : null,
    light: data.light !== undefined && typeof data.light === "number" && data.light >= thresholds.minLight && data.light <= thresholds.maxLight
      ? parseInt(data.light, 10)
      : null,
    rain: typeof data.rain === "boolean" ? data.rain : null,
    rainIntensity: typeof data.rainIntensity === "number" && data.rainIntensity >= 0
      ? Math.min(100, Math.round(data.rainIntensity))
      : null,
    recordedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
  };
}

module.exports = { validateSensorReading, sanitizeReading };
