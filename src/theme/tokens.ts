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
  workoutPull: string;
  workoutPullSoft: string;
  workoutPush: string;
  workoutPushSoft: string;
  workoutLegs: string;
  workoutLegsSoft: string;
  workoutCardio: string;
  workoutCardioSoft: string;
};

/**
 * Unified PAM Brand & Apple Health Activity Palette (shared across iOS & Android).
 * - Brand Accent: Indigo Blurple (`#4F46E5` Light / `#6366F1` Dark)
 * - Activity Splits: Exercise Neon Green, Stand Neon Cyan, Sleep Neon Violet, Move Neon Crimson
 */
export const colors: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#6C6C70',
    border: '#E5E5EA',
    accent: '#7C3AED',
    onAccent: '#FFFFFF',
    warning: '#FF6D00',
    destructive: '#FA114F',
    success: '#00C853',
    workoutPull: '#00B8D4',
    workoutPullSoft: 'rgba(0, 184, 212, 0.14)',
    workoutPush: '#00C853',
    workoutPushSoft: 'rgba(0, 200, 83, 0.14)',
    workoutLegs: '#5856D6',
    workoutLegsSoft: 'rgba(88, 86, 214, 0.14)',
    workoutCardio: '#FA114F',
    workoutCardioSoft: 'rgba(250, 17, 79, 0.14)',
  },
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    accent: '#A855F7',
    onAccent: '#FFFFFF',
    warning: '#FF9F0A',
    destructive: '#FA114F',
    success: '#32D74B',
    workoutPull: '#00D5E4',
    workoutPullSoft: 'rgba(0, 213, 228, 0.18)',
    workoutPush: '#32D74B',
    workoutPushSoft: 'rgba(50, 215, 75, 0.18)',
    workoutLegs: '#5E5CE6',
    workoutLegsSoft: 'rgba(94, 92, 230, 0.18)',
    workoutCardio: '#FA114F',
    workoutCardioSoft: 'rgba(250, 17, 79, 0.18)',
  },
};

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
