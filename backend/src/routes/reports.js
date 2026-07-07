const { Router } = require("express");
const reportController = require("../controllers/reportController");

const router = Router();

router.get("/", reportController.getReports);

module.exports = router;
