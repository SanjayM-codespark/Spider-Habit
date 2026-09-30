const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/adminModel");

const loginAdmin = async (email, password) => {

    // 1. Find admin by email
    const admin = await Admin.findByEmail(email);

    // Don't reveal whether the email exists
    if (!admin) {
        throw new Error("Invalid email or password");
    }

    // 2. Check if admin account is active
    if (!admin.is_active) {
        throw new Error("Admin account is inactive");
    }

    // 3. Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(
        password,
        admin.password_hash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // 4. Create JWT payload
    const payload = {
        id: admin.id,
        email: admin.email,
        role: admin.role
    };

    // 5. Generate JWT token
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );

    // 6. Return authenticated admin information
    return {
        token,
        admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }
    };
};

module.exports = {
    loginAdmin
};