const { Router } = require("express");
const deviceController = require("../controllers/deviceController");

const router = Router();

router.get("/", deviceController.getDevices);
router.post("/", deviceController.registerDevice);
router.get("/:deviceId", deviceController.getDevice);

module.exports = router;
