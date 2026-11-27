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
  accentSoft: string;
  onAccent: string;
  warning: string;
  destructive: string;
  destructiveSoft: string;
  disabledBg: string;
  onDisabled: string;
  success: string;
  workoutPull: string;
  onWorkoutPull: string;
  workoutPullSoft: string;
  workoutPush: string;
  onWorkoutPush: string;
  workoutPushSoft: string;
  workoutLegs: string;
  onWorkoutLegs: string;
  workoutLegsSoft: string;
  workoutCardio: string;
  onWorkoutCardio: string;
  workoutCardioSoft: string;
};

/**
 * Unified PAM Volt-Neon Athletic Palette (harmonized around `#9EEB00` / `#A6FF00`).
 * - Surfaces carry a subtle cool-graphite athletic tint that makes Volt Lime pop.
 * - Status & Workout splits share the same high-energy neon saturation curve.
 */
export const colors: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: '#F3F5F0',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#0F140A',
    textSecondary: '#5F6659',
    border: '#E1E6DC',
    accent: '#9EEB00',
    accentSoft: 'rgba(158, 235, 0, 0.18)',
    onAccent: '#0A0F00',
    warning: '#FF9500',
    destructive: '#FF2E54',
    destructiveSoft: 'rgba(255, 46, 84, 0.14)',
    disabledBg: '#A3A99E',
    onDisabled: '#FFFFFF',
    success: '#84CC16',
    workoutPush: '#9EEB00',
    onWorkoutPush: '#0A0F00',
    workoutPushSoft: 'rgba(158, 235, 0, 0.18)',
    workoutPull: '#00D4E5',
    onWorkoutPull: '#001F24',
    workoutPullSoft: 'rgba(0, 212, 229, 0.15)',
    workoutLegs: '#8B5CF6',
    onWorkoutLegs: '#FFFFFF',
    workoutLegsSoft: 'rgba(139, 92, 246, 0.14)',
    workoutCardio: '#FF2E54',
    onWorkoutCardio: '#FFFFFF',
    workoutCardioSoft: 'rgba(255, 46, 84, 0.14)',
  },
  dark: {
    background: '#000000',
    surface: '#161815',
    surfaceElevated: '#232621',
    textPrimary: '#F8FAF5',
    textSecondary: '#90968B',
    border: '#32362F',
    accent: '#A6FF00',
    accentSoft: 'rgba(166, 255, 0, 0.16)',
    onAccent: '#0A0F00',
    warning: '#FFB800',
    destructive: '#FF3358',
    destructiveSoft: 'rgba(255, 51, 88, 0.18)',
    disabledBg: '#3A3E37',
    onDisabled: '#FFFFFF',
    success: '#A6FF00',
    workoutPush: '#A6FF00',
    onWorkoutPush: '#0A0F00',
    workoutPushSoft: 'rgba(166, 255, 0, 0.16)',
    workoutPull: '#00F0FF',
    onWorkoutPull: '#002226',
    workoutPullSoft: 'rgba(0, 240, 255, 0.16)',
    workoutLegs: '#A855F7',
    onWorkoutLegs: '#FFFFFF',
    workoutLegsSoft: 'rgba(168, 85, 247, 0.18)',
    workoutCardio: '#FF3358',
    onWorkoutCardio: '#FFFFFF',
    workoutCardioSoft: 'rgba(255, 51, 88, 0.18)',
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
