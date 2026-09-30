CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    duration VARCHAR(50) NOT NULL,

    description TEXT NOT NULL,

    platform VARCHAR(20) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_prices (
    id BIGSERIAL PRIMARY KEY,

    subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

    country VARCHAR(2) NOT NULL,

    currency VARCHAR(10) NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (subscription_id, country)
);