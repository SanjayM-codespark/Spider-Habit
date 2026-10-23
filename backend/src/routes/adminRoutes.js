const express = require("express");
const adminController = require("../controllers/adminController");
const { createLoginLimiter } = require("../middleware/loginLimiter");

const router = express.Router();

// Admin login
router.post("/login", createLoginLimiter("admin"), adminController.login);

module.exports = router;