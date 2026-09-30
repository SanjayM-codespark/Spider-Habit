const express = require("express");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Save a real app user (name, email, phone, password) into the backend DB.
// Called by the mobile app after a successful upgrade response.
router.post("/register", userController.register);

// Validate a user's credentials against the backend DB.
// Called by the mobile app during login (falls back to local storage).
router.post("/login", userController.login);

// Check whether an email OR phone already exists on the server.
// Called by the mobile app during registration.
router.post("/check-exists", userController.checkExists);

// All admin user-management routes require a valid admin token
router.get("/", authenticate, userController.list);
router.get("/:id", authenticate, userController.getOne);
router.put("/:id", authenticate, userController.update);
router.delete("/:id", authenticate, userController.remove);

module.exports = router;