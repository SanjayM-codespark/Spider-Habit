const pool = require("../config/database");

const Settings = {
    async getAll() {
        const result = await pool.query(
            `SELECT key, value FROM app_settings`
        );

        const settings = {};
        for (const row of result.rows) {
            settings[row.key] = row.value;
        }

        return settings;
    },

    async update(values = {}) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            for (const [key, value] of Object.entries(values)) {
                await client.query(
                    `INSERT INTO app_settings (key, value, updated_at)
                     VALUES ($1, $2, CURRENT_TIMESTAMP)
                     ON CONFLICT (key)
                     DO UPDATE SET value = EXCLUDED.value,
                                    updated_at = CURRENT_TIMESTAMP`,
                    [key, value === null || value === undefined ? "" : String(value)]
                );
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        return Settings.getAll();
    }
};

module.exports = Settings;