const Habit = require("../models/habitModel");
const { UPLOAD_PUBLIC_PREFIX } = require("../middleware/iconUpload");

/**
 * Habit icons may only point at files this backend hosts. Anything else
 * (absolute URLs, data URIs, other hosts) is dropped so a habit record can
 * never be used to reference a third-party resource or an attacker page.
 */
const sanitizeIconImageUrl = value => {
    const raw = value ? String(value).trim() : "";
    return raw.startsWith(`${UPLOAD_PUBLIC_PREFIX}/`) ? raw : "";
};

const listByUser = async (req, res) => {
    try {
        const { clientUserId } = req.params;

        if (!clientUserId) {
            return res.status(400).json({
                success: false,
                message: "User id is required"
            });
        }

        const habits = await Habit.findByClientUserId(clientUserId);

        return res.status(200).json({
            success: true,
            data: habits
        });
    } catch (error) {
        console.error("List habits error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch habits"
        });
    }
};

const create = async (req, res) => {
    try {
        const {
            clientUserId,
            title,
            frequency,
            targetDays,
            reminderTime,
            goalDetails,
            icon,
            iconImageUrl
        } = req.body;

        if (!clientUserId || !title || !frequency) {
            return res.status(400).json({
                success: false,
                message: "clientUserId, title and frequency are required"
            });
        }

        const habit = await Habit.create({
            clientUserId: String(clientUserId),
            title: String(title).trim(),
            frequency: String(frequency),
            targetDays: Array.isArray(targetDays) ? targetDays : [],
            reminderTime: reminderTime ? String(reminderTime) : "",
            goalDetails: goalDetails ? String(goalDetails) : "",
            icon: icon ? String(icon) : "runner",
            iconImageUrl: sanitizeIconImageUrl(iconImageUrl)
        });

        return res.status(201).json({
            success: true,
            message: "Habit created successfully",
            data: habit
        });
    } catch (error) {
        console.error("Create habit error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create habit"
        });
    }
};

const update = async (req, res) => {
    try {
        const {
            title,
            goalDetails,
            icon,
            iconImageUrl,
            frequency,
            targetDays,
            reminderTime,
            streak,
            completedDates
        } = req.body;

        const habit = await Habit.update(req.params.id, {
            title,
            goalDetails,
            icon,
            iconImageUrl:
                iconImageUrl === undefined
                    ? undefined
                    : sanitizeIconImageUrl(iconImageUrl),
            frequency,
            targetDays,
            reminderTime,
            streak,
            completedDates
        });

        if (!habit) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Habit updated successfully",
            data: habit
        });
    } catch (error) {
        console.error("Update habit error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update habit"
        });
    }
};

/**
 * Store a custom habit icon image and hand back the public path to persist on
 * the habit row. Uploading is decoupled from habit creation so the mobile app
 * can show a preview while the user is still filling in the form; the path is
 * only referenced once POST /api/habits (or PATCH /api/habits/:id) runs.
 */
const uploadIcon = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "An 'icon' image file is required"
        });
    }

    return res.status(201).json({
        success: true,
        message: "Icon uploaded successfully",
        data: {
            url: `${UPLOAD_PUBLIC_PREFIX}/${req.file.filename}`
        }
    });
};

const remove = async (req, res) => {
    try {
        const deleted = await Habit.remove(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Habit not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Habit deleted successfully"
        });
    } catch (error) {
        console.error("Delete habit error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete habit"
        });
    }
};

module.exports = {
    listByUser,
    create,
    update,
    uploadIcon,
    remove
};