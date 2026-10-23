import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStorage, UserData } from '../services/authStorage';
import { habitService } from '../services/habitService';
import { getAuth, signInWithPhoneNumber, ConfirmationResult } from '@react-native-firebase/auth';

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  /** Re-read the stored session (e.g. after subscribing) without a loading state. */
  refreshUser: () => Promise<void>;
  updateProfile: (input: { name: string; email: string; phone: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: async () => {},
  register: async () => {},
  sendOtp: async () => {},
  verifyOtp: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  deleteAccount: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authStorage.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const currentUser = await authStorage.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  };

  const updateProfile = async (input: { name: string; email: string; phone: string }) => {
    if (!user) {
      throw new Error('User session invalid. Please log in again.');
    }
    const updated = await authStorage.updateProfile(user, input);
    setUser(updated);
  };

  const deleteAccount = async () => {
    if (!user) {
      throw new Error('User session invalid. Please log in again.');
    }
    await authStorage.deleteAccount(user);
    setUser(null);
    setIsLoggedIn(false);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('User session invalid. Please log in again.');
    }
    const updated = await authStorage.changePassword(user, currentPassword, newPassword);
    setUser(updated);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authStorage.loginUser(email, password);
    setUser(loggedInUser);
    setIsLoggedIn(true);

    // Subscribed users keep their habits on the server; push any that are
    // still only on this device (e.g. an earlier upload that didn't finish).
    if (loggedInUser.isSubscribed) {
      habitService.migrateLocalToBackend(loggedInUser);
    }
  };

  const sendOtp = async (phone: string) => {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
      setConfirmationResult(confirmation);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send OTP.');
    }
  };

  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    // Save as pending user (does not login)
    await authStorage.registerUser(data);

    // OTP verification is disabled for now: confirm the account and log in
    // straight away. To re-enable, restore the sendOtp() call below and the
    // OtpVerification navigation in RegisterScreen.
    // await sendOtp(data.phone);
    const newUser = await authStorage.confirmPendingUser();
    setUser(newUser);
    setIsLoggedIn(true);
  };

  const verifyOtp = async (otpCode: string) => {
    if (!confirmationResult) {
      throw new Error('No OTP session found. Try sending OTP again.');
    }
    try {
      // Verify OTP with Firebase
      await confirmationResult.confirm(otpCode);
      
      // Confirm the user in our local storage and create session
      const newUser = await authStorage.confirmPendingUser();
      
      setUser(newUser);
      setIsLoggedIn(true);
      setConfirmationResult(null); // Clear OTP session
    } catch (error: any) {
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code. Please try again.');
      }
      throw new Error(error.message || 'OTP verification failed.');
    }
  };

  const logout = async () => {
    if (user?.email) {
      authStorage.notifyLogout(user.email);
    }
    await authStorage.logoutUser();
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        checkAuthStatus,
        refreshUser,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
