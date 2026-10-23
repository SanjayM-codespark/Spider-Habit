const express = require("express");
const userController = require("../controllers/userController");
const accountController = require("../controllers/accountController");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { createLoginLimiter } = require("../middleware/loginLimiter");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Save a real app user (name, email, phone, password) into the backend DB.
// Called by the mobile app after a successful upgrade response.
router.post("/register", userController.register);

// Validate a user's credentials against the backend DB.
// Called by the mobile app during login (falls back to local storage).
router.post("/login", createLoginLimiter("user"), userController.login);

// Check whether an email OR phone already exists on the server.
// Called by the mobile app during registration.
router.post("/check-exists", userController.checkExists);

// Password reset by emailed code, and profile edits. Rate limited because they
// are public and guessable (6-digit codes, password checks).
const accountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    // The server trusts proxy headers (for country detection), so the client IP
    // can be spoofed. Limit per target account instead.
    keyGenerator: (req) => {
        const account = String(req.body?.email || req.body?.currentEmail || "")
            .trim()
            .toLowerCase();
        return account || ipKeyGenerator(req.ip);
    },
    validate: { trustProxy: false },
    message: { success: false, message: "Too many attempts. Please try again later." }
});
router.post("/forgot-password", accountLimiter, accountController.forgotPassword);
router.post("/reset-password", accountLimiter, accountController.resetPassword);
router.post("/update-profile", accountLimiter, accountController.updateProfile);
router.post("/change-password", accountLimiter, accountController.changePassword);
router.post("/delete-account", accountLimiter, accountController.deleteAccount);
router.post("/logout", accountLimiter, accountController.logout);

// All admin user-management routes require a valid admin token
router.get("/", authenticate, userController.list);
router.get("/premium/habits", authenticate, userController.listPremiumHabits);
router.get("/deleted/list", authenticate, userController.listDeleted);
router.get("/:id", authenticate, userController.getOne);
router.put("/:id", authenticate, userController.update);
router.post("/:id/restore", authenticate, userController.restore);
router.delete("/:id", authenticate, userController.remove);

module.exports = router;