const express = require("express");
const settingsController = require("../controllers/settingsController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Public settings for the mobile app (no auth)
router.get("/public", settingsController.getPublic);

// All settings routes require a valid admin token
router.get("/", authenticate, settingsController.get);
router.put("/general", authenticate, settingsController.updateGeneral);
router.put("/payment", authenticate, settingsController.updatePayment);

module.exports = router;