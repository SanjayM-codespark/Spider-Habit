import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useFreeTrial } from './FreeTrialContext';
import { subscriptionService } from '../services/subscriptionService';
import { PlanFeatureKey, PlanFeatures } from '../config/planFeatures';
import { logger } from '../utils/logger';

const TAG = 'PlanFeaturesContext';
const CACHE_KEY_PREFIX = '@plan_features_';

interface PlanFeaturesContextType {
  /** Whether the user's current plan includes the given feature. */
  hasFeature: (key: PlanFeatureKey) => boolean;
  /** Re-fetch the plan's features from the backend. */
  refreshFeatures: () => Promise<void>;
}

const PlanFeaturesContext = createContext<PlanFeaturesContextType>({
  hasFeature: () => false,
  refreshFeatures: async () => {},
});

export const PlanFeaturesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { isSubscribed } = useFreeTrial();
  // null = not known yet (never fetched and nothing cached).
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const userKeyRef = useRef<string | null>(null);

  const userId = user?.id ?? null;
  const email = user?.email ?? null;

  const refreshFeatures = useCallback(async () => {
    if (!userId || !email || !isSubscribed) {
      return;
    }
    try {
      const data = await subscriptionService.getCurrentSubscription(email);
      const planFeatures = data?.subscription?.features ?? {};
      if (userKeyRef.current !== userId) {
        return;
      }
      setFeatures(planFeatures);
      await AsyncStorage.setItem(
        CACHE_KEY_PREFIX + userId,
        JSON.stringify(planFeatures),
      );
    } catch (err) {
      // Offline or server error — keep whatever we already have.
      logger.warn(TAG, 'refreshFeatures() failed, keeping cached features', err);
    }
  }, [userId, email, isSubscribed]);

  // Load the cached features first (works offline), then refresh from the server.
  useEffect(() => {
    userKeyRef.current = userId;
    setFeatures(null);

    if (!userId || !isSubscribed) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY_PREFIX + userId);
        if (!cancelled && cached) {
          setFeatures(JSON.parse(cached));
        }
      } catch (err) {
        logger.warn(TAG, 'Could not read cached features', err);
      }
      if (!cancelled) {
        refreshFeatures();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isSubscribed, refreshFeatures]);

  // Pick up admin changes to the plan when the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshFeatures();
      }
    });
    return () => sub.remove();
  }, [refreshFeatures]);

  const hasFeature = useCallback(
    (key: PlanFeatureKey) => {
      if (!isSubscribed) {
        return false;
      }
      // Paid user whose plan hasn't loaded yet (first launch offline): don't
      // lock them out of what they paid for.
      if (features === null) {
        return true;
      }
      return features[key] === true;
    },
    [isSubscribed, features],
  );

  return (
    <PlanFeaturesContext.Provider value={{ hasFeature, refreshFeatures }}>
      {children}
    </PlanFeaturesContext.Provider>
  );
};

export const usePlanFeatures = () => useContext(PlanFeaturesContext);

export default PlanFeaturesProvider;
