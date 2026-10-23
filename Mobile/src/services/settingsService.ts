import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { DEFAULT_FREE_HABIT_LIMIT } from '../config/planFeatures';
import { apiGet } from './apiClient';
import { logger } from '../utils/logger';

const TAG = 'SettingsService';
const FREE_HABIT_LIMIT_KEY = '@free_habit_limit';

/**
 * How many habits a free user may create (set by the admin under General
 * Settings). Falls back to the last value seen, then to the default, when the
 * server can't be reached.
 */
export const getFreeHabitLimit = async (): Promise<number> => {
  try {
    const payload = await apiGet<{
      success: boolean;
      data?: { free_habit_limit?: number };
    }>(API_ENDPOINTS.settings.public(), {
      name: 'settings.public',
      silent: true,
      timeoutMs: 8000,
    });
    const limit = Number(payload?.data?.free_habit_limit);
    if (Number.isInteger(limit) && limit >= 0) {
      await AsyncStorage.setItem(FREE_HABIT_LIMIT_KEY, String(limit));
      return limit;
    }
  } catch (error) {
    logger.warn(TAG, 'Could not fetch free habit limit', error);
  }

  const stored = await AsyncStorage.getItem(FREE_HABIT_LIMIT_KEY);
  const cached = stored === null ? NaN : Number(stored);
  return Number.isInteger(cached) && cached >= 0
    ? cached
    : DEFAULT_FREE_HABIT_LIMIT;
};
