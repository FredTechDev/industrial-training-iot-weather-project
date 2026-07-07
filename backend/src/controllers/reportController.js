const aiService = require("../services/aiService");

exports.getReports = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const reports = await aiService.getReports(parseInt(limit));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
