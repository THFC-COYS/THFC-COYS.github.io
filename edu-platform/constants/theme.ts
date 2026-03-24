export const colors = {
  // Backgrounds
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceElevated: '#22223A',
  border: '#2E2E4A',

  // Brand
  primary: '#7C3AED',       // violet-600
  primaryLight: '#8B5CF6',  // violet-500
  primaryDim: '#4C1D95',    // violet-900 (bg tint)
  accent: '#06B6D4',        // cyan-500
  accentDim: '#164E63',     // cyan-900 (bg tint)
  coral: '#F97316',         // orange-500 (achievements)

  // Text
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textDim: '#475569',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Subjects
  math: '#8B5CF6',
  science: '#06B6D4',
  english: '#F97316',
  history: '#F59E0B',
  art: '#EC4899',
  coding: '#10B981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
};
