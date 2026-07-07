const { Router } = require("express");
const statusController = require("../controllers/statusController");

const router = Router();

router.get("/", statusController.getStatus);

module.exports = router;
