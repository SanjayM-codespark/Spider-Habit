const pool = require("../config/database");

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

// Normalise subscription durations like "1 Month", "3 Months",
// "6 Months" or "1 Year" into a number of months.
function monthsFromDuration(duration) {
    const text = String(duration || "").toLowerCase();
    const match = text.match(/^(\d+)/);
    const count = match ? parseInt(match[1], 10) : 1;

    if (text.includes("year")) return count * 12;
    if (text.includes("month")) return count;
    if (text.includes("week")) return Math.round((count * 7) / 30);
    if (text.includes("day")) return Math.round(count / 30);
    return count;
}

const Dashboard = {
    async getOverview(expiryWindowDays = 7) {
        const windowDays = Number.isFinite(expiryWindowDays) ? expiryWindowDays : 7;

        const [usersResult, habitsResult, pricesResult, subscriptionsResult] =
            await Promise.all([
                pool.query(
                    `SELECT id, name, email, phone, is_subscribed, subscription_id, created_at
                     FROM users
                     ORDER BY created_at DESC`
                ),
                pool.query(`SELECT COUNT(*)::int AS count FROM habits`),
                pool.query(
                    `SELECT subscription_id, country, currency, amount
                     FROM subscription_prices`
                ),
                pool.query(`SELECT id, name, duration FROM subscriptions`)
            ]);

        const users = usersResult.rows;
        const prices = pricesResult.rows;
        const subscriptions = subscriptionsResult.rows;

        const currentSubscribers = users.filter((user) =>
            Boolean(user.is_subscribed)
        ).length;

        // The app has no transaction/payment table yet, so revenue is the
        // projected value coming from the configured price catalogue.
        const totalRevenue = prices.reduce(
            (sum, price) => sum + Number(price.amount),
            0
        );

        // Country-wise breakdown of the price catalogue.
        const countryMap = new Map();
        for (const price of prices) {
            if (!countryMap.has(price.country)) {
                countryMap.set(price.country, {
                    country: price.country,
                    currency: price.currency,
                    planCount: 0,
                    totalAmount: 0
                });
            }

            const entry = countryMap.get(price.country);
            entry.planCount += 1;
            entry.totalAmount += Number(price.amount);
        }

        const countryStats = Array.from(countryMap.values())
            .map((entry) => ({
                country: entry.country,
                currency: entry.currency,
                planCount: entry.planCount,
                totalAmount: Number(entry.totalAmount.toFixed(2))
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);

        // Subscribers whose plan period is about to run out. The plan start is
        // the user's created_at; its end is derived from the plan duration.
        const subscriptionById = new Map(
            subscriptions.map((subscription) => [subscription.id, subscription])
        );
        const now = Date.now();
        const windowMs = windowDays * DAY_MS;

        const expiringSoon = users
            .filter((user) => user.is_subscribed && user.subscription_id)
            .map((user) => {
                const subscription = subscriptionById.get(user.subscription_id);
                const months = subscription
                    ? monthsFromDuration(subscription.duration)
                    : 1;
                const endMs =
                    new Date(user.created_at).getTime() + months * MONTH_MS;
                const daysLeft = Math.ceil((endMs - now) / DAY_MS);

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    subscription_id: user.subscription_id,
                    subscription_name: subscription
                        ? subscription.name
                        : null,
                    end_date: new Date(endMs).toISOString(),
                    days_left: daysLeft
                };
            })
            .filter(
                (user) =>
                    user.days_left >= 0 && user.days_left <= windowDays
            )
            .sort((a, b) => a.days_left - b.days_left);

        return {
            stats: {
                totalUsers: users.length,
                totalHabits: habitsResult.rows[0].count,
                totalRevenue: Number(totalRevenue.toFixed(2)),
                currentSubscribers
            },
            countryStats,
            expiringSoon
        };
    }
};

module.exports = Dashboard;