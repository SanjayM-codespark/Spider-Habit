import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiCall, apiGet } from './apiClient';
import { databaseService } from '../database/databaseService';
import type { Habit } from '../database/sqliteSchema';
import type { UserData } from './authStorage';
import { logger } from '../utils/logger';

const TAG = 'HabitService';

interface BackendHabitRow {
  id: number | string;
  client_user_id: string;
  title: string;
  frequency: string;
  target_days: string[] | null;
  reminder_time: string;
  goal_details: string;
  icon: string;
  icon_image_url: string | null;
  streak: number;
  completed_dates: string[] | null;
  created_at: string;
}

export interface HabitInput {
  title: string;
  frequency: string;
  targetDays: string[];
  reminderTime: string;
  goalDetails: string;
  icon: string;
  /** Backend path of an uploaded icon image; '' when using the built-in emoji. */
  iconImageUrl?: string;
}

/** A file selected from the device gallery, ready to be posted as multipart. */
export interface PickedIconFile {
  uri: string;
  name: string;
  type: string;
}

/** Subscribed users persist their habits in the backend database. */
const usesBackend = (user: UserData | null) => !!(user?.id && user?.isSubscribed);

/**
 * The key that identifies a user's habits in the backend `habits` table
 * (client_user_id). Prefer the stored clientUserID when present (e.g. after a
 * server login, where user.id is the DB id, not the mobile sync key); for
 * local sessions fall back to user.id, which was the original sync key.
 */
const backendHabitKey = (user: UserData | null): string | null => {
  if (!user) return null;
  return user.clientUserID ?? user.id;
};

/** Map a backend habit row into the mobile Habit shape. */
const toHabit = (row: BackendHabitRow): Habit => ({
  id: String(row.id),
  userId: String(row.client_user_id),
  title: row.title,
  frequency: row.frequency,
  targetDays: row.target_days ?? [],
  reminderTime: row.reminder_time,
  goalDetails: row.goal_details,
  icon: row.icon,
  iconImageUrl: row.icon_image_url ?? '',
  streak: row.streak,
  completedDates: row.completed_dates ?? [],
  createdAt: row.created_at,
});

