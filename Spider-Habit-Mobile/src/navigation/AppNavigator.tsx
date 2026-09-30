import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import CreateHabitScreen from '../screens/CreateHabitScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ManageHabitsScreen from '../screens/ManageHabitsScreen';
import HelpScreen from '../screens/HelpScreen';
import HelpDetailScreen from '../screens/HelpDetailScreen';
import TotalHabitsScreen from '../screens/TotalHabitsScreen';
import { BottomTabBar } from '../components/BottomTabBar';
import {
  setNavigationBridge,
  clearNavigationBridge,
} from './navigationBridge';

export type MainTabType =
  | 'Dashboard'
  | 'Create'
  | 'Progress'
  | 'Settings'
  | 'Subscription'
  | 'ManageHabits'
  | 'Help'
  | 'HelpDetail'
  | 'TotalHabits';

/** Page selection carried from HelpScreen → HelpDetailScreen. */
export interface HelpPageSelection {
  slug?: string;
  title?: string;
}

const AppNavigator = () => {
  const [activeScreen, setActiveScreen] = useState<MainTabType>('Dashboard');
  const [screenStack, setScreenStack] = useState<MainTabType[]>(['Dashboard']);
  const [helpPage, setHelpPage] = useState<HelpPageSelection>({});

  const navigateTo = (screen: MainTabType, params?: HelpPageSelection) => {
    if (screen === 'HelpDetail' && params?.slug) {
      setHelpPage({ slug: params.slug, title: params.title });
    }
    setScreenStack(prev =>
      prev[prev.length - 1] === screen ? prev : [...prev, screen],
    );
    setActiveScreen(screen);
  };

  const goBack = () => {
    setScreenStack(prev => {
      if (prev.length > 1) {
        const next = [...prev];
        next.pop();
        const target = next[next.length - 1];
        setActiveScreen(target);
        return next;
      }
      if (activeScreen === 'HelpDetail') {
        setActiveScreen('Help');
      } else if (
        activeScreen === 'Subscription' ||
        activeScreen === 'ManageHabits' ||
        activeScreen === 'Help'
      ) {
        setActiveScreen('Settings');
      } else if (activeScreen === 'TotalHabits') {
        setActiveScreen('Progress');
        return ['Progress'];
      } else if (activeScreen !== 'Dashboard') {
        setActiveScreen('Dashboard');
        return ['Dashboard'];
      }
      return prev;
    });
  };

  useEffect(() => {
    setNavigationBridge((screen: MainTabType) => navigateTo(screen));
    return () => clearNavigationBridge();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (screenStack.length > 1) {
        goBack();
        return true;
      }
      if (activeScreen === 'HelpDetail') {
        setActiveScreen('Help');
        return true;
      }
      if (
        activeScreen === 'Subscription' ||
        activeScreen === 'ManageHabits' ||
        activeScreen === 'Help'
      ) {
        setActiveScreen('Settings');
        return true;
      }
      if (activeScreen === 'TotalHabits') {
        navigateTo('Progress');
        return true;
      }
      if (activeScreen !== 'Dashboard') {
        setActiveScreen('Dashboard');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [screenStack, activeScreen]);

  const renderActiveScreen = (navigation: any) => {
    switch (activeScreen) {
      case 'Dashboard':
        return <DashboardScreen navigation={navigation} />;
      case 'Create':
        return <CreateHabitScreen navigation={navigation} />;
      case 'Progress':
        return <ProgressScreen navigation={navigation} />;
      case 'Settings':
        return <SettingsScreen navigation={navigation} />;
      case 'Subscription':
        return <SubscriptionScreen navigation={navigation} />;
      case 'ManageHabits':
        return <ManageHabitsScreen navigation={navigation} />;
      case 'Help':
        return <HelpScreen navigation={navigation} />;
      case 'HelpDetail':
        return <HelpDetailScreen navigation={navigation} page={helpPage} />;
      case 'TotalHabits':
        return <TotalHabitsScreen navigation={navigation} />;
      default:
        return <DashboardScreen navigation={navigation} />;
    }
  };

  const navObj = {
    navigate: navigateTo,
    goBack,
  };

  const currentTab =
    activeScreen === 'Subscription' ||
    activeScreen === 'ManageHabits' ||
    activeScreen === 'Help' ||
    activeScreen === 'HelpDetail'
      ? 'Settings'
      : activeScreen === 'TotalHabits'
      ? 'Dashboard'
      : activeScreen;

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderActiveScreen(navObj)}</View>

      {/* Bottom Navigation Bar — hidden on sub-pages */}
      {activeScreen !== 'Subscription' &&
        activeScreen !== 'ManageHabits' &&
        activeScreen !== 'Help' &&
        activeScreen !== 'HelpDetail' &&
        activeScreen !== 'TotalHabits' && (
          <BottomTabBar
            activeTab={currentTab}
            onSelectTab={tab => navigateTo(tab)}
          />
        )}
    </View>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // White matches the BottomTabBar background so the system nav bar
    // area on Android 15 edge-to-edge is seamless, not teal.
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
