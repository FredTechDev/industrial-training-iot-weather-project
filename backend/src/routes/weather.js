const { Router } = require("express");
const weatherController = require("../controllers/weatherController");

const router = Router();

router.get("/latest", weatherController.getLatest);
router.get("/history", weatherController.getHistory);
router.get("/charts", weatherController.getChartData);
router.get("/trends", weatherController.getTrends);

module.exports = router;
