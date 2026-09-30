import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { fonts } from '../theme/fonts';
import { colors } from '../theme/color';

export const CustomTextInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  // 1. Flatten incoming style
  const flattenedStyle = StyleSheet.flatten(style) || {};

  // 2. Extract font weight to map to the correct family
  const incomingWeight: any = flattenedStyle.fontWeight;
  let family: string = fonts.families.regular;

  if (incomingWeight === '500' || incomingWeight === 'medium') family = fonts.families.medium;
  else if (incomingWeight === '600' || incomingWeight === 'semibold') family = fonts.families.semibold;
  else if (incomingWeight === '700' || incomingWeight === 'bold') family = fonts.families.bold;
  else if (incomingWeight === '800' || incomingWeight === '900' || incomingWeight === 'extrabold') family = fonts.families.extrabold;

  // 3. Strip fontWeight to prevent Android font fallback issues
  const { fontWeight: _strippedWeight, ...restStyle } = flattenedStyle;

  return (
    <TextInput
      style={[{ fontFamily: family, color: colors.text.primary }, restStyle]}
      placeholderTextColor={props.placeholderTextColor || colors.text.muted}
      {...props}
    />
  );
};

export default CustomTextInput;
