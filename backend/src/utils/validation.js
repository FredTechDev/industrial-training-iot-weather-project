const config = require("../config");

const { thresholds } = config;

function validateSensorReading(data) {
  const errors = [];

  if (!data.deviceId || typeof data.deviceId !== "string") {
    errors.push("Missing or invalid deviceId");
  }

  if (data.temperature === undefined || data.temperature === null) {
    errors.push("Missing temperature");
  } else if (typeof data.temperature !== "number" || data.temperature < thresholds.minTemperature || data.temperature > thresholds.maxTemperature) {
    errors.push(`Temperature ${data.temperature} out of range [${thresholds.minTemperature}, ${thresholds.maxTemperature}]`);
  }

  if (data.humidity === undefined || data.humidity === null) {
    errors.push("Missing humidity");
  } else if (typeof data.humidity !== "number" || data.humidity < thresholds.minHumidity || data.humidity > thresholds.maxHumidity) {
    errors.push(`Humidity ${data.humidity} out of range [${thresholds.minHumidity}, ${thresholds.maxHumidity}]`);
  }

  if (data.pressure === undefined || data.pressure === null) {
    errors.push("Missing pressure");
  } else if (typeof data.pressure !== "number" || data.pressure < thresholds.minPressure || data.pressure > thresholds.maxPressure) {
    errors.push(`Pressure ${data.pressure} out of range [${thresholds.minPressure}, ${thresholds.maxPressure}]`);
  }

  if (data.altitude !== undefined && data.altitude !== null) {
    if (typeof data.altitude !== "number" || data.altitude < thresholds.minAltitude || data.altitude > thresholds.maxAltitude) {
      errors.push(`Altitude ${data.altitude} out of range [${thresholds.minAltitude}, ${thresholds.maxAltitude}]`);
    }
  }

  if (data.light !== undefined && data.light !== null) {
    if (typeof data.light !== "number" || data.light < thresholds.minLight || data.light > thresholds.maxLight) {
      errors.push(`Light ${data.light} out of range [${thresholds.minLight}, ${thresholds.maxLight}]`);
    }
  }

  if (data.battery !== undefined && data.battery !== null) {
    if (typeof data.battery !== "number" || data.battery < thresholds.minBattery || data.battery > thresholds.maxBattery) {
      errors.push(`Battery ${data.battery} out of range [${thresholds.minBattery}, ${thresholds.maxBattery}]`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function sanitizeReading(data) {
  return {
    deviceId: data.deviceId || "station-001",
    temperature: parseFloat(data.temperature),
    humidity: parseFloat(data.humidity),
    pressure: parseFloat(data.pressure),
    altitude: data.altitude !== undefined ? parseFloat(data.altitude) : 0,
    light: data.light !== undefined ? parseInt(data.light, 10) : 0,
    rain: data.rain === true || data.rain === "true",
    battery: data.battery !== undefined ? parseFloat(data.battery) : 100,
    recordedAt: data.timestamp ? new Date(data.timestamp) : new Date(),
  };
}

module.exports = { validateSensorReading, sanitizeReading };
