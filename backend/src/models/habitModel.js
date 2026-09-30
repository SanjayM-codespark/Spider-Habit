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

    async create({ clientUserId, title, frequency, targetDays, reminderTime, goalDetails, icon, iconImageUrl }) {
        const result = await pool.query(
            `INSERT INTO habits
                (client_user_id, title, frequency, target_days, reminder_time, goal_details, icon, icon_image_url)
             VALUES
                ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
             RETURNING ${HABIT_FIELDS}`,
            [
                clientUserId,
                title,
                frequency,
                JSON.stringify(targetDays || []),
                reminderTime || "",
                goalDetails || "",
                icon || "runner",
                iconImageUrl || ""
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