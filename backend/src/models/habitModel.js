const pool = require("../config/database");

const HABIT_FIELDS = `
    id, client_user_id, title, frequency, target_days, reminder_time,
    goal_details, icon, icon_image_url, streak, completed_dates,
    created_at, updated_at
`;

const Habit = {
    async findByClientUserId(clientUserId) {
        const result = await pool.query(
            `SELECT ${HABIT_FIELDS}
             FROM habits
             WHERE client_user_id = $1
             ORDER BY created_at DESC`,
            [clientUserId]
        );

        return result.rows;
    },

    /** Every habit owned by a premium (subscribed, not deleted) user, with the owner's details. */
    async findPremium() {
        const result = await pool.query(
            `SELECT
                h.id, h.client_user_id, h.title, h.frequency, h.target_days,
                h.reminder_time, h.goal_details, h.icon, h.icon_image_url,
                h.streak, h.completed_dates, h.created_at, h.updated_at,
                u.id AS user_id, u.name AS user_name, u.email AS user_email,
                u.phone AS user_phone, s.name AS subscription_name
             FROM habits h
             JOIN users u ON u.client_user_id = h.client_user_id
             LEFT JOIN subscriptions s ON s.id = u.subscription_id
             WHERE u.is_subscribed = TRUE AND (u.is_deleted IS NULL OR u.is_deleted = FALSE)
             ORDER BY u.name, h.created_at DESC`
        );

        return result.rows;
    },

    async create({ clientUserId, title, frequency, targetDays, reminderTime, goalDetails, icon, iconImageUrl, streak, completedDates }) {
        const result = await pool.query(
            `INSERT INTO habits
                (client_user_id, title, frequency, target_days, reminder_time, goal_details, icon, icon_image_url, streak, completed_dates)
             VALUES
                ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10::jsonb)
             RETURNING ${HABIT_FIELDS}`,
            [
                clientUserId,
                title,
                frequency,
                JSON.stringify(targetDays || []),
                reminderTime || "",
                goalDetails || "",
                icon || "runner",
                iconImageUrl || "",
                Number.isInteger(streak) && streak > 0 ? streak : 0,
                JSON.stringify(Array.isArray(completedDates) ? completedDates : [])
            ]
        );

        return result.rows[0];
    },

    async update(id, updates = {}) {
        const current = await pool.query(
            `SELECT * FROM habits WHERE id = $1`,
            [id]
        );

        if (!current.rows[0]) return null;

        const row = current.rows[0];
        const merged = {
            title: updates.title ?? row.title,
            frequency: updates.frequency ?? row.frequency,
            target_days: JSON.stringify(updates.targetDays ?? row.target_days),
            reminder_time: updates.reminderTime ?? row.reminder_time,
            goal_details: updates.goalDetails ?? row.goal_details,
            icon: updates.icon ?? row.icon,
            icon_image_url: updates.iconImageUrl ?? row.icon_image_url ?? "",
            streak: updates.streak ?? row.streak,
            completed_dates: JSON.stringify(
                updates.completedDates ?? row.completed_dates
            )
        };

        const result = await pool.query(
            `UPDATE habits
             SET title = $1,
                 frequency = $2,
                 target_days = $3::jsonb,
                 reminder_time = $4,
                 goal_details = $5,
                 icon = $6,
                 icon_image_url = $7,
                 streak = $8,
                 completed_dates = $9::jsonb,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $10
             RETURNING ${HABIT_FIELDS}`,
            [
                merged.title,
                merged.frequency,
                merged.target_days,
                merged.reminder_time,
                merged.goal_details,
                merged.icon,
                merged.icon_image_url,
                merged.streak,
                merged.completed_dates,
                id
            ]
        );

        return result.rows[0] || null;
    },

    async remove(id) {
        const result = await pool.query(
            `DELETE FROM habits WHERE id = $1 RETURNING id`,
            [id]
        );

        return result.rows[0] || null;
    }
};

module.exports = Habit;