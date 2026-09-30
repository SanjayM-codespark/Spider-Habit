import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiGet } from './apiClient';
import { logger } from '../utils/logger';

const TAG = 'SubscriptionService';

export interface SubscriptionPrice {
  country: string;
  currency: string;
  amount: number | string;
}

export interface Subscription {
  id: number;
  name: string;
  duration: string;
  description: string;
  platform: string;
  is_active: boolean;
  created_at: string;
  pricing: SubscriptionPrice[];
}

export interface CurrentSubscriptionUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_subscribed: boolean;
  subscription_id: number | null;
  created_at: string;
}

export interface CurrentSubscriptionData {
  isSubscribed: boolean;
  user: CurrentSubscriptionUser | null;
  subscription: Subscription | null;
}

export const subscriptionService = {
  /**
   * Fetch all active subscription packages from the backend.
   * When a country code is provided, the backend returns only packages
   * with pricing for that country.
   */
  getActiveSubscriptions: async (country: string = 'US'): Promise<Subscription[]> => {
    logger.debug(TAG, `getActiveSubscriptions() → fetching active plans for ${country}`);
    const payload = await apiGet<{ data: Subscription[] }>(
      API_ENDPOINTS.subscriptions.public(country),
      { name: 'subscriptions.public', params: { country } },
    );

    const subscriptions: Subscription[] = payload?.data ?? [];
    logger.info(TAG, `getActiveSubscriptions() → ${subscriptions.length} plan(s) loaded for ${country}`);
    return subscriptions;
  },

  /**
   * Fetch the currently subscribed user's plan details from the backend,
   * identified by their registered email. Returns null when the lookup fails.
   */
  getCurrentSubscription: async (
    email: string,
  ): Promise<CurrentSubscriptionData | null> => {
    logger.info(TAG, `getCurrentSubscription() → fetching details for ${email}`);
    const payload = await apiGet<{ data: CurrentSubscriptionData }>(
      API_ENDPOINTS.subscriptions.current(email),
      { name: 'subscriptions.current', params: { email } },
    );

    const data = payload?.data ?? null;
    logger.info(
      TAG,
      `getCurrentSubscription() → isSubscribed: ${data?.isSubscribed}, plan: ${data?.subscription?.name ?? 'none'}`,
    );
    return data;
  },
};

export default subscriptionService;