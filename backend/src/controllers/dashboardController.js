const weatherService = require("../services/weatherService");
const socketService = require("../services/socketService");
const prisma = require("../utils/prisma");

let cache = null;
let cacheTs = 0;
const CACHE_TTL = 5000;

exports.getDashboard = async (req, res) => {
  try {
    if (cache && Date.now() - cacheTs < CACHE_TTL) {
      return res.json(cache);
    }

    const [latest, totalReadings, devices, alerts, reports] = await Promise.allSettled([
      weatherService.getLatest(),
      prisma.weatherReading.count(),
      weatherService.getAllDevices(),
      prisma.alert.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: "active" },
      }),
      prisma.aIReport.findFirst({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    cache = {
      uptime: process.uptime(),
      totalReadings: totalReadings.value ?? 0,
      latestReading: latest.value ?? null,
      devices: devices.value ?? [],
      activeAlerts: alerts.value ?? [],
      latestReport: reports.value ?? null,
      websocketClients: socketService.getConnectedCount(),
      timestamp: new Date().toISOString(),
    };
    cacheTs = Date.now();

    res.json(cache);
  } catch (err) {
    res.json({
      uptime: process.uptime(),
      totalReadings: 0,
      latestReading: null,
      devices: [],
      activeAlerts: [],
      latestReport: null,
      websocketClients: 0,
      timestamp: new Date().toISOString(),
    });
  }
};
