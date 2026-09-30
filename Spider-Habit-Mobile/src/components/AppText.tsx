/**
 * AppText — Drop-in replacement for React Native's <Text> that always
 * applies Montserrat-Regular as the base font family.
 *
 * Usage: replace `import { Text } from 'react-native'`
 * with   `import AppText from '../components/AppText'`
 * then   `<Text>` → `<AppText>`
 *
 * The passed `style` prop is always applied AFTER the base font style,
 * so callers can still override fontSize, color, fontWeight, etc.
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

const AppText: React.FC<TextProps> = ({ style, children, ...props }) => {
  return (
    <Text style={[base.font, style as any]} {...props}>
      {children}
    </Text>
  );
};

const base = StyleSheet.create({
  font: { fontFamily: 'Montserrat-Regular' },
});

export default AppText;
