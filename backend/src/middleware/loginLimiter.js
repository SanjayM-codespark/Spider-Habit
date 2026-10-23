const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

/**
 * Brute-force protection for login endpoints. Only failed attempts count, so a
 * legitimate user is never locked out by successful logins.
 *
 * The server trusts proxy headers (for country detection), so the client IP can
 * be spoofed. The limit is therefore applied per target account (email or
 * username), with the IP only as a fallback when no identifier was sent.
 */
const createLoginLimiter = (scope) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        skipSuccessfulRequests: true,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const identifier = String(
                req.body?.email || req.body?.username || ""
            )
                .trim()
                .toLowerCase()
                .slice(0, 254);
            return `${scope}:${identifier || ipKeyGenerator(req.ip)}`;
        },
        validate: { trustProxy: false },
        message: {
            success: false,
            message: "Too many failed attempts. Please try again in 15 minutes."
        }
    });

module.exports = { createLoginLimiter };
