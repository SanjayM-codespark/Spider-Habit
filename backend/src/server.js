const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./config/database");
const adminRoutes = require("./routes/adminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const countryRoutes = require("./routes/countryRoutes");
const userRoutes = require("./routes/userRoutes");
const habitRoutes = require("./routes/habitRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const helpPageRoutes = require("./routes/helpPageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Trust X-Forwarded-For so `req.ip` reflects the real client address rather
// than the tunnel/reverse proxy in front of us. This is what the /api/country
// endpoint uses to resolve the caller's country. Only affects the geo hint —
// no authorization decisions are made from the client IP.
app.set("trust proxy", true);

app.use(cors());

// Serve uploaded habit icons from disk. Mounted before the routers so the
// public path returned by POST /api/habits/upload-icon resolves straight to the
// file. Skipped for anything missing from disk (falls through to 404).
app.use(
    "/uploads",
    express.static(path.join(__dirname, "..", "uploads"), {
        fallthrough: true,
        maxAge: "7d"
    })
);

// Parse JSON bodies ONLY when a request actually carries a body. Without this
// guard, requests that send `Content-Type: application/json` with an empty
// body (common with some clients/tools, e.g. GET with an empty JSON body)
// crash body-parser with "SyntaxError: Unexpected end of JSON input".
const parseJsonBody = (req, res, next) => {
    const hasBody =
        req.method !== "GET" &&
        req.method !== "HEAD" &&
        (req.headers["transfer-encoding"] ||
            Number(req.headers["content-length"] || 0) > 0);
    if (!hasBody) return next();
    return express.json()(req, res, next);
};

app.use(parseJsonBody);

// JSON-friendly error handler so invalid JSON returns a clean 400 response
// instead of the default HTML stack-trace page.
app.use((err, req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON body provided.",
        });
    }
    next(err);
});

app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/country", countryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/help-pages", helpPageRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SpiderHabit Backend API is running"
    });
});

app.get("/db-test", async (req, res) => {   
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "PostgreSQL connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "PostgreSQL connection failed",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});