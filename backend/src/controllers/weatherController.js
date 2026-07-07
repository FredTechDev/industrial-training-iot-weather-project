const weatherService = require("../services/weatherService");

exports.getLatest = async (req, res) => {
  try {
    const { deviceId } = req.query;
    const reading = await weatherService.getLatest(deviceId);
    if (!reading) return res.status(404).json({ error: "No readings found" });
    res.json(reading);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { deviceId, limit = 100, offset = 0 } = req.query;
    const readings = await weatherService.getHistory(deviceId, parseInt(limit), parseInt(offset));
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChartData = async (req, res) => {
  try {
    const { deviceId, hours = 24 } = req.query;
    const data = await weatherService.getChartData(deviceId, parseInt(hours));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const { deviceId } = req.query;
    const trends = await weatherService.computeTrends(deviceId);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
