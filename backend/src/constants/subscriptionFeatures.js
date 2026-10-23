// Plan features the admin can switch on per subscription. Keep these keys in
// sync with frontend/src/lib/subscriptionFeatures.js and
// Mobile/src/config/planFeatures.ts.
const SUBSCRIPTION_FEATURES = [
    "unlimited_habits",
    "custom_icons",
    "advanced_progress"
];

/**
 * Reduce any input to a full { key: boolean } map containing only known
 * features, so unknown keys are dropped and missing ones default to false.
 */
const normalizeFeatures = (input) => {
    const source = input && typeof input === "object" ? input : {};
    const features = {};
    for (const key of SUBSCRIPTION_FEATURES) {
        features[key] = source[key] === true;
    }
    return features;
};

module.exports = { SUBSCRIPTION_FEATURES, normalizeFeatures };
