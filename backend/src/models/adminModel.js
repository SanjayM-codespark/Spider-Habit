const pool = require("../config/database");

const Admin = {
    async findByEmail(email) {
        const result = await pool.query(
            `SELECT id, name, email, password_hash, role, is_active
             FROM admins
             WHERE email = $1
             LIMIT 1`,
            [email]
        );

        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await pool.query(
            `SELECT id, name, email, role, is_active, created_at
             FROM admins
             WHERE id = $1
             LIMIT 1`,
            [id]
        );

        return result.rows[0] || null;
    },

    async create({ name, email, passwordHash, role = "admin" }) {
        const result = await pool.query(
            `INSERT INTO admins
                (name, email, password_hash, role)
             VALUES
                ($1, $2, $3, $4)
             RETURNING id, name, email, role, is_active, created_at`,
            [name, email, passwordHash, role]
        );

        return result.rows[0];
    }
};

module.exports = Admin;