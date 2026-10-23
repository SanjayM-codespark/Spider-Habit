import React from 'react';
import { StyleSheet, ViewStyle, StatusBar, StatusBarStyle, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  barStyle?: StatusBarStyle;
  edges?: Edge[];
}

/**
 * ScreenContainer ensures Edge-to-Edge compliance across all Android and iOS devices.
 * Prevents status bar (camera notch/punch hole) and bottom navigation gesture bar overlapping issues.
 * Any future page wrapping its contents with ScreenContainer will automatically be protected from overlaps.
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  backgroundColor = '#FFFFFF',
  barStyle = 'dark-content',
  // Exclude 'bottom' by default: screens inside AppNavigator have
  // the BottomTabBar handling the bottom safe-area inset already.
  // Auth screens (Login/Register) that have no tab bar can pass
  // edges={['top', 'bottom', 'left', 'right']} explicitly.
  edges = ['top', 'left', 'right'],
}) => {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }, style]}
      edges={edges}
    >
      <StatusBar
        barStyle={barStyle}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
});
