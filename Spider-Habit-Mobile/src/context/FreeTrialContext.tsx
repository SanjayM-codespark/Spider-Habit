import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useAlert } from './AlertContext';
import { databaseService } from '../database/databaseService';
import { authStorage } from '../services/authStorage';
import {
  freeTrialStorage,
  FreeTrialEntry,
} from '../services/freeTrialStorage';
import { FREE_TRIAL_DURATION_MS, FREE_TRIAL_TICK_MS } from '../config/trialConfig';
import { navigateToScreen } from '../navigation/navigationBridge';
import { logger } from '../utils/logger';

const TAG = 'FreeTrialContext';

interface FreeTrialContextType {
  /** Whether the current user has a paid subscription. */
  isSubscribed: boolean;
  /** Milliseconds left before habits are deleted (null when no free trial). */
  timeLeftMs: number | null;
  /** True once the free trial has ended and habits were deleted. */
  isExpired: boolean;
  /** Mark the current user as subscribed (persisted locally). */
  markSubscribed: () => Promise<void>;
}

const FreeTrialContext = createContext<FreeTrialContextType>({
  isSubscribed: false,
  timeLeftMs: null,
  isExpired: false,
  markSubscribed: async () => {},
});

export const FreeTrialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);
  const alertShownRef = useRef(false);

  const userId = user?.id ?? null;

  // Reset state whenever the logged-in user changes / logs out.
  useEffect(() => {
    // User logged out → stop the clock, clear it, and prepare for next login.
    if (!userId) {
      if (previousUserIdRef.current) {
        freeTrialStorage.clearTrial(previousUserIdRef.current);
      }
      previousUserIdRef.current = null;
      alertShownRef.current = false;
      setIsSubscribed(false);
      setTimeLeftMs(null);
      setIsExpired(false);
      return;
    }

    previousUserIdRef.current = userId;
    setIsSubscribed(!!user?.isSubscribed);
    alertShownRef.current = false;

    if (user?.isSubscribed) {
      freeTrialStorage.clearTrial(userId);
      setTimeLeftMs(null);
      setIsExpired(false);
    }
  }, [userId, user?.isSubscribed]);

  // Free-trial countdown + enforcement.
  useEffect(() => {
    if (!userId || isSubscribed) {
      setTimeLeftMs(null);
      setIsExpired(false);
      return;
    }

    let disposed = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      let entry: FreeTrialEntry | null = null;
      try {
        entry = await freeTrialStorage.getTrial(userId);
      } catch (error) {
        logger.error(TAG, 'Failed to read trial entry', error);
      }

      const loginAt = entry?.loginAt ?? Date.now();
      if (!entry) {
        freeTrialStorage.saveTrial(userId, { loginAt, enforced: false });
      }

      const elapsed = Date.now() - loginAt;
      const left = Math.max(0, FREE_TRIAL_DURATION_MS - elapsed);

      if (disposed) return;
      setTimeLeftMs(left);

      // Time is up for a free user: delete ALL habits immediately, and
      // KEEP checking (interval is left running) so any habit created
      // after expiry is also wiped until the user subscribes.
      if (left === 0) {
        try {
          const habits = await databaseService.getHabits(userId);
          if (habits.length > 0) {
            await databaseService.clearAllData(userId);
            logger.warn(
              TAG,
              `Habits deleted after free trial expiry for user ${userId}`,
            );
            setIsExpired(true);
          }
        } catch (error) {
          logger.error(TAG, 'Failed to clear habits after trial expiry', error);
        }

        if (!entry?.enforced) {
          freeTrialStorage.saveTrial(userId, { loginAt, enforced: true });
        }

        if (!alertShownRef.current) {
          alertShownRef.current = true;
          showAlert(
            'Free Trial Ended',
            'Your free trial is over, so your habits were removed. Subscribe to Pro to keep your habits safe and unlock unlimited tracking!',
            [
              {
                text: 'Upgrade to Pro',
                onPress: () => navigateToScreen('Subscription'),
              },
              { text: 'Later', style: 'cancel' },
            ],
          );
        }
      }
    };

    tick();
    interval = setInterval(tick, FREE_TRIAL_TICK_MS);

    return () => {
      disposed = true;
      if (interval) clearInterval(interval);
    };
  }, [userId, isSubscribed, showAlert]);

  const markSubscribed = async () => {
    if (!userId) return;
    logger.info(TAG, `markSubscribed() → user ${userId} subscribed`);
    await authStorage.setSubscriptionStatus(userId, true);
    await freeTrialStorage.clearTrial(userId);
    setIsSubscribed(true);
    setIsExpired(false);
    setTimeLeftMs(null);
  };

  return (
    <FreeTrialContext.Provider
      value={{ isSubscribed, timeLeftMs, isExpired, markSubscribed }}
    >
      {children}
    </FreeTrialContext.Provider>
  );
};

export const useFreeTrial = () => useContext(FreeTrialContext);

export default FreeTrialProvider;