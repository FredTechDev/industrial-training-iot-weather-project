const weatherService = require("../services/weatherService");
const socketService = require("../services/socketService");

exports.getStatus = async (req, res) => {
  try {
    const status = await weatherService.getSystemStatus();
    status.websocketClients = socketService.getConnectedCount();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
