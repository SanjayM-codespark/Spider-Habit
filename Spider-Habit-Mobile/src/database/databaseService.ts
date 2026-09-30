import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog } from './sqliteSchema';
import { UserData, authStorage } from '../services/authStorage';
import { logger } from '../utils/logger';

const HABITS_KEY = '@sqlite_habits_db';
const TAG = 'DatabaseService';

export const databaseService = {
  // --- USER AUTHENTICATION (proxied from authStorage) ---
  registerUser: authStorage.registerUser,
  loginUser: authStorage.loginUser,
  getCurrentUser: authStorage.getCurrentUser,
  isLoggedIn: authStorage.isLoggedIn,
  logoutUser: authStorage.logoutUser,

  /**
   * Fetch all habits for a specific user
   */
  getHabits: async (userId: string): Promise<Habit[]> => {
    logger.debug(TAG, `getHabits() → userId: ${userId}`);
    try {
      const data = await AsyncStorage.getItem(`${HABITS_KEY}_${userId}`);
      const habits: Habit[] = data ? JSON.parse(data) : [];
      logger.info(TAG, `Loaded ${habits.length} habit(s) for user ${userId}`);
      return habits;
    } catch (error) {
      logger.error(TAG, 'getHabits() failed', error);
      return [];
    }
  },

  /**
   * Create and save a new habit into local DB
   */
  createHabit: async (habitData: {
    userId: string;
    title: string;
    frequency: string;
    targetDays: string[];
    reminderTime: string;
    goalDetails: string;
    icon: string;
    iconImageUrl?: string;
  }): Promise<Habit> => {
    logger.info(TAG, 'createHabit() → Creating new habit', {
      userId: habitData.userId,
      title: habitData.title,
      frequency: habitData.frequency,
      targetDays: habitData.targetDays,
      reminderTime: habitData.reminderTime,
      goalDetails: habitData.goalDetails,
      icon: habitData.icon,
      iconImageUrl: habitData.iconImageUrl,
    });

    const habits = await databaseService.getHabits(habitData.userId);

    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      userId: habitData.userId,
      title: habitData.title.trim(),
      frequency: habitData.frequency,
      targetDays: habitData.targetDays,
      reminderTime: habitData.reminderTime,
      goalDetails: habitData.goalDetails.trim(),
      icon: habitData.icon || 'runner',
      iconImageUrl: habitData.iconImageUrl || '',
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    const updatedHabits = [newHabit, ...habits];
    await AsyncStorage.setItem(
      `${HABITS_KEY}_${habitData.userId}`,
      JSON.stringify(updatedHabits)
    );

    logger.info(TAG, `Habit created successfully`, {
      id: newHabit.id,
      title: newHabit.title,
      totalHabits: updatedHabits.length,
    });

    return newHabit;
  },

  /**
   * Toggle completion status of a habit for a given YYYY-MM-DD date
   */
  toggleHabitCompletion: async (
    habitId: string,
    userId: string,
    dateStr: string
  ): Promise<Habit[]> => {
    logger.info(TAG, `toggleHabitCompletion() → habitId: ${habitId}, date: ${dateStr}`);

    const habits = await databaseService.getHabits(userId);
    const targetHabit = habits.find(h => h.id === habitId);

    if (!targetHabit) {
      logger.warn(TAG, `toggleHabitCompletion() — habitId not found: ${habitId}`);
    }

    const updated = habits.map(h => {
      if (h.id === habitId) {
        const isCompleted = h.completedDates.includes(dateStr);
        let newDates: string[];
        let newStreak = h.streak;

        if (isCompleted) {
          newDates = h.completedDates.filter(d => d !== dateStr);
          newStreak = Math.max(0, h.streak - 1);
          logger.info(TAG, `Habit unchecked for ${dateStr}`, {
            title: h.title,
            newStreak,
          });
        } else {
          newDates = [...h.completedDates, dateStr];
          newStreak = h.streak + 1;
          logger.info(TAG, `Habit checked/completed for ${dateStr}`, {
            title: h.title,
            newStreak,
            totalCompletions: newDates.length,
          });
        }

        return {
          ...h,
          completedDates: newDates,
          streak: newStreak,
        };
      }
      return h;
    });

    await AsyncStorage.setItem(
      `${HABITS_KEY}_${userId}`,
      JSON.stringify(updated)
    );

    logger.debug(TAG, 'toggleHabitCompletion() → DB updated successfully');
    return updated;
  },

  /**
   * Delete a habit from DB
   */
  deleteHabit: async (habitId: string, userId: string): Promise<Habit[]> => {
    logger.info(TAG, `deleteHabit() → habitId: ${habitId}, userId: ${userId}`);

    const habits = await databaseService.getHabits(userId);
    const habitToDelete = habits.find(h => h.id === habitId);

    if (!habitToDelete) {
      logger.warn(TAG, `deleteHabit() — habit not found with id: ${habitId}`);
    } else {
      logger.info(TAG, `Deleting habit: "${habitToDelete.title}"`);
    }

    const updated = habits.filter(h => h.id !== habitId);
    await AsyncStorage.setItem(
      `${HABITS_KEY}_${userId}`,
      JSON.stringify(updated)
    );

    logger.info(TAG, `deleteHabit() done. Remaining habits: ${updated.length}`);
    return updated;
  },

  /**
   * Update an existing habit's editable fields
   */
  updateHabit: async (
    habitId: string,
    userId: string,
    updates: {
      title?: string;
      goalDetails?: string;
      icon?: string;
      iconImageUrl?: string;
      frequency?: string;
      targetDays?: string[];
      reminderTime?: string;
    }
  ): Promise<Habit[]> => {
    logger.info(TAG, `updateHabit() → habitId: ${habitId}`, updates);
    const habits = await databaseService.getHabits(userId);
    const updated = habits.map(h =>
      h.id === habitId ? { ...h, ...updates } : h
    );
    await AsyncStorage.setItem(`${HABITS_KEY}_${userId}`, JSON.stringify(updated));
    logger.info(TAG, 'updateHabit() done');
    return updated;
  },

  /**
   * Clear all habit data for user (Delete Account)
   */
  clearAllData: async (userId: string): Promise<void> => {
    logger.warn(TAG, `clearAllData() — Deleting ALL habit data for userId: ${userId}`);
    await AsyncStorage.removeItem(`${HABITS_KEY}_${userId}`);
    logger.info(TAG, 'clearAllData() — All habit data removed from AsyncStorage');
  },
};
