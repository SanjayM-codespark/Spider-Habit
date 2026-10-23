const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const User = require("../models/userModel");
const { sendMail } = require("../services/mailService");

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 4;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const hashOtp = (email, otp) =>
    crypto.createHash("sha256").update(`${email}:${otp}`).digest("hex");

const safeEqual = (a, b) => {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

/**
 * Step 1 of "forgot password": email a 6-digit code to the account's email.
 * Returns 404 when no account uses that email.
 */
const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            // Deleted accounts cannot be recovered through a password reset.
            if (await User.findDeletedByEmail(email)) {
                return res.status(403).json({
                    success: false,
                    code: "ACCOUNT_DELETED",
                    message: "This account has been deleted. Please contact admin."
                });
            }
            return res.status(404).json({
                success: false,
                message: "No account found with this email"
            });
        }

        const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");

        await pool.query(
            `INSERT INTO password_resets (email, otp_hash, expires_at, attempts)
             VALUES ($1, $2, CURRENT_TIMESTAMP + ($3 || ' minutes')::interval, 0)
             ON CONFLICT (email) DO UPDATE SET
                otp_hash = EXCLUDED.otp_hash,
                expires_at = EXCLUDED.expires_at,
                attempts = 0,
                created_at = CURRENT_TIMESTAMP`,
            [email, hashOtp(email, otp), String(OTP_TTL_MINUTES)]
        );

        await sendMail({
            to: email,
            subject: "Your Spider Habit password reset code",
            text:
                `Hi ${user.name},\n\n` +
                `Your password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.\n\n` +
                `If you did not request this, you can ignore this email.`,
            html:
                `<p>Hi ${escapeHtml(user.name)},</p>` +
                `<p>Your password reset code is <strong style="font-size:20px;letter-spacing:3px">${otp}</strong>.</p>` +
                `<p>It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.</p>`
        });

        return res.status(200).json({
            success: true,
            message: "A verification code has been sent to your email."
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(Number(error.status) || 500).json({
            success: false,
            message: error.status === 503
                ? "Email service is not available right now. Please try again later."
                : "Failed to send verification code"
        });
    }
};

/**
 * Step 2: verify the emailed code and set the new password.
 */
const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();
        const newPassword = String(req.body.newPassword || "");

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, code and new password are required"
            });
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
            });
        }

        const invalid = () =>
            res.status(400).json({ success: false, message: "Invalid or expired verification code" });

        const result = await pool.query(
            `SELECT otp_hash, attempts, expires_at > CURRENT_TIMESTAMP AS active
             FROM password_resets WHERE email = $1`,
            [email]
        );
        const reset = result.rows[0];
        if (!reset || !reset.active || reset.attempts >= MAX_OTP_ATTEMPTS) {
            return invalid();
        }

        if (!safeEqual(reset.otp_hash, hashOtp(email, otp))) {
            await pool.query(
                `UPDATE password_resets SET attempts = attempts + 1 WHERE email = $1`,
                [email]
            );
            return invalid();
        }

        const user = await User.findByEmail(email);
        if (!user) return invalid();

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await User.update(user.id, { passwordHash });
        await pool.query(`DELETE FROM password_resets WHERE email = $1`, [email]);

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, message: "Failed to reset password" });
    }
};

/**
 * Edit name / email / phone. The mobile app has no session token, so the
 * account is identified by its current email and confirmed with its password.
 * Returns 404 when the account isn't on the server (device-only account).
 */
const updateProfile = async (req, res) => {
    try {
        const currentEmail = normalizeEmail(req.body.currentEmail);
        const password = String(req.body.password || "");
        const name = String(req.body.name || "").trim();
        const email = normalizeEmail(req.body.email);
        const phone = String(req.body.phone || "").trim();

        if (!currentEmail || !password) {
            return res.status(400).json({ success: false, message: "Current email and password are required" });
        }
        if (!name || !email || !phone) {
            return res.status(400).json({ success: false, message: "Name, email and phone are required" });
        }

        const user = await User.findByEmail(currentEmail);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found on server" });
        }
        if (!(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        if (email !== user.email) {
            const taken = await User.findByEmail(email);
            if (taken) {
                return res.status(409).json({ success: false, message: "An account with this email already exists" });
            }
            // Deleted accounts keep their email, so it cannot be reused.
            if (await User.findDeletedByEmail(email)) {
                return res.status(409).json({ success: false, message: "This email belongs to a deleted account. Please use a different email or contact admin." });
            }
        }
        if (phone !== user.phone) {
            const taken = await User.findByPhone(phone);
            if (taken) {
                return res.status(409).json({ success: false, message: "An account with this phone number already exists" });
            }
            if (await User.findDeletedByEmailOrPhone({ phone })) {
                return res.status(409).json({ success: false, message: "This phone number belongs to a deleted account. Please use a different number or contact admin." });
            }
        }

        const updated = await User.update(user.id, { name, email, phone });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                phone: updated.phone
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        // Unique-constraint race (email/phone taken between the check and the write).
        if (error && error.code === "23505") {
            const field = /phone/i.test(error.constraint || error.detail || "") ? "phone number" : "email";
            return res.status(409).json({ success: false, message: `An account with this ${field} already exists` });
        }
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};

/**
 * Change password from inside the app: the account is identified by its email
 * and confirmed with the current password. Returns 404 when the account isn't
 * on the server (device-only account).
 */
const changePassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, current password and new password are required"
            });
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
            });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found on server" });
        }
        if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(401).json({ success: false, message: "Current password is incorrect" });
        }

        await User.update(user.id, { passwordHash: await bcrypt.hash(newPassword, 10) });

        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ success: false, message: "Failed to change password" });
    }
};

/**
 * Delete the caller's own account. It is a soft delete (is_deleted = TRUE), so
 * the account moves to "Deleted Users" in the admin panel where it can be
 * restored, and its habits are kept. Confirmed with the account password.
 * Returns 404 when the account isn't on the server (device-only account).
 */
const deleteAccount = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found on server" });
        }
        if (!(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        await User.remove(user.id);
        await pool.query(`DELETE FROM password_resets WHERE email = $1`, [email]);

        return res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete account" });
    }
};

/**
 * Logout notification from the app. Sessions live on the device (there is no
 * server-side token to revoke), so this just clears any pending password
 * reset code for the account and acknowledges.
 */
const logout = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (email) {
            await pool.query(`DELETE FROM password_resets WHERE email = $1`, [email]);
        }
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Failed to log out" });
    }
};

module.exports = {
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    logout
};
