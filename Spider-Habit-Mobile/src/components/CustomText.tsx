import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { fonts } from '../theme/fonts';
import { colors } from '../theme/color';

/**
 * Text Typography Variant Keys
 */
export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLarge'
  | 'body'
  | 'caption'
  | 'button';

/**
 * CustomText Component Props
 */
export interface CustomTextProps extends TextProps {
  /**
   * Font scale variant style. Defaults to 'body'.
   */
  variant?: TextVariant;
  /**
   * Text color override. Accepts a hex string or a path override.
   */
  color?: string;
  /**
   * Font weight override.
   */
  weight?: keyof typeof fonts.weights;
  /**
   * Text alignment option.
   */
  align?: 'left' | 'center' | 'right' | 'justify';
  /**
   * Children components
   */
  children?: React.ReactNode;
}

/**
 * CustomText Component
 * Enforces unified spacing, font weights, and color scales across all platforms.
 */
export const CustomText: React.FC<CustomTextProps> = ({
  variant = 'body',
  color,
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  // Determine standard colors
  const resolvedColor = color || colors.text.primary;

  // Determine standard font weight from variant
  let resolvedWeight: keyof typeof fonts.weights = 'regular';
  if (weight) {
    resolvedWeight = weight;
  } else if (variant === 'h1' || variant === 'h2' || variant === 'h3') {
    resolvedWeight = 'bold';
  } else if (variant === 'button') {
    resolvedWeight = 'semibold';
  }

  // 1. Flatten the incoming style to inspect it
  const flattenedStyle = StyleSheet.flatten(style as TextStyle) || {};
  
  // 2. Determine final weight (prop style overrides variant weight)
  const incomingWeight = flattenedStyle.fontWeight;
  const finalWeight = incomingWeight || fonts.weights[resolvedWeight];

  // 3. Map the exact font weight to the correct font family
  let family: string = fonts.families.regular;
  if (finalWeight === '500' || finalWeight === 'medium') family = fonts.families.medium;
  else if (finalWeight === '600' || finalWeight === 'semibold') family = fonts.families.semibold;
  else if (finalWeight === '700' || finalWeight === 'bold') family = fonts.families.bold;
  else if (finalWeight === '800' || finalWeight === '900' || (finalWeight as any) === 'extrabold') family = fonts.families.extrabold;

  // 4. STRIP fontWeight from the style object!
  // Android will drop custom fonts and revert to system Roboto if it sees 
  // fontFamily: 'Montserrat-Bold' AND fontWeight: 'bold' at the same time.
  const { fontWeight: _strippedWeight, ...restStyle } = flattenedStyle;

  // 5. Build combined text style
  const textStyles: TextStyle[] = [
    styles.base,
    styles[variant],
    {
      color: resolvedColor,
      textAlign: align,
      fontFamily: family,
    },
    restStyle,
  ];

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: fonts.families.regular,
  },
  h1: {
    fontSize: fonts.sizes['4xl'],
    lineHeight: fonts.lineHeights['4xl'],
  },
  h2: {
    fontSize: fonts.sizes['3xl'],
    lineHeight: fonts.lineHeights['3xl'],
  },
  h3: {
    fontSize: fonts.sizes['2xl'],
    lineHeight: fonts.lineHeights['2xl'],
  },
  bodyLarge: {
    fontSize: fonts.sizes.lg,
    lineHeight: fonts.lineHeights.lg,
  },
  body: {
    fontSize: fonts.sizes.md,
    lineHeight: fonts.lineHeights.md,
  },
  caption: {
    fontSize: fonts.sizes.xs,
    lineHeight: fonts.lineHeights.xs,
  },
  button: {
    fontSize: fonts.sizes.lg,
    lineHeight: fonts.lineHeights.lg,
  },
});

export default CustomText;
