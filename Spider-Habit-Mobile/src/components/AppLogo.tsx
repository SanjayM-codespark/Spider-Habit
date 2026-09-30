import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import spiderHabitLogo from '../assets/icons/spiderhabit-logo.png';

const LOGO_HEIGHT_RATIO = 371 / 1200;

interface AppLogoProps {
  width: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  width,
  style,
  accessibilityLabel = 'Spider Habit',
}) => {
  return (
    <Image
      source={spiderHabitLogo}
      style={[{ width, height: Math.round(width * LOGO_HEIGHT_RATIO) }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
};
