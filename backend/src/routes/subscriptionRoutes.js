const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Public route — no auth required (mobile app fetches available plans)
router.get("/public", subscriptionController.listActive);

// Payment flow — mobile app first creates a Razorpay order, then (after the
// on-device checkout) verifies the payment signature before registering the
// user details via /api/users/register.
router.post("/create-order", subscriptionController.createOrder);
router.post("/verify-payment", subscriptionController.verifyPayment);

// Public — returns a subscribed user's current plan (identified by email)
router.get("/current", subscriptionController.current);

// All subscription routes require a valid admin token
router.post("/", authenticate, subscriptionController.create);
router.get("/", authenticate, subscriptionController.list);
router.get("/:id", authenticate, subscriptionController.getOne);
router.put("/:id", authenticate, subscriptionController.update);
router.delete("/:id", authenticate, subscriptionController.remove);

module.exports = router;