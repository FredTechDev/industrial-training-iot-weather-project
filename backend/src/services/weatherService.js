const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class SimpleCache {
  constructor(ttlMs = 5000) {
    this.store = new Map();
    this.ttlMs = ttlMs;
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) { this.store.delete(key); return null; }
    return entry.value;
  }
  set(key, value) { this.store.set(key, { value, ts: Date.now() }); }
  invalidate(key) { this.store.delete(key); }
  invalidateAll() { this.store.clear(); }
}

class WeatherService {
  constructor() {
    this.cache = new SimpleCache(7000);
  }
  async saveReading(reading) {
    try {
      const saved = await prisma.weatherReading.create({
        data: {
          deviceId: reading.deviceId,
          temperature: reading.temperature,
          humidity: reading.humidity,
          pressure: reading.pressure,
          light: reading.light,
          rain: reading.rain,
          battery: reading.battery,
          recordedAt: reading.recordedAt,
        },
      });
      this.cache.invalidateAll();
      return saved;
    } catch (err) {
      logger.error("Failed to save reading", { error: err.message });
      return null;
    }
  }

  async getLatest(deviceId = "station-001") {
    const key = `latest:${deviceId}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const result = await prisma.weatherReading.findFirst({
      where: { deviceId },
      orderBy: { recordedAt: "desc" },
    });
    this.cache.set(key, result);
    return result;
  }

  async getHistory(deviceId = "station-001", limit = 100, offset = 0) {
    return prisma.weatherReading.findMany({
      where: { deviceId },
      orderBy: { recordedAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async getChartData(deviceId = "station-001", hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.weatherReading.findMany({
      where: {
        deviceId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: "asc" },
    });
  }

  async computeTrends(deviceId = "station-001") {
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      const recent = await prisma.weatherReading.findMany({
        where: {
          deviceId,
          recordedAt: { gte: thirtyMinAgo },
        },
        orderBy: { recordedAt: "desc" },
      });

      const hourly = await prisma.weatherReading.findMany({
        where: {
          deviceId,
          recordedAt: { gte: oneHourAgo },
        },
        orderBy: { recordedAt: "desc" },
      });

      const sixHour = await prisma.weatherReading.findMany({
        where: {
          deviceId,
          recordedAt: { gte: sixHoursAgo },
        },
        orderBy: { recordedAt: "asc" },
      });

      const trends = {
        current: recent[0] || null,
        shortTerm: this.computeStats(recent, "30min"),
        hourly: this.computeStats(hourly, "1hour"),
        sixHour: this.computeStats(sixHour, "6hour"),
        pressure: this.computePressureTrend(sixHour),
        temperature: this.computeTemperatureTrend(sixHour),
        humidity: this.computeHumidityTrend(sixHour),
        light: this.computeLightTrend(sixHour),
        rainFrequency: this.computeRainFrequency(sixHour),
      };

      await this.saveTrendSnapshot(deviceId, "30min", trends.shortTerm);
      await this.saveTrendSnapshot(deviceId, "1hour", trends.hourly);

      return trends;
    } catch (err) {
      logger.error("Failed to compute trends", { error: err.message });
      return null;
    }
  }

  computeStats(readings, period) {
    if (!readings || readings.length === 0) {
      return {
        period,
        sampleCount: 0,
        avgTemperature: null,
        minTemperature: null,
        maxTemperature: null,
        avgHumidity: null,
        minHumidity: null,
        maxHumidity: null,
        avgPressure: null,
        minPressure: null,
        maxPressure: null,
        avgLight: null,
        rainCount: 0,
      };
    }

    const temps = readings.map((r) => Number(r.temperature));
    const hums = readings.map((r) => Number(r.humidity));
    const pressures = readings.map((r) => Number(r.pressure));
    const lights = readings.map((r) => r.light);
    const rains = readings.filter((r) => r.rain).length;

    return {
      period,
      sampleCount: readings.length,
      avgTemperature: this.average(temps),
      minTemperature: Math.min(...temps),
      maxTemperature: Math.max(...temps),
      avgHumidity: this.average(hums),
      minHumidity: Math.min(...hums),
      maxHumidity: Math.max(...hums),
      avgPressure: this.average(pressures),
      minPressure: Math.min(...pressures),
      maxPressure: Math.max(...pressures),
      avgLight: Math.round(this.average(lights)),
      rainCount: rains,
    };
  }

  computePressureTrend(readings) {
    if (readings.length < 3) return { direction: "stable", rate: 0, description: "Insufficient data" };

    const first = Number(readings[0].pressure);
    const last = Number(readings[readings.length - 1].pressure);
    const diff = last - first;
    const rate = diff / readings.length;

    let direction = "stable";
    if (rate > 0.1) direction = "rising";
    else if (rate < -0.1) direction = "falling";

    let description = "Pressure is stable";
    if (direction === "falling") {
      description = rate < -0.5 ? "Pressure dropping rapidly - possible storm approaching" : "Pressure gradually decreasing";
    } else if (direction === "rising") {
      description = rate > 0.5 ? "Pressure rising rapidly - clearing weather ahead" : "Pressure gradually increasing";
    }

    return { direction, rate: parseFloat(rate.toFixed(2)), description };
  }

  computeTemperatureTrend(readings) {
    if (readings.length < 3) return { direction: "stable", rate: 0, description: "Insufficient data" };

    const first = Number(readings[0].temperature);
    const last = Number(readings[readings.length - 1].temperature);
    const diff = last - first;
    const rate = diff / readings.length;

    let direction = "stable";
    if (rate > 0.05) direction = "rising";
    else if (rate < -0.05) direction = "falling";

    let description = "Temperature is stable";
    if (direction === "rising") description = "Temperature is rising";
    else if (direction === "falling") description = "Temperature is dropping";

    return { direction, rate: parseFloat(rate.toFixed(2)), description };
  }

  computeHumidityTrend(readings) {
    if (readings.length < 3) return { direction: "stable", rate: 0, description: "Insufficient data" };

    const first = Number(readings[0].humidity);
    const last = Number(readings[readings.length - 1].humidity);
    const diff = last - first;
    const rate = diff / readings.length;

    let direction = "stable";
    if (rate > 0.1) direction = "rising";
    else if (rate < -0.1) direction = "falling";

    let description = "Humidity is stable";
    if (direction === "rising") description = "Humidity increasing - air becoming more moist";
    else if (direction === "falling") description = "Humidity decreasing - air drying out";

    return { direction, rate: parseFloat(rate.toFixed(2)), description };
  }

  computeLightTrend(readings) {
    if (readings.length < 3) return { direction: "stable", rate: 0, description: "Insufficient data" };

    const first = readings[0].light;
    const last = readings[readings.length - 1].light;
    const diff = last - first;

    let direction = "stable";
    if (diff > 100) direction = "increasing";
    else if (diff < -100) direction = "decreasing";

    let description = "Light levels stable";
    if (direction === "increasing") description = "Getting brighter";
    else if (direction === "decreasing") description = "Getting darker";

    return { direction, rate: diff, description };
  }

  computeRainFrequency(readings) {
    if (!readings || readings.length === 0) return { frequency: 0, description: "No data" };
    const rainCount = readings.filter((r) => r.rain).length;
    const frequency = (rainCount / readings.length) * 100;
    return {
      frequency: parseFloat(frequency.toFixed(1)),
      description: frequency > 50 ? "Frequent rain detected" : frequency > 0 ? "Intermittent rain" : "No rain detected",
    };
  }

  async saveTrendSnapshot(deviceId, period, stats) {
    try {
      await prisma.trendSnapshot.create({
        data: {
          deviceId,
          period,
          avgTemperature: stats.avgTemperature,
          minTemperature: stats.minTemperature,
          maxTemperature: stats.maxTemperature,
          avgHumidity: stats.avgHumidity,
          minHumidity: stats.minHumidity,
          maxHumidity: stats.maxHumidity,
          avgPressure: stats.avgPressure,
          minPressure: stats.minPressure,
          maxPressure: stats.maxPressure,
          avgLight: stats.avgLight,
          rainCount: stats.rainCount,
          sampleCount: stats.sampleCount,
        },
      });
    } catch (err) {
      logger.error("Failed to save trend snapshot", { error: err.message });
    }
  }

  async updateDeviceStatus(deviceId, status = "online") {
    try {
      await prisma.device.upsert({
        where: { deviceId },
        update: {
          status,
          lastSeen: new Date(),
        },
        create: {
          deviceId,
          name: `${deviceId}`,
          status,
          lastSeen: new Date(),
        },
      });
    } catch (err) {
      logger.error("Failed to update device status", { error: err.message });
    }
  }

  async getDeviceStatus(deviceId = "station-001") {
    return prisma.device.findUnique({ where: { deviceId } });
  }

  async getAllDevices() {
    const cached = this.cache.get("devices");
    if (cached) return cached;
    const result = await prisma.device.findMany({ orderBy: { updatedAt: "desc" } });
    this.cache.set("devices", result);
    return result;
  }

  async getReadingCount() {
    const cached = this.cache.get("readingCount");
    if (cached) return cached;
    const result = await prisma.weatherReading.count();
    this.cache.set("readingCount", result);
    return result;
  }

  async getSystemStatus() {
    const latestReading = await this.getLatest();
    const lastHourCount = await prisma.weatherReading.count({
      where: { recordedAt: { gte: new Date(Date.now() - 3600000) } },
    });
    const totalReadings = await prisma.weatherReading.count();
    const activeAlerts = await prisma.alert.count({ where: { status: "active" } });
    const devices = await this.getAllDevices();

    return {
      uptime: process.uptime(),
      totalReadings,
      lastHourReadings: lastHourCount,
      activeAlerts,
      devices,
      latestReading,
      timestamp: new Date().toISOString(),
    };
  }

  average(arr) {
    if (!arr || arr.length === 0) return 0;
    return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
  }
}

module.exports = new WeatherService();
