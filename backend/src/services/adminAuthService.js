const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/adminModel");

const INVALID_CREDENTIALS = "Invalid username or password";

// Compared against when the username is unknown so a miss costs the same as a
// real check (prevents telling accounts apart by response time).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthError";
    }
}

const loginAdmin = async (username, password) => {

    // 1. Find admin by username
    const admin = await Admin.findByUsername(username);

    // 2. Compare password with bcrypt hash (always, even for unknown users)
    const isPasswordValid = await bcrypt.compare(
        password,
        admin ? admin.password_hash : DUMMY_HASH
    );

    // Unknown user, inactive account and wrong password all look identical so
    // the response never reveals which accounts exist.
    if (!admin || !admin.is_active || !isPasswordValid) {
        throw new AuthError(INVALID_CREDENTIALS);
    }

    // 3. Create JWT payload
    const payload = {
        id: admin.id,
        username: admin.username,
        role: admin.role
    };

    // 4. Generate JWT token
    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );

    // 5. Return authenticated admin information
    return {
        token,
        admin: {
            id: admin.id,
            name: admin.name,
            username: admin.username,
            role: admin.role
        }
    };
};

module.exports = {
    loginAdmin,
    AuthError
};
