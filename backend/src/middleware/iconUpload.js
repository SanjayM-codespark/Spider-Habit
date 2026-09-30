const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

/** Public path prefix that server.js mounts with express.static(). */
const UPLOAD_PUBLIC_PREFIX = "/uploads/habit-icons";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "habit-icons");

/** Habit icons are displayed at ~36dp, so anything larger than 2 MB is waste. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir(UPLOAD_DIR, { recursive: true }, err => cb(err, UPLOAD_DIR));
    },
    filename: (req, file, cb) => {
        // Never reuse the client-supplied filename on disk: it can contain path
        // separators, unicode tricks or an executable extension. The extension
        // is derived from the sniffed MIME type and the basename is random.
        const extension = EXTENSION_BY_MIME[file.mimetype] || ".img";
        const unique = crypto.randomBytes(12).toString("hex");
        cb(null, `${Date.now()}-${unique}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_BYTES,
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (!EXTENSION_BY_MIME[file.mimetype]) {
            return cb(new Error("Only JPG, PNG or WEBP images are allowed."));
        }
        cb(null, true);
    }
});

/** Public path (as stored on the habit row) for a file written by multer. */
const publicPathForFile = file => `${UPLOAD_PUBLIC_PREFIX}/${file.filename}`;

module.exports = {
    upload,
    UPLOAD_DIR,
    UPLOAD_PUBLIC_PREFIX,
    MAX_FILE_BYTES,
    publicPathForFile
};