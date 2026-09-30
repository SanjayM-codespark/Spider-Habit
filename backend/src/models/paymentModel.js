const pool = require("../config/database");

const Payment = {
    async create({
        orderId,
        paymentId,
        amount,
        currency,
        email,
        subscriptionId
    }) {
        const result = await pool.query(
            `INSERT INTO payments
                (razorpay_order_id, razorpay_payment_id, amount, currency, email, subscription_id)
             VALUES
                ($1, $2, $3, $4, $5, $6)
             RETURNING
                id, razorpay_order_id, razorpay_payment_id, amount, currency,
                email, subscription_id, status, created_at`,
            [
                orderId,
                paymentId,
                amount,
                currency || "INR",
                email ? String(email).trim().toLowerCase() : null,
                subscriptionId ? Number(subscriptionId) : null
            ]
        );

        return result.rows[0];
    },

    async findAll() {
        const result = await pool.query(
            `SELECT
                p.id,
                p.razorpay_order_id,
                p.razorpay_payment_id,
                p.amount,
                p.currency,
                p.email,
                p.subscription_id,
                p.status,
                p.created_at,
                s.name AS plan_name,
                s.duration AS plan_duration
             FROM payments p
             LEFT JOIN subscriptions s ON s.id = p.subscription_id
             ORDER BY p.created_at DESC`
        );

        return result.rows;
    }
};

module.exports = Payment;