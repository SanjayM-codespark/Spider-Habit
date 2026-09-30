import { Platform } from 'react-native';

export const fonts = {
  families: {
    regular: 'Montserrat-Regular',
    medium: 'Montserrat-Medium',
    semibold: 'Montserrat-SemiBold',
    bold: 'Montserrat-Bold',
    extrabold: 'Montserrat-ExtraBold',

    mono: Platform.select({
      ios: 'Courier New',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  
  sizes: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 40,
  },

  weights: {
    thin: '100' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    extrabold:'900' as const,

  },

  lineHeights: {
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 26,
    '2xl': 28,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
} as const;

export type FontsType = typeof fonts;