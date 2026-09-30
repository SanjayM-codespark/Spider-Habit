const Settings = require("../models/settingsModel");

const GENERAL_KEYS = [
    "app_name",
    "android_version",
    "ios_version",
    "app_store_link",
    "play_store_link"
];

const PAYMENT_KEYS = [
    "razorpay_key",
    "razorpay_secret"
];

const get = async (req, res) => {
    try {
        const settings = await Settings.getAll();

        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error("Get settings error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch settings"
        });
    }
};

const updateGeneral = async (req, res) => {
    try {
        const payload = {};
        for (const key of GENERAL_KEYS) {
            if (req.body[key] !== undefined) {
                payload[key] = String(req.body[key]).trim();
            }
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No settings to update"
            });
        }

        const settings = await Settings.update(payload);

        return res.status(200).json({
            success: true,
            message: "General settings updated successfully",
            data: settings
        });
    } catch (error) {
        console.error("Update general settings error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update general settings"
        });
    }
};

const updatePayment = async (req, res) => {
    try {
        const payload = {};
        for (const key of PAYMENT_KEYS) {
            if (req.body[key] !== undefined) {
                payload[key] = String(req.body[key]).trim();
            }
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No settings to update"
            });
        }

        const settings = await Settings.update(payload);

        return res.status(200).json({
            success: true,
            message: "Payment settings updated successfully",
            data: settings
        });
    } catch (error) {
        console.error("Update payment settings error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update payment settings"
        });
    }
};

module.exports = {
    get,
    updateGeneral,
    updatePayment
};