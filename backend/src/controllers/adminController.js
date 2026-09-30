const adminAuthService = require("../services/adminAuthService");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Authenticate admin
        const result = await adminAuthService.loginAdmin(
            email,
            password
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            data: result
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(401).json({
            success: false,
            message: error.message || "Authentication failed"
        });
    }
};

module.exports = {
    login
};