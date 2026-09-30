/**
 * Global font family (Montserrat) is applied here via Text.defaultProps
 * so every <Text> and <TextInput> across all screens inherits Montserrat-Regular
 * without needing per-screen fontFamily style declarations.
 */

import React from 'react';
import { Text, TextInput, StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NetworkStatusBanner } from './src/components/NetworkStatusBanner';
import RootNavigator from './src/navigation/RootNavigation';
import { AlertProvider } from './src/context/AlertContext';

// ─── GLOBAL FONT DEFAULTS ────────────────────────────────────────────────────
// Apply Montserrat-Regular to every <Text> and <TextInput> app-wide.
// This avoids needing fontFamily in every single screen's StyleSheet.
const TextAny = Text as any;
if (!TextAny.defaultProps) TextAny.defaultProps = {};
TextAny.defaultProps.style = { fontFamily: 'Montserrat-Regular' };

const TextInputAny = TextInput as any;
if (!TextInputAny.defaultProps) TextInputAny.defaultProps = {};
TextInputAny.defaultProps.style = { fontFamily: 'Montserrat-Regular' };
// ─────────────────────────────────────────────────────────────────────────────


function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <NetworkStatusBanner />
      <AlertProvider>
        <RootNavigator />
      </AlertProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
