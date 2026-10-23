const pool = require("../config/database");

const Admin = {
    async findByUsername(username) {
        const result = await pool.query(
            `SELECT id, name, username, password_hash, role, is_active
             FROM admins
             WHERE username = $1
             LIMIT 1`,
            [username]
        );

        return result.rows[0] || null;
    },

    async findByEmail(email) {
        return this.findByUsername(email);
    },

    async findById(id) {
        const result = await pool.query(
            `SELECT id, name, username, role, is_active, created_at
             FROM admins
             WHERE id = $1
             LIMIT 1`,
            [id]
        );

        return result.rows[0] || null;
    },

    async create({ name, username, email, passwordHash, role = "admin" }) {
        const uname = username || email;
        const result = await pool.query(
            `INSERT INTO admins
                (name, username, password_hash, role)
             VALUES
                ($1, $2, $3, $4)
             RETURNING id, name, username, role, is_active, created_at`,
            [name, uname, passwordHash, role]
        );

        return result.rows[0];
    }
};

module.exports = Admin;