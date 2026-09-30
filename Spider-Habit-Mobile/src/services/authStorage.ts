import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiCall } from './apiClient';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
  /** Whether the user has a paid subscription (undefined for old accounts = free). */
  isSubscribed?: boolean;
  /** The mobile-generated client user id used to key habits in the backend.
   *  Present after a server login so backend habit lookups use the right key. */
  clientUserID?: string;
}

const USERS_KEY = '@users_db';
const CURRENT_USER_KEY = '@current_user_db';
const USER_ID_KEY = 'user_id';
const PENDING_USER_KEY = '@pending_user_db';

const TAG = 'AuthStorage';

export const authStorage = {
  /**
   * Get all registered users from local database
   */
  getUsers: async (): Promise<UserData[]> => {
    logger.debug(TAG, 'Fetching all users from AsyncStorage...');
    try {
      const data = await AsyncStorage.getItem(USERS_KEY);
      const users: UserData[] = data ? JSON.parse(data) : [];
      logger.info(TAG, `Fetched ${users.length} user(s) from DB`);
      return users;
    } catch (error) {
      logger.error(TAG, 'Error reading users from local DB', error);
      return [];
    }
  },

  /**
   * Save a pending user during registration (before OTP)
   */
  savePendingUser: async (user: UserData): Promise<void> => {
    logger.debug(TAG, 'Saving pending user', { phone: user.phone });
    await AsyncStorage.setItem(PENDING_USER_KEY, JSON.stringify(user));
  },

  /**
   * Get the current pending user
   */
  getPendingUser: async (): Promise<UserData | null> => {
    try {
      const data = await AsyncStorage.getItem(PENDING_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(TAG, 'Error reading pending user', error);
      return null;
    }
  },

  /**
   * Confirm pending user, save to real users DB, and create session
   */
  confirmPendingUser: async (): Promise<UserData> => {
    const pendingUser = await authStorage.getPendingUser();
    if (!pendingUser) {
      throw new Error('No pending registration found.');
    }

    const users = await authStorage.getUsers();
    const updatedUsers = [...users, pendingUser];
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    // Auto log-in after successful OTP
    await AsyncStorage.setItem(USER_ID_KEY, pendingUser.id);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(pendingUser));
    await AsyncStorage.removeItem(PENDING_USER_KEY);

    logger.info(TAG, 'User confirmed and registered successfully', {
      id: pendingUser.id,
      name: pendingUser.name,
    });

    return pendingUser;
  },

  /**
   * Register a new user and save to pending DB (Requires OTP to confirm).
   * Checks BOTH the local store and the server database so the same email or
   * phone cannot be used twice — a subscribed account already on the server
   * is caught even if it isn't present on this device.
   */
  registerUser: async (user: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<UserData> => {
    logger.info(TAG, 'Attempting to register new user', {
      name: user.name,
      email: user.email,
      phone: user.phone,
    });

    const email = user.email.trim().toLowerCase();
    const phone = user.phone.trim();

    // 1) Local check: this device already has the account.
    const users = await authStorage.getUsers();
    const existingPhone = users.find(u => u.phone.trim() === phone);
    if (existingPhone) {
      logger.warn(TAG, 'Registration failed — phone number already exists', {
        phone,
      });
      throw new Error('An account with this phone number already exists.');
    }

    const existingEmail = users.find(
      u => u.email.trim().toLowerCase() === email
    );
    if (existingEmail) {
      logger.warn(TAG, 'Registration failed — email already exists', {
        email,
      });
      throw new Error('An account with this email already exists.');
    }

    // 2) Server check: a subscribed account with the same email OR phone is
    //    already registered in the backend database (shared across devices).
    try {
      await apiCall<{ success: boolean }>(
        API_ENDPOINTS.users.checkExists(),
        {
          name: 'users.check-exists',
          method: 'POST',
          params: { email, phone },
          body: { email, phone },
          timeoutMs: 5000,
          expectedStatuses: [404, 409],
        },
      );
      // Server returned 200 — treat only on explicit 409 from the server.
    } catch (error: any) {
      // 409 means the email or phone already exists on the server → reject.
      // 404 means "not on the server" → safe to proceed.
      // Network failure → fall back to local-only registration.
      if (error?.status === 409) {
        const message =
          error?.message?.includes('phone')
            ? 'An account with this phone number already exists.'
            : 'An account with this email already exists.';
        logger.warn(TAG, 'Registration failed — exists on server', {
          email,
          phone,
        });
        throw new Error(message);
      }
      if (error?.status && error?.status !== 404) {
        logger.error(TAG, 'Server existence check failed', error);
        throw new Error(error?.message || 'Unable to verify account details.');
      }
      // 404 or network error → proceed with local registration.
    }

    const newUser: UserData = {
      id: Date.now().toString(),
      name: user.name.trim(),
      email,
      phone,
      password: user.password,
      createdAt: new Date().toISOString(),
      isSubscribed: false,
    };

    await authStorage.savePendingUser(newUser);

    logger.info(TAG, 'User saved as pending (waiting for OTP)', {
      id: newUser.id,
      name: newUser.name,
    });

    return newUser;
  },

  /**
   * Login user using phone number and password.
   *
   * 1) Server database first: validates against the hashed password in the
   *    backend `users` table. A 200 confirms the user (subscribed account).
   * 2) Falls back to the local store for free-only accounts (which only exist
   *    on this device and were never uploaded to the server).
   */
  loginUser: async (phone: string, password: string): Promise<UserData> => {
    logger.info(TAG, 'Attempting login', { phone });
    const cleanPhone = phone.trim();

    // --- Server database check first ---
    try {
      const payload = await apiCall<{
        success: boolean;
        data?: {
          id: number | string;
          name: string;
          email: string;
          phone: string;
          is_subscribed: boolean;
          subscription_id: number | null;
          client_user_id: string | null;
        };
      }>(API_ENDPOINTS.users.login(), {
        name: 'users.login',
        method: 'POST',
        params: { phone: cleanPhone },
        body: { phone: cleanPhone, password },
        timeoutMs: 8000,
        expectedStatuses: [404, 401],
      });

      const serverUser = payload?.data;
      if (serverUser) {
        // Build a session user from the server record, mirroring local shape.
        // clientUserID is the mobile key under which habits were synced to the
        // backend; it must be kept so habit lookups resolve the right record.
        const serverSession: UserData = {
          id: String(serverUser.id),
          name: serverUser.name,
          email: serverUser.email,
          phone: serverUser.phone,
          password,
          createdAt: new Date().toISOString(),
          isSubscribed: serverUser.is_subscribed,
          clientUserID: serverUser.client_user_id ?? undefined,
        };

        await AsyncStorage.setItem(USER_ID_KEY, serverSession.id);
        await AsyncStorage.setItem(
          CURRENT_USER_KEY,
          JSON.stringify(serverSession),
        );

        logger.info(TAG, 'Login successful via server', {
          id: serverSession.id,
          name: serverSession.name,
        });
        return serverSession;
      }
    } catch (error: any) {
      // 404 → account not on the server (free/local-only) → try local store.
      // 401 → account exists on the server but wrong password → reject.
      // Network failure → fall back to local store.
      if (error?.status === 401) {
        logger.warn(TAG, 'Login failed — invalid password on server', { phone });
        throw new Error('Invalid phone number or password.');
      }
      if (error?.status && error?.status !== 404) {
        logger.warn(TAG, 'Server login error, falling back to local', error);
      }
    }

    // --- Local store fallback ---
    const users = await authStorage.getUsers();
    const matchedUser = users.find(
      u => u.phone.trim() === cleanPhone && u.password === password
    );

    if (!matchedUser) {
      logger.warn(TAG, 'Login failed — invalid phone or password', { phone });
      throw new Error('Invalid phone number or password.');
    }

    // Set logged-in session
    await AsyncStorage.setItem(USER_ID_KEY, matchedUser.id);
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matchedUser));

    logger.info(TAG, 'Login successful via local storage', {
      id: matchedUser.id,
      name: matchedUser.name,
    });

    return matchedUser;
  },

  /**
   * Get currently logged-in user session
   */
  getCurrentUser: async (): Promise<UserData | null> => {
    logger.debug(TAG, 'Fetching current user session...');
    try {
      const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
      const user: UserData | null = data ? JSON.parse(data) : null;
      if (user) {
        logger.info(TAG, 'Current user session found', { id: user.id, name: user.name });
      } else {
        logger.info(TAG, 'No active user session found');
      }
      return user;
    } catch (error) {
      logger.error(TAG, 'Error reading current user session', error);
      return null;
    }
  },

  /**
   * Check if a user session exists
   */
  isLoggedIn: async (): Promise<boolean> => {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      const loggedIn = !!userId;
      logger.debug(TAG, `Session check → isLoggedIn: ${loggedIn}`, { userId });
      return loggedIn;
    } catch (error) {
      logger.error(TAG, 'Error checking login session', error);
      return false;
    }
  },

  /**
   * Logout user and clear session
   */
  logoutUser: async (): Promise<void> => {
    logger.info(TAG, 'Logging out user — clearing session keys');
    try {
      await AsyncStorage.removeItem(USER_ID_KEY);
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      logger.info(TAG, 'User session cleared successfully');
    } catch (error) {
      logger.error(TAG, 'Error logging out user', error);
    }
  },

  /**
   * Update the subscription status for a user (in the users DB and, if it
   * matches, the active session). Returns the updated user or null.
   */
  setSubscriptionStatus: async (
    userId: string,
    isSubscribed: boolean,
  ): Promise<UserData | null> => {
    logger.info(TAG, `setSubscriptionStatus() → userId ${userId}, subscribed: ${isSubscribed}`);

    const users = await authStorage.getUsers();
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, isSubscribed } : u,
    );
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    const current = await authStorage.getCurrentUser();
    if (current && current.id === userId) {
      const updatedCurrent = { ...current, isSubscribed };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
      logger.info(TAG, 'Current user session subscription status updated');
      return updatedCurrent;
    }

    const updatedUser = updatedUsers.find(u => u.id === userId);
    return updatedUser ?? null;
  },
};
