const pool = require("../config/database");

const USER_FIELDS = `
    id, name, email, phone, client_user_id, is_subscribed, subscription_id, created_at
`;

const User = {
    async findByEmail(email) {
        const result = await pool.query(
            `SELECT id, name, email, phone, client_user_id, password_hash, is_subscribed, subscription_id, created_at
             FROM users
             WHERE email = $1
             LIMIT 1`,
            [email]
        );

        return result.rows[0] || null;
    },

    async findByPhone(phone) {
        const result = await pool.query(
            `SELECT id, name, email, phone, client_user_id, password_hash, is_subscribed, subscription_id, created_at
             FROM users
             WHERE phone = $1
             LIMIT 1`,
            [phone]
        );

        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await pool.query(
            `SELECT
                u.id, u.name, u.email, u.phone, u.client_user_id,
                u.password_hash, u.is_subscribed, u.subscription_id, u.created_at,
                s.name AS subscription_name
             FROM users u
             LEFT JOIN subscriptions s ON s.id = u.subscription_id
             WHERE u.id = $1
             LIMIT 1`,
            [id]
        );

        return result.rows[0] || null;
    },

    async findAll() {
        const result = await pool.query(
            `SELECT
                u.id, u.name, u.email, u.phone, u.client_user_id,
                u.is_subscribed, u.subscription_id, u.created_at,
                s.name AS subscription_name
             FROM users u
             LEFT JOIN subscriptions s ON s.id = u.subscription_id
             ORDER BY u.created_at DESC`
        );

        return result.rows;
    },

    async create({ name, email, phone, passwordHash, subscriptionId = null, clientUserId = null }) {
        const result = await pool.query(
            `INSERT INTO users
                (name, email, phone, password_hash, is_subscribed, subscription_id, client_user_id)
             VALUES
                ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email, phone, client_user_id, is_subscribed, subscription_id, created_at`,
            [
                name,
                email,
                phone,
                passwordHash,
                subscriptionId ? true : false,
                subscriptionId,
                clientUserId
            ]
        );

        return result.rows[0];
    },

    async update(id, { name, email, phone, passwordHash, isSubscribed, subscriptionId, clientUserId }) {
        const current = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id]
        );

        if (!current.rows[0]) return null;

        const row = current.rows[0];
        const result = await pool.query(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 phone = $3,
                 password_hash = $4,
                 is_subscribed = $5,
                 subscription_id = $6,
                 client_user_id = $7
             WHERE id = $8
             RETURNING ${USER_FIELDS}`,
            [
                name ?? row.name,
                email ?? row.email,
                phone ?? row.phone,
                passwordHash ?? row.password_hash,
                isSubscribed !== undefined ? isSubscribed : row.is_subscribed,
                subscriptionId !== undefined
                    ? subscriptionId
                    : row.subscription_id,
                clientUserId !== undefined ? clientUserId : row.client_user_id,
                id
            ]
        );

        return result.rows[0] || null;
    },

    async remove(id) {
        const result = await pool.query(
            `DELETE FROM users
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        return result.rows[0] || null;
    }
};

module.exports = User;