const config = require("../config");

const { thresholds } = config;

const DEFAULTS = {
  temperature: 25,
  humidity: 60,
  pressure: 1013,
  altitude: 1780,
  light: 0,
  battery: 100,
  rain: false,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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

  if (data.altitude !== undefined && data.altitude !== null && (typeof data.altitude !== "number" || data.altitude < thresholds.minAltitude || data.altitude > thresholds.maxAltitude)) {
    warnings.push(`altitude`);
  }

  if (data.light !== undefined && data.light !== null && (typeof data.light !== "number" || data.light < thresholds.minLight || data.light > thresholds.maxLight)) {
    warnings.push(`light`);
  }

  if (data.battery !== undefined && data.battery !== null && (typeof data.battery !== "number" || data.battery < thresholds.minBattery || data.battery > thresholds.maxBattery)) {
    warnings.push(`battery`);
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
      : DEFAULTS.temperature + (Math.random() * 4 - 2),
    humidity: data.humidity !== undefined && typeof data.humidity === "number" && data.humidity >= thresholds.minHumidity && data.humidity <= thresholds.maxHumidity
      ? clamp(parseFloat(data.humidity.toFixed(1)), thresholds.minHumidity, thresholds.maxHumidity)
      : DEFAULTS.humidity + (Math.random() * 10 - 5),
    pressure: data.pressure !== undefined && typeof data.pressure === "number" && data.pressure >= thresholds.minPressure && data.pressure <= thresholds.maxPressure
      ? parseFloat(data.pressure.toFixed(1))
      : DEFAULTS.pressure + (Math.random() * 6 - 3),
    altitude: data.altitude !== undefined && typeof data.altitude === "number" && data.altitude >= thresholds.minAltitude && data.altitude <= thresholds.maxAltitude
      ? parseFloat(data.altitude.toFixed(1))
      : DEFAULTS.altitude + (Math.random() * 20 - 10),
    light: data.light !== undefined && typeof data.light === "number" && data.light >= thresholds.minLight && data.light <= thresholds.maxLight
      ? parseInt(data.light, 10)
      : DEFAULTS.light,
    rain: data.rain === true || data.rain === "true",
    battery: data.battery !== undefined && typeof data.battery === "number" && data.battery >= thresholds.minBattery && data.battery <= thresholds.maxBattery
      ? clamp(parseFloat(data.battery.toFixed(1)), thresholds.minBattery, thresholds.maxBattery)
      : DEFAULTS.battery,
    recordedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
  };
}

module.exports = { validateSensorReading, sanitizeReading };
