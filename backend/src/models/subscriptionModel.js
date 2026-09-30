const pool = require("../config/database");

const Subscription = {
    async create({ name, duration, description, platform, pricing, createdBy }) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const result = await client.query(
                `INSERT INTO subscriptions
                    (name, duration, description, platform, created_by)
                 VALUES
                    ($1, $2, $3, $4, $5)
                 RETURNING
                    id, name, duration, description, platform, is_active, created_at`,
                [name, duration, description, platform, createdBy]
            );

            const subscription = result.rows[0];

            for (const price of pricing) {
                await client.query(
                    `INSERT INTO subscription_prices
                        (subscription_id, country, currency, amount)
                     VALUES
                        ($1, $2, $3, $4)
                     ON CONFLICT (subscription_id, country)
                     DO UPDATE SET
                        currency = EXCLUDED.currency,
                        amount = EXCLUDED.amount`,
                    [subscription.id, price.country, price.currency, price.amount]
                );
            }

            await client.query("COMMIT");

            return subscription;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },

    async findById(id) {
        const result = await pool.query(
            `SELECT
                id, name, duration, description, platform,
                is_active, created_at, updated_at
             FROM subscriptions
             WHERE id = $1
             LIMIT 1`,
            [id]
        );

        const subscription = result.rows[0];
        if (!subscription) return null;

        const pricesResult = await pool.query(
            `SELECT country, currency, amount
             FROM subscription_prices
             WHERE subscription_id = $1
             ORDER BY country`,
            [id]
        );

        return {
            ...subscription,
            pricing: pricesResult.rows
        };
    },

    async update(id, { name, duration, description, platform, pricing }) {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const result = await client.query(
                `UPDATE subscriptions
                 SET name = $1, duration = $2, description = $3,
                     platform = $4, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5
                 RETURNING
                    id, name, duration, description, platform,
                    is_active, created_at, updated_at`,
                [name, duration, description, platform, id]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return null;
            }

            const subscription = result.rows[0];

            if (Array.isArray(pricing) && pricing.length > 0) {
                for (const price of pricing) {
                    await client.query(
                        `INSERT INTO subscription_prices
                            (subscription_id, country, currency, amount)
                         VALUES
                            ($1, $2, $3, $4)
                         ON CONFLICT (subscription_id, country)
                         DO UPDATE SET
                            currency = EXCLUDED.currency,
                            amount = EXCLUDED.amount`,
                        [id, price.country, price.currency, price.amount]
                    );
                }
            }

            await client.query("COMMIT");

            return subscription;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    },

    async remove(id) {
        const result = await pool.query(
            `DELETE FROM subscriptions
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        return result.rows[0] || null;
    },

    async findActive(country = null) {
        const result = await pool.query(
            `SELECT
                s.id, s.name, s.duration, s.description, s.platform,
                s.is_active, s.created_at
             FROM subscriptions s
             WHERE s.is_active = TRUE
             ORDER BY s.created_at DESC`
        );

        const subscriptions = result.rows;

        const pricesResult = await pool.query(
            `SELECT
                subscription_id, country, currency, amount
             FROM subscription_prices
             ORDER BY country`
        );

        const pricesBySubscription = {};
        for (const price of pricesResult.rows) {
            if (!pricesBySubscription[price.subscription_id]) {
                pricesBySubscription[price.subscription_id] = [];
            }
            pricesBySubscription[price.subscription_id].push(price);
        }

        if (country) {
            // Return only subscriptions that have pricing for the requested
            // country, with just that country's price (no fallback to others).
            const normalized = country.toUpperCase();
            return subscriptions
                .map((subscription) => {
                    const prices = pricesBySubscription[subscription.id] || [];
                    return {
                        ...subscription,
                        pricing: prices.filter((price) => price.country === normalized)
                    };
                })
                .filter((subscription) => subscription.pricing.length > 0);
        }

        return subscriptions.map((subscription) => ({
            ...subscription,
            pricing: pricesBySubscription[subscription.id] || []
        }));
    },

    async findAll() {
        const result = await pool.query(
            `SELECT
                s.id, s.name, s.duration, s.description, s.platform,
                s.is_active, s.created_at
             FROM subscriptions s
             ORDER BY s.created_at DESC`
        );

        const subscriptions = result.rows;

        const pricesResult = await pool.query(
            `SELECT
                subscription_id, country, currency, amount
             FROM subscription_prices
             ORDER BY country`
        );

        const pricesBySubscription = {};
        for (const price of pricesResult.rows) {
            if (!pricesBySubscription[price.subscription_id]) {
                pricesBySubscription[price.subscription_id] = [];
            }
            pricesBySubscription[price.subscription_id].push(price);
        }

        return subscriptions.map((subscription) => ({
            ...subscription,
            pricing: pricesBySubscription[subscription.id] || []
        }));
    }
};

module.exports = Subscription;