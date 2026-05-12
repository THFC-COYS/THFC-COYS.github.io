export const Colors = {
  background: '#080D08',
  surface: '#0F1A0F',
  card: '#131F13',
  cardBorder: '#1C2C1C',
  overlay: 'rgba(8,13,8,0.85)',

  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  primaryFaint: 'rgba(34,197,94,0.12)',

  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentFaint: 'rgba(245,158,11,0.12)',

  text: '#F0FDF4',
  textMuted: '#86EFAC',
  textDim: '#4B7A5A',
  textDisabled: '#2D4A2D',

  error: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',

  // Macro chart colours
  protein: '#60A5FA',
  carbs: '#FBBF24',
  fat: '#F87171',
  fiber: '#34D399',

  // Fit score spectrum
  fitGreat: '#22C55E',
  fitGood: '#86EFAC',
  fitMod: '#F59E0B',
  fitPoor: '#EF4444',
  fitBlocked: '#4B5563',

  tabBar: '#0A140A',
  tabBarBorder: '#1C2C1C',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
} as const;
