const adminAuthService = require("../services/adminAuthService");

const MAX_USERNAME_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 128;

const login = async (req, res) => {
    try {
        const { username, email, password } = req.body || {};
        const rawIdentifier = username || email;

        // Only plain strings are accepted (rejects objects/arrays/numbers).
        if (
            (rawIdentifier !== undefined && typeof rawIdentifier !== "string") ||
            (password !== undefined && typeof password !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const loginIdentifier = (rawIdentifier || "").trim();

        // Basic validation
        if (!loginIdentifier && !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }
        if (!loginIdentifier) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        // Safe length handling (also keeps bcrypt work bounded).
        if (
            loginIdentifier.length > MAX_USERNAME_LENGTH ||
            password.length > MAX_PASSWORD_LENGTH
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        // Authenticate admin
        const result = await adminAuthService.loginAdmin(
            loginIdentifier,
            password
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: result
        });

    } catch (error) {
        if (error && error.name === "AuthError") {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        // Anything else is a server fault, not a credentials problem.
        console.error("Admin login error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
};

module.exports = {
    login
};
