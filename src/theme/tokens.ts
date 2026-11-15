import { Platform, type TextStyle } from 'react-native';

export type ColorSchemeName = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  onAccent: string;
  warning: string;
  destructive: string;
  success: string;
};

/** Apple Human Interface Guidelines (iOS System Colors). */
const iosColors: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#6C6C70',
    border: '#C6C6C8',
    accent: '#007AFF',
    onAccent: '#FFFFFF',
    warning: '#FF9500',
    destructive: '#FF3B30',
    success: '#34C759',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    accent: '#0A84FF',
    onAccent: '#FFFFFF',
    warning: '#FF9F0A',
    destructive: '#FF453A',
    success: '#30D158',
  },
};

/** Google Material Design 3 (Material You) tonal surfaces & semantic colors. */
const androidColors: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: '#F8FAF9',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F4F2',
    textPrimary: '#191C1B',
    textSecondary: '#444746',
    border: '#C4C7C5',
    accent: '#1A73E8',
    onAccent: '#FFFFFF',
    warning: '#E37400',
    destructive: '#D93025',
    success: '#1E8E3E',
  },
  dark: {
    background: '#131314',
    surface: '#1E1F20',
    surfaceElevated: '#282A2C',
    textPrimary: '#E3E3E3',
    textSecondary: '#C4C7C5',
    border: '#444746',
    accent: '#4C8DF6',
    onAccent: '#FFFFFF',
    warning: '#F29900',
    destructive: '#E46962',
    success: '#34A853',
  },
};

export const colors: Record<ColorSchemeName, ThemeColors> = Platform.select({
  android: androidColors,
  default: iosColors,
});

/** 4pt grid. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

const fontFamily = Platform.select({ ios: 'System', default: undefined });

export const typography = {
  largeTitle: { fontFamily, fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title: { fontFamily, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  headline: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily, fontSize: 17, lineHeight: 22, fontWeight: '400' },
  caption: { fontFamily, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** Fixed-width digits so timers and weight/rep counters don't jitter. */
  numeric: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  numericLarge: {
    fontFamily,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type Theme = {
  scheme: ColorSchemeName;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function createTheme(scheme: ColorSchemeName): Theme {
  return { scheme, colors: colors[scheme], spacing, radius, typography };
}
