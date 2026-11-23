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
    workoutPull: '#007AFF',
    workoutPullSoft: 'rgba(0, 122, 255, 0.12)',
    workoutPush: '#34C759',
    workoutPushSoft: 'rgba(52, 199, 89, 0.12)',
    workoutLegs: '#5856D6',
    workoutLegsSoft: 'rgba(88, 86, 214, 0.12)',
    workoutCardio: '#FF9500',
    workoutCardioSoft: 'rgba(255, 149, 0, 0.14)',
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
    workoutPull: '#0A84FF',
    workoutPullSoft: 'rgba(10, 132, 255, 0.18)',
    workoutPush: '#30D158',
    workoutPushSoft: 'rgba(48, 209, 88, 0.18)',
    workoutLegs: '#5E5CE6',
    workoutLegsSoft: 'rgba(94, 92, 230, 0.18)',
    workoutCardio: '#FF9F0A',
    workoutCardioSoft: 'rgba(255, 159, 10, 0.18)',
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
    workoutPull: '#1A73E8',
    workoutPullSoft: 'rgba(26, 115, 232, 0.12)',
    workoutPush: '#1E8E3E',
    workoutPushSoft: 'rgba(30, 142, 62, 0.12)',
    workoutLegs: '#6750A4',
    workoutLegsSoft: 'rgba(103, 80, 164, 0.12)',
    workoutCardio: '#E37400',
    workoutCardioSoft: 'rgba(227, 116, 0, 0.14)',
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
    workoutPull: '#4C8DF6',
    workoutPullSoft: 'rgba(76, 141, 246, 0.18)',
    workoutPush: '#34A853',
    workoutPushSoft: 'rgba(52, 168, 83, 0.18)',
    workoutLegs: '#9A82DB',
    workoutLegsSoft: 'rgba(154, 130, 219, 0.18)',
    workoutCardio: '#F29900',
    workoutCardioSoft: 'rgba(242, 153, 0, 0.18)',
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
