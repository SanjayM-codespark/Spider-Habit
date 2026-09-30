const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Habit = require("../models/habitModel");

/**
 * Save (upsert) a real app user into the backend database.
 * Called by the mobile app AFTER a successful upgrade response, with the
 * logged-in user's name, email, phone and password. If the account already
 * exists (returning subscriber) it is updated rather than rejected.
 */
const register = async (req, res) => {
    try {
        const { name, email, phone, password, subscriptionId, clientUserId } = req.body;

        // Basic validation
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, phone and password are required"
            });
        }

        // Never store plaintext passwords
        const passwordHash = await bcrypt.hash(String(password), 10);
        const subId = subscriptionId ? Number(subscriptionId) : null;

        // Upsert: a returning user (already in the DB) re-subscribes every time
        // they purchase a plan, so update their record instead of erroring.
        const existingEmail = await User.findByEmail(String(email).trim().toLowerCase());
        if (existingEmail) {
            const updated = await User.update(existingEmail.id, {
                name: String(name).trim(),
                email: String(email).trim().toLowerCase(),
                phone: String(phone).trim(),
                passwordHash,
                isSubscribed: subId ? true : existingEmail.is_subscribed,
                subscriptionId: subId,
                clientUserId: clientUserId ? String(clientUserId) : undefined
            });

            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update existing user"
                });
            }

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updated
            });
        }

        const existingPhone = await User.findByPhone(String(phone).trim());
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: "An account with this phone number already exists"
            });
        }

        const user = await User.create({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            phone: String(phone).trim(),
            passwordHash,
            subscriptionId: subId,
            clientUserId: clientUserId ? String(clientUserId) : null
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });
    } catch (error) {
        console.error("Register user error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to register user"
        });
    }
};

const list = async (req, res) => {
    console.log("user list:",req);
    
    try {
        const users = await User.findAll();

        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("List users error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch users"
        });
    }
};

/**
 * Login validation used by the mobile app. A user may exist only in the local
 * AsyncStorage store (free account) OR also in the backend DB (subscribed).
 * When the device can reach the server, this endpoint validates the password
 * against the stored hash so free/subscribed accounts share one source of
 * truth. Returns 404 when the account is not on the server, so the app can
 * fall back to its local store for free-only accounts.
 */
/**
 * Check whether an email OR phone already exists in the backend database.
 * Used by the mobile app during registration so a subscribed account is not
 * re-created. Returns 404 when neither exists (safe to register).
 */
const checkExists = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (email) {
            const byEmail = await User.findByEmail(String(email).trim().toLowerCase());
            if (byEmail) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }
        }

        if (phone) {
            const byPhone = await User.findByPhone(String(phone).trim());
            if (byPhone) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this phone number already exists"
                });
            }
        }

        return res.status(404).json({
            success: false,
            message: "User not found on server"
        });
    } catch (error) {
        console.error("User existence check error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to check user existence"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        const identifier = email
            ? String(email).trim().toLowerCase()
            : phone
                ? String(phone).trim()
                : null;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: "Email or phone is required"
            });
        }

        const user = email
            ? await User.findByEmail(identifier)
            : await User.findByPhone(identifier);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found on server"
            });
        }

        const valid = await bcrypt.compare(String(password), user.password_hash);
        if (!valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/phone or password"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                client_user_id: user.client_user_id,
                is_subscribed: user.is_subscribed,
                subscription_id: user.subscription_id,
                subscription_name: user.subscription_name,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error("User login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Login failed"
        });
    }
};

const getOne = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Habits are keyed by the mobile app's client user id, so they are
        // only available once a registration has captured that id.
        const habits = user.client_user_id
            ? await Habit.findByClientUserId(user.client_user_id)
            : [];

        return res.status(200).json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                client_user_id: user.client_user_id,
                is_subscribed: user.is_subscribed,
                subscription_id: user.subscription_id,
                subscription_name: user.subscription_name,
                created_at: user.created_at,
                habits
            }
        });
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch user"
        });
    }
};

const update = async (req, res) => {
    try {
        const { name, email, phone, password, isSubscribed, subscriptionId } = req.body;

        const existing = await User.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Uniqueness checks (email + phone) when the values actually change
        if (email !== undefined && String(email).trim().toLowerCase() !== existing.email) {
            const dup = await User.findByEmail(String(email).trim().toLowerCase());
            if (dup && dup.id !== existing.id) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }
        }

        if (phone !== undefined && String(phone).trim() !== existing.phone) {
            const dup = await User.findByPhone(String(phone).trim());
            if (dup && dup.id !== existing.id) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this phone number already exists"
                });
            }
        }

        // Re-hash only when a new password is provided
        let passwordHash;
        if (password) {
            passwordHash = await bcrypt.hash(String(password), 10);
        }

        const user = await User.update(req.params.id, {
            name: name !== undefined ? String(name).trim() : undefined,
            email: email !== undefined ? String(email).trim().toLowerCase() : undefined,
            phone: phone !== undefined ? String(phone).trim() : undefined,
            passwordHash,
            isSubscribed: isSubscribed !== undefined ? Boolean(isSubscribed) : undefined,
            subscriptionId:
                subscriptionId !== undefined
                    ? subscriptionId === null || subscriptionId === ""
                        ? null
                        : Number(subscriptionId)
                    : undefined
        });

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update user"
        });
    }
};

const remove = async (req, res) => {
    try {
        const deleted = await User.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete user"
        });
    }
};

module.exports = {
    register,
    login,
    checkExists,
    list,
    getOne,
    update,
    remove
};