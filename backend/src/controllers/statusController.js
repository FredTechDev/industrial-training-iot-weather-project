const weatherService = require("../services/weatherService");
const socketService = require("../services/socketService");

exports.getStatus = async (req, res) => {
  try {
    const [latest, totalReadings, devices] = await Promise.allSettled([
      weatherService.getLatest(),
      weatherService.getReadingCount().catch(() => 0),
      weatherService.getAllDevices().catch(() => []),
    ]);
    res.json({
      uptime: process.uptime(),
      totalReadings: totalReadings.value ?? 0,
      devices: devices.value ?? [],
      latestReading: latest.value ?? null,
      websocketClients: socketService.getConnectedCount(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      uptime: process.uptime(),
      totalReadings: 0,
      devices: [],
      latestReading: null,
      websocketClients: 0,
      timestamp: new Date().toISOString(),
    });
  }
};
