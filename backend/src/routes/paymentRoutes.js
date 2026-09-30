const express = require("express");
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// All payment routes require admin authentication
router.get("/", authenticate, paymentController.list);

module.exports = router;