export const habitService = {
  getHabits: async (user: UserData | null): Promise<Habit[]> => {
    if (!user?.id) return [];
    if (!usesBackend(user)) {
      return databaseService.getHabits(user.id);
    }

    const habitKey = backendHabitKey(user);
    if (!habitKey) return [];

    try {
      const payload = await apiGet<{ data?: BackendHabitRow[] }>(
        API_ENDPOINTS.habits.list(habitKey),
        { name: 'habits.list', params: { userId: habitKey } },
      );
      const rows = payload?.data ?? [];
      logger.info(TAG, `getHabits() → ${rows.length} habit(s) loaded from backend`);
      return rows.map(toHabit);
    } catch (error) {
      logger.error(
        TAG,
        'getHabits() → backend failed, falling back to local storage',
        error,
      );
      return databaseService.getHabits(user.id);
    }
  },

  createHabit: async (
    user: UserData | null,
    data: HabitInput,
  ): Promise<Habit> => {
    if (!user?.id) {
      throw new Error('User session invalid. Please log in again.');
    }

    if (!usesBackend(user)) {
      return databaseService.createHabit({ userId: user.id, ...data });
    }

    const habitKey = backendHabitKey(user);
    const payload = await apiCall<{ data?: BackendHabitRow }>(
      API_ENDPOINTS.habits.create(),
      {
        name: 'habits.create',
        method: 'POST',
        params: { title: data.title },
        body: { clientUserId: habitKey, ...data },
      },
    );
    return toHabit(payload?.data!);
  },

  toggleHabitCompletion: async (
    user: UserData | null,
    habitId: string,
    dateStr: string,
  ): Promise<Habit[]> => {
    if (!user?.id) {
      logger.warn(TAG, 'toggleHabitCompletion() aborted — no user session');
      return [];
    }

    if (!usesBackend(user)) {
      return databaseService.toggleHabitCompletion(habitId, user.id, dateStr);
    }

    const current = await habitService.getHabits(user);
    const target = current.find(h => h.id === habitId);
    if (!target) return current;

    const isCompleted = target.completedDates.includes(dateStr);
    const newDates = isCompleted
      ? target.completedDates.filter(d => d !== dateStr)
      : [...target.completedDates, dateStr];
    const newStreak = isCompleted
      ? Math.max(0, target.streak - 1)
      : target.streak + 1;

    await apiCall<{ data?: BackendHabitRow }>(
      API_ENDPOINTS.habits.update(habitId),
      {
        name: 'habits.toggle',
        method: 'PATCH',
        params: { date: dateStr },
        body: { streak: newStreak, completedDates: newDates },
      },
    );

    logger.info(TAG, `Habit "${target.title}" toggled in backend`, {
      streak: newStreak,
      date: dateStr,
    });

    return current.map(h =>
      h.id === habitId ? { ...h, streak: newStreak, completedDates: newDates } : h,
    );
  },

  updateHabit: async (
    user: UserData | null,
    habitId: string,
    updates: Partial<HabitInput>,
  ): Promise<Habit[]> => {
    if (!user?.id) return [];

    if (!usesBackend(user)) {
      return databaseService.updateHabit(habitId, user.id, updates);
    }

    await apiCall<{ data?: BackendHabitRow }>(
      API_ENDPOINTS.habits.update(habitId),
      {
        name: 'habits.update',
        method: 'PATCH',
        params: updates,
        body: updates,
      },
    );

    const current = await habitService.getHabits(user);
    return current.map(h => (h.id === habitId ? { ...h, ...updates } : h));
  },

  deleteHabit: async (
    user: UserData | null,
    habitId: string,
  ): Promise<Habit[]> => {
    if (!user?.id) return [];

    if (!usesBackend(user)) {
      return databaseService.deleteHabit(habitId, user.id);
    }

    await apiCall(API_ENDPOINTS.habits.delete(habitId), {
      name: 'habits.delete',
      method: 'DELETE',
      params: { habitId },
    });

    const current = await habitService.getHabits(user);
    return current.filter(h => h.id !== habitId);
  },

  /**
   * Upload a custom habit icon and return the backend path to store on the
   * habit. Uploading is separate from habit creation so the Create screen can
   * show a preview before the habit itself is saved.
   *
   * Free-tier users upload here too even though their habits live in local
   * storage: the returned path is an ordinary URL that the app can still load,
   * and it keeps the two storage backends behaving identically.
   */
  uploadHabitIcon: async (file: PickedIconFile): Promise<string> => {
    const form = new FormData();
    // React Native's FormData accepts this {uri,name,type} shape for file
    // parts; the Blob cast is only needed to satisfy the DOM typings.
    form.append(
      'icon',
      { uri: file.uri, name: file.name, type: file.type } as unknown as Blob,
    );

    const payload = await apiCall<{ data?: { url?: string } }>(
      API_ENDPOINTS.habits.uploadIcon(),
      {
        name: 'habits.uploadIcon',
        method: 'POST',
        body: form,
        // Uploading a photo over a slow connection needs a longer budget than
        // the 10s default.
        timeoutMs: 60000,
      },
    );

    const url = payload?.data?.url;
    if (!url) {
      throw new Error('Icon upload failed. Please try again.');
    }

    logger.info(TAG, 'uploadHabitIcon() → icon stored on backend', { url });
    return url;
  },

  /**
   * After subscribing, push any habits that still only live in local storage
   * into the backend so the user's data isn't lost when the Dashboard starts
   * reading from the backend.
   */
  migrateLocalToBackend: async (user: UserData | null): Promise<void> => {
    if (!user?.id || !usesBackend(user)) return;
    logger.info(TAG, `migrateLocalToBackend() → user ${user.id}`);

    try {
      const local = await databaseService.getHabits(user.id);
      if (local.length === 0) {
        logger.debug(TAG, 'No local habits to migrate');
        return;
      }

      const remote = await habitService.getHabits(user);
      const remoteIds = new Set(remote.map(h => h.id));

      for (const habit of local) {
        if (remoteIds.has(habit.id)) continue;
        await habitService.createHabit(user, {
          title: habit.title,
          frequency: habit.frequency,
          targetDays: habit.targetDays,
          reminderTime: habit.reminderTime,
          goalDetails: habit.goalDetails,
          icon: habit.icon,
          iconImageUrl: habit.iconImageUrl,
        });
      }
      logger.info(TAG, `Migrated ${local.length} habit(s) to backend`);
    } catch (error) {
      logger.error(TAG, 'migrateLocalToBackend() failed', error);
    }
  },
};

export default habitService;