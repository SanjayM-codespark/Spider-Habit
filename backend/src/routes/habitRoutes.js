const express = require("express");
const habitController = require("../controllers/habitController");
const { upload, MAX_FILE_BYTES } = require("../middleware/iconUpload");

const router = express.Router();

// Habits are keyed by the mobile app's user id (client_user_id) so both
// free (local) and subscribed (backend-synced) users keep a stable key.

// Upload a custom habit icon image (multipart/form-data, field: "icon").
// Returns the public path to store on the habit, so it must be declared
// before the parameterised routes below.
router.post("/upload-icon", upload.single("icon"), habitController.uploadIcon);

// Translate multer rejections into clean JSON instead of an HTML stack trace.
router.use((err, req, res, next) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            message: `Icon image must be ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB or smaller.`
        });
    }
    return res.status(400).json({
        success: false,
        message: err.message || "Icon upload failed."
    });
});

// Fetch all habits for a user
router.get("/:clientUserId", habitController.listByUser);

// Create a habit
router.post("/", habitController.create);

// Update a habit (edit fields, completion toggle via streak/completedDates)
router.patch("/:id", habitController.update);

// Delete a habit
router.delete("/:id", habitController.remove);

module.exports = router;