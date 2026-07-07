const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, name, location, firmwareVersion } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

    const device = await prisma.device.upsert({
      where: { deviceId },
      update: { name, location, firmwareVersion, status: "online", lastSeen: new Date() },
      create: { deviceId, name, location, firmwareVersion, status: "online", lastSeen: new Date() },
    });

    logger.info("Device registered", { deviceId });
    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const devices = await prisma.device.findMany({ orderBy: { updatedAt: "desc" } });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDevice = async (req, res) => {
  try {
    const device = await prisma.device.findUnique({ where: { deviceId: req.params.deviceId } });
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
