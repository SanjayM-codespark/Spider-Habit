// Plan features an admin can switch on per subscription. Keep these keys in
// sync with backend/src/constants/subscriptionFeatures.js and
// frontend/src/lib/subscriptionFeatures.js.
export type PlanFeatureKey =
  | 'unlimited_habits'
  | 'custom_icons'
  | 'advanced_progress';

export type PlanFeatures = Partial<Record<PlanFeatureKey, boolean>>;

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  unlimited_habits: 'Unlimited habits',
  custom_icons: 'Custom habit icons',
  advanced_progress: 'Advanced progress & reports',
};

/** Fallback when the admin-set limit can't be fetched. */
export const DEFAULT_FREE_HABIT_LIMIT = 7;
