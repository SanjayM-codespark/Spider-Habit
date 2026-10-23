import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const TAG = 'FreeTrialStorage';

export interface FreeTrialEntry {
  /** Timestamp (ms) when the free trial clock started = login time. */
  loginAt: number;
  /** Whether the habits were already deleted for this session. */
  enforced: boolean;
}

const getKey = (userId: string) => `@free_trial_${userId}`;

export const freeTrialStorage = {
  getTrial: async (userId: string): Promise<FreeTrialEntry | null> => {
    try {
      const data = await AsyncStorage.getItem(getKey(userId));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(TAG, `getTrial() failed for userId ${userId}`, error);
      return null;
    }
  },

  saveTrial: async (userId: string, entry: FreeTrialEntry): Promise<void> => {
    try {
      await AsyncStorage.setItem(getKey(userId), JSON.stringify(entry));
      logger.debug(TAG, `saveTrial() → userId ${userId}`, entry);
    } catch (error) {
      logger.error(TAG, `saveTrial() failed for userId ${userId}`, error);
    }
  },

  clearTrial: async (userId: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(getKey(userId));
      logger.debug(TAG, `clearTrial() → userId ${userId}`);
    } catch (error) {
      logger.error(TAG, `clearTrial() failed for userId ${userId}`, error);
    }
  },
};

export default freeTrialStorage;