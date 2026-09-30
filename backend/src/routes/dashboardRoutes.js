const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Admin dashboard overview (stats, country breakdown, expiring subscriptions)
router.get("/", authenticate, dashboardController.getOverview);

module.exports = router;