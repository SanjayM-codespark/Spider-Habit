import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CountryProvider } from '../context/CountryContext';
import { FreeTrialProvider } from '../context/FreeTrialContext';
import Splashscreen from '../screens/Splashscreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

const NavigationStack = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for at least 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2000ms = 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Only the auth status must be resolved before we can route. Country
  // detection is deliberately NOT awaited here: it can take seconds on a slow
  // or restricted network and it only affects subscription pricing, which
  // SubscriptionScreen resolves on its own.
  if (isLoading || showSplash) {
    return <Splashscreen />;
  }

  return (
    <NavigationContainer>
      {/* If logged in, navigate to AppNavigator (HomeScreen). Otherwise, AuthNavigator (WelcomeScreen) */}
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const RootNavigation = () => {
  return (
    <CountryProvider>
      <AuthProvider>
        <FreeTrialProvider>
          <NavigationStack />
        </FreeTrialProvider>
      </AuthProvider>
    </CountryProvider>
  );
};

export default RootNavigation;