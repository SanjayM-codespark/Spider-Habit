const express = require("express");
const helpPageController = require("../controllers/helpPageController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Help pages are public-facing content; viewing is open, editing requires an admin token
router.get("/", helpPageController.list);
router.get("/:slug", helpPageController.getOne);
router.post("/", authenticate, helpPageController.create);
router.put("/:slug", authenticate, helpPageController.save);
router.delete("/:slug", authenticate, helpPageController.remove);

module.exports = router;