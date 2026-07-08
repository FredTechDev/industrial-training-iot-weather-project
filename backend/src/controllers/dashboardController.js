const weatherService = require("../services/weatherService");
const socketService = require("../services/socketService");
const prisma = require("../utils/prisma");

exports.getDashboard = async (req, res) => {
  try {
    const [latest, totalReadingsRes, devices, alerts, reports] = await Promise.all([
      weatherService.getLatest(),
      prisma.weatherReading.count().catch(() => 0),
      weatherService.getAllDevices(),
      prisma.alert.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        where: { status: "active" },
      }).catch(() => []),
      prisma.aiReport.findFirst({
        orderBy: { createdAt: "desc" },
      }).catch(() => null),
    ]);

    res.json({
      uptime: process.uptime(),
      totalReadings: totalReadingsRes,
      latestReading: latest,
      devices,
      activeAlerts: alerts,
      latestReport: reports,
      websocketClients: socketService.getConnectedCount(),
      timestamp: new Date().toISOString(),
    });
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
