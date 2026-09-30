import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import { Habit } from '../database/sqliteSchema';
import { logger } from '../utils/logger';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

const TAG = 'NotificationService';
const CHANNEL_ID = 'habit-reminders-v2';

// iOS uses different sound format
const getSoundName = () => {
  return Platform.OS === 'ios' ? 'habit_reminder.caf' : 'habit_reminder.mp3';
};

function getNotificationId(idStr: string): number {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const notificationService = {
  initialize: () => {
    logger.info(TAG, 'initialize() — Setting up push notifications');

    PushNotification.configure({
      onNotification: function (notification) {
        logger.debug(TAG, 'Notification received', notification);
        // Required on iOS for proper handling
        if (Platform.OS === 'ios' && notification.finish) {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Android: create channel (iOS ignores this)
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: CHANNEL_ID,
          channelName: 'Habit Reminders',
          channelDescription: 'Daily habit reminder notifications',
          importance: 4,
          vibrate: true,
          playSound: true,
          soundName: 'habit_reminder.mp3',
        },
        created => {
          logger.info(TAG, `Notification channel created: ${created}`);
        },
      );
    }

    logger.info(TAG, 'initialize() — Push notification system initialized');
  },

  requestPermission: async (): Promise<boolean> => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Habit Reminder Permission',
            message:
              'Spider Habit needs permission to send you habit reminder notifications.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        logger.info(
          TAG,
          `Android notification permission: ${
            isGranted ? 'granted' : 'denied'
          }`,
        );
        return isGranted;
      } catch (err) {
        logger.error(
          TAG,
          'Failed to request Android notification permission',
          err,
        );
        return false;
      }
    }
    return true;
  },

  parseReminderTime: (
    reminderTime: string,
  ): { hour: number; minute: number } => {
    const [timePart, period] = reminderTime.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return { hour, minute };
  },

  scheduleHabitReminder: (habit: Habit) => {
    if (!habit.reminderTime) {
      logger.warn(
        TAG,
        `scheduleHabitReminder() — No reminder time for habit: ${habit.title}`,
      );
      return;
    }

    const { hour, minute } = notificationService.parseReminderTime(
      habit.reminderTime,
    );

    notificationService.cancelHabitReminder(habit.id);

    let daysToSchedule = habit.targetDays;
    if (!daysToSchedule || daysToSchedule.length === 0) {
      daysToSchedule = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }

    const soundName = getSoundName();

    daysToSchedule.forEach(day => {
      const dayIndex = WEEK_DAYS_MAP[day];
      if (dayIndex === undefined) return;

      const notificationId = getNotificationId(habit.id + day);
      const scheduleDate = getNextScheduleDateForDay(dayIndex, hour, minute);

      logger.info(TAG, `Scheduling reminder for "${habit.title}" on ${day}`, {
        reminderTime: habit.reminderTime,
        scheduleDate: scheduleDate.toISOString(),
        notificationId,
        sound: soundName,
      });

      // iOS and Android have different notification scheduling
      if (Platform.OS === 'ios') {
        // iOS uses PushNotificationIOS for scheduling
        // react-native-push-notification handles this internally
        PushNotification.localNotificationSchedule({
          id: String(notificationId),
          title: `⏰ ${habit.title}`,
          message: habit.goalDetails
            ? `Time to work on: ${habit.goalDetails}`
            : `Time to work on your habit: ${habit.title}`,
          date: scheduleDate,
          repeatType: 'week',
          playSound: true,
          soundName: soundName, // iOS needs .caf file
          userInfo: { habitId: habit.id },
        });
      } else {
        // Android
        PushNotification.localNotificationSchedule({
          channelId: CHANNEL_ID,
          id: String(notificationId),
          title: `⏰ ${habit.title}`,
          message: habit.goalDetails
            ? `Time to work on: ${habit.goalDetails}`
            : `Time to work on your habit: ${habit.title}`,
          date: scheduleDate,
          repeatType: 'week',
          allowWhileIdle: true,
          playSound: true,
          soundName: 'habit_reminder.mp3',
          importance: 'high',
          priority: 'high',
          largeIcon: 'ic_launcher',
          smallIcon: 'ic_launcher',
          vibrate: true,
          vibration: 300,
        });
      }
    });
  },

  cancelHabitReminder: (habitId: string) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      const notificationId = getNotificationId(habitId + day);
      PushNotification.cancelLocalNotifications({ id: String(notificationId) });
    });

    const legacyId = getNotificationId(habitId);
    PushNotification.cancelLocalNotifications({ id: String(legacyId) });

    logger.info(TAG, `Cancelled all reminders for habitId: ${habitId}`);
  },

  cancelAllReminders: () => {
    logger.info(TAG, 'Cancelling all scheduled notifications');
    PushNotification.cancelAllLocalNotifications();
  },

  scheduleAllReminders: (habits: Habit[]) => {
    logger.info(
      TAG,
      `scheduleAllReminders() — Scheduling for ${habits.length} habit(s)`,
    );
    habits.forEach(habit => {
      notificationService.scheduleHabitReminder(habit);
    });
  },
};

const WEEK_DAYS_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getNextScheduleDateForDay(
  dayIndex: number,
  hour: number,
  minute: number,
): Date {
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hour, minute, 0, 0);

  let daysUntil = (dayIndex - now.getDay() + 7) % 7;

  if (daysUntil === 0 && scheduled <= now) {
    daysUntil = 7;
  }

  scheduled.setDate(scheduled.getDate() + daysUntil);
  return scheduled;
}

export default notificationService;
