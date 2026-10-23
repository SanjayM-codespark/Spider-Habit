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
            // A plain sign-up (no plan) must never overwrite an existing account.
            if (!subId) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }

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

        const deletedAccount = await User.findDeletedByEmailOrPhone({
            email: String(email).trim().toLowerCase(),
            phone: String(phone).trim()
        });
        if (deletedAccount) {
            return res.status(409).json({
                success: false,
                message: "This account was deleted. Please contact support to restore it."
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
    try {
        const includeDeleted = req.query?.includeDeleted === 'true' || req.query?.deleted === 'true';
        const users = includeDeleted ? await User.findAll(true) : await User.findAll();

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
 * Every habit of premium (subscribed) users, with the owner's details, for
 * the admin "Premium Habits" page.
 */
const listPremiumHabits = async (req, res) => {
    try {
        const data = await Habit.findPremium();

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("List premium habits error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch premium users' habits"
        });
    }
};

const listDeleted = async (req, res) => {
    try {
        const users = await User.findDeleted();
        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error("List deleted users error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch deleted users"
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

        const deleted = await User.findDeletedByEmailOrPhone({
            email: email ? String(email).trim().toLowerCase() : null,
            phone: phone ? String(phone).trim() : null
        });
        if (deleted) {
            return res.status(409).json({
                success: false,
                message: "This account was deleted. Please contact support to restore it."
            });
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

const LOGIN_MAX_EMAIL_LENGTH = 254;
const LOGIN_MAX_PASSWORD_LENGTH = 128;
const LOGIN_DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Only plain strings are accepted (rejects objects/arrays/numbers).
        if (
            (email !== undefined && typeof email !== "string") ||
            (password !== undefined && typeof password !== "string")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const normalizedEmail = (email || "").trim().toLowerCase();

        if (!normalizedEmail && !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        if (
            normalizedEmail.length > LOGIN_MAX_EMAIL_LENGTH ||
            password.length > LOGIN_MAX_PASSWORD_LENGTH ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        const user = await User.findByEmail(normalizedEmail);
        const deletedUser = user ? null : await User.findDeletedByEmail(normalizedEmail);

        // Always run a bcrypt compare so unknown emails take as long as wrong
        // passwords (no account enumeration by response time).
        const valid = await bcrypt.compare(
            password,
            (user || deletedUser)?.password_hash || LOGIN_DUMMY_HASH
        );

        // A deleted account is only reported as deleted once the correct
        // password is given, so this does not reveal which emails exist.
        if (deletedUser && valid) {
            return res.status(403).json({
                success: false,
                code: "ACCOUNT_DELETED",
                message: "This account has been deleted. Please contact admin."
            });
        }

        // Same generic message for unknown email and wrong password. The 404
        // status is kept only so the mobile app can fall back to its on-device
        // (free plan) accounts; the message never reveals which case it was.
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
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
            message: "Login failed. Please try again."
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
                message: "User not found or already deleted"
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

const restore = async (req, res) => {
    try {
        const restored = await User.restore(req.params.id);

        if (!restored) {
            return res.status(404).json({
                success: false,
                message: "Deleted user not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User restored successfully"
        });
    } catch (error) {
        console.error("Restore user error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to restore user"
        });
    }
};

module.exports = {
    register,
    login,
    checkExists,
    list,
    listPremiumHabits,
    listDeleted,
    getOne,
    update,
    remove,
    restore
};