/**
 * SQLite Database Schema Definition for Routines, Categories, Habits, and User Auth
 */

export const SQL_STATEMENTS = {
  // Create Users Table
  CREATE_USERS_TABLE: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,

  // Create Habits Table
  CREATE_HABITS_TABLE: `
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      frequency TEXT NOT NULL,
      target_days TEXT,
      reminder_time TEXT,
      goal_details TEXT,
      icon TEXT DEFAULT 'runner',
      icon_image_url TEXT DEFAULT '',
      streak INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `,

  // Create Habit Logs Table
  CREATE_LOGS_TABLE: `
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `,
};

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: string;
  targetDays: string[];
  reminderTime: string;
  goalDetails: string;
  icon: string;
  /** Backend path of a user-uploaded icon image ('' when using the emoji). */
  iconImageUrl: string;
  streak: number;
  completedDates: string[]; // YYYY-MM-DD strings
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completedDate: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
}
