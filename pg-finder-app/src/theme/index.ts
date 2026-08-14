// src/theme/index.ts
// Design tokens. Centralizing these keeps the UI consistent and makes a
// future dark-mode or rebrand a one-file change.

export const colors = {
  primary: '#4F46E5', // indigo-600
  primaryDark: '#4338CA',
  bg: '#F9FAFB', // gray-50
  surface: '#FFFFFF',
  border: '#E5E7EB', // gray-200
  text: '#111827', // gray-900
  textMuted: '#6B7280', // gray-500
  success: '#16A34A', // green-600
  successBg: '#DCFCE7', // green-100
  warning: '#D97706',
  danger: '#DC2626',
  veg: '#16A34A',
  nonveg: '#DC2626',
  jain: '#CA8A04',
  star: '#F59E0B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
} as const;
