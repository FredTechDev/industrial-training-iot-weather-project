const { Router } = require("express");
const alertController = require("../controllers/alertController");

const router = Router();

router.get("/", alertController.getAlerts);
router.patch("/:id/acknowledge", alertController.acknowledgeAlert);
router.patch("/:id/resolve", alertController.resolveAlert);

module.exports = router;
