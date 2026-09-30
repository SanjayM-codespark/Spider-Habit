/**
 * Theme Colors Configuration
 * Curated harmonious color palette designed for high contrast, premium readability,
 * and seamless light/dark mode support.
 */

export const colors = {
  // Brand Colors (Indigo & Teal Accent)
  primary: {
    main: '#2DADBE',     // Indigo
    light: '#2DADBE',
    dark: '#2DADBE',
    contrastText: '#FFFFFF',
    soft: 'rgba(79, 70, 229, 0.1)',
  },
  secondary: {
    main: '#0D9488',     // Teal
    light: '#2DD4BF',
    dark: '#115E59',
    contrastText: '#FFFFFF',
    soft: 'rgba(13, 148, 136, 0.1)',
  },

  // Semantic Status Colors
  status: {
    success: {
      main: '#10B981',   // Emerald
      light: '#A7F3D0',
      dark: '#065F46',
      contrastText: '#FFFFFF',
      soft: 'rgba(16, 185, 129, 0.1)',
    },
    warning: {
      main: '#F59E0B',   // Amber
      light: '#FDE68A',
      dark: '#92400E',
      contrastText: '#1E293B',
      soft: 'rgba(245, 158, 11, 0.1)',
    },
    error: {
      main: '#EF4444',     // Coral Red
      light: '#FCA5A5',
      dark: '#991B1B',
      contrastText: '#FFFFFF',
      soft: 'rgba(239, 68, 68, 0.1)',
    },
    info: {
      main: '#0EA5E9',     // Sky Blue
      light: '#BAE6FD',
      dark: '#075985',
      contrastText: '#FFFFFF',
      soft: 'rgba(14, 165, 233, 0.1)',
    },
  },

  // Neutral Colors (Grays & Backgrounds)
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Light Mode Scale
    gray50: '#F8FAFC',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray300: '#CBD5E1',
    gray400: '#94A3B8',
    gray500: '#64748B',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1E293B',
    gray900: '#0F172A',
  },

  // High-level Semantic Keys (for quick consistency)
  text: {
    primary: '#000',      // slate-900
    secondary: '#9A9A9A',    // slate-600
    muted: '#9A9A9A',        // slate-400
    disabled: '#CBD5E1',     // slate-300
    inverse: '#FFFFFF',
  },
  border: {
    light: '#E2E8F0',        // slate-200
    medium: '#CBD5E1',       // slate-300
    dark: '#94A3B8',         // slate-400
  },
  background: {
    default: '#F8FAFC',      // slate-50
    paper: '#FFFFFF',
    tint: '#F1F5F9',
    inputBg:"#F5F5F5"
  },
} as const;

export type ColorsType = typeof colors;
