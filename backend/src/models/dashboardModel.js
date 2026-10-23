const pool = require("../config/database");
const { countryFromPhone } = require("../constants/countries");

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

        const [usersResult, habitsResult, paymentsResult, subscriptionsResult] =
            await Promise.all([
                pool.query(
                    `SELECT id, name, email, phone, is_subscribed, subscription_id, created_at
                     FROM users
                     WHERE is_deleted IS NOT TRUE
                     ORDER BY created_at DESC`
                ),
                pool.query(`SELECT COUNT(*)::int AS count FROM habits`),
                pool.query(
                    `SELECT email, currency, amount
                     FROM payments
                     WHERE status = 'captured'`
                ),
                pool.query(`SELECT id, name, duration FROM subscriptions`)
            ]);

        const users = usersResult.rows;
        const payments = paymentsResult.rows;
        const subscriptions = subscriptionsResult.rows;

        const currentSubscribers = users.filter((user) =>
            Boolean(user.is_subscribed)
        ).length;

        // Revenue is what was actually paid (captured payments), kept per
        // currency because amounts in different currencies can't be added.
        const addAmount = (map, currency, amount) =>
            map.set(currency, (map.get(currency) || 0) + Number(amount));
        const toList = (map) =>
            Array.from(map.entries()).map(([currency, amount]) => ({
                currency,
                amount: Number(amount.toFixed(2))
            }));

        const totalRevenueMap = new Map();
        for (const payment of payments) {
            addAmount(totalRevenueMap, payment.currency, payment.amount);
        }

        // Country-wise breakdown: a user's country comes from the dial code
        // of their phone number; revenue is attributed through the payer's
        // email.
        const countryByEmail = new Map();
        const countryMap = new Map();
        const getEntry = (country) => {
            if (!countryMap.has(country)) {
                countryMap.set(country, {
                    country,
                    users: 0,
                    subscribers: 0,
                    revenue: new Map()
                });
            }
            return countryMap.get(country);
        };

        for (const user of users) {
            const country = countryFromPhone(user.phone) || "UNKNOWN";
            countryByEmail.set(String(user.email).toLowerCase(), country);
            const entry = getEntry(country);
            entry.users += 1;
            if (user.is_subscribed) entry.subscribers += 1;
        }

        for (const payment of payments) {
            const country = countryByEmail.get(String(payment.email || "").toLowerCase());
            if (country) addAmount(getEntry(country).revenue, payment.currency, payment.amount);
        }

        const countryStats = Array.from(countryMap.values())
            .map((entry) => ({
                country: entry.country,
                users: entry.users,
                subscribers: entry.subscribers,
                revenue: toList(entry.revenue)
            }))
            .sort((x, y) => y.users - x.users);

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
                totalRevenue: toList(totalRevenueMap),
                currentSubscribers
            },
            countryStats,
            expiringSoon
        };
    }
};

module.exports = Dashboard;