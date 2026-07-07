const alertEngine = require("../services/alertEngine");

exports.getAlerts = async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    const alerts = await alertEngine.getAlerts(parseInt(limit), status);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await alertEngine.acknowledgeAlert(req.params.id);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await alertEngine.resolveAlert(req.params.id);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
