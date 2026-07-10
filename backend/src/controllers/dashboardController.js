const weatherService = require("../services/weatherService");
const socketService = require("../services/socketService");
const prisma = require("../utils/prisma");

let cache = null;
let cacheTs = 0;
const CACHE_TTL = 10000;

exports.getDashboard = async (req, res) => {
  try {
    if (cache && Date.now() - cacheTs < CACHE_TTL) {
      return res.json(cache);
    }

    const [latest, totalReadingsRes, devices, alerts] = await Promise.all([
      weatherService.getLatest(),
      prisma.weatherReading.count().catch(() => 0),
      weatherService.getAllDevices(),
      prisma.alert.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: "active" },
      }).catch(() => []),
    ]);

    cache = {
      uptime: process.uptime(),
      totalReadings: totalReadingsRes,
      latestReading: latest,
      devices,
      activeAlerts: alerts,
      websocketClients: socketService.getConnectedCount(),
      timestamp: new Date().toISOString(),
    };
    cacheTs = Date.now();

    res.json(cache);
  } catch (err) {
    console.error("getDashboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
