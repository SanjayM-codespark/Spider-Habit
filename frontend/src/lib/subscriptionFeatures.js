// Plan features the admin can switch on per subscription. Keep these keys in
// sync with backend/src/constants/subscriptionFeatures.js and
// Mobile/src/config/planFeatures.ts.
export const SUBSCRIPTION_FEATURES = [
  {
    key: 'unlimited_habits',
    label: 'Unlimited habits',
    hint: 'Create any number of habits (free plan is capped).',
  },
  {
    key: 'custom_icons',
    label: 'Custom habit icons',
    hint: 'Upload your own image as a habit icon.',
  },
  {
    key: 'advanced_progress',
    label: 'Advanced progress & reports',
    hint: 'Monthly heatmap and full progress history.',
  },
]

export function emptyFeatures() {
  return Object.fromEntries(SUBSCRIPTION_FEATURES.map((f) => [f.key, false]))
}
