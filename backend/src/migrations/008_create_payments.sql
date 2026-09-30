CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,

    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,

    razorpay_payment_id VARCHAR(100) NOT NULL UNIQUE,

    amount DECIMAL(12, 2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    email VARCHAR(255),

    subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'captured',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);