import type { ComponentType } from 'react';

import {
  BackIcon,
  ChestIcon,
  HeartIcon,
  LegsIcon,
  type WorkoutIconProps,
  WorkoutTypeIcon,
} from '@/components/WorkoutIcons';
import type { WorkoutType } from '@/stores/useWorkoutStore';
import type { ThemeColors } from '@/theme/tokens';

export { BackIcon, ChestIcon, HeartIcon, LegsIcon, WorkoutTypeIcon };

export type WorkoutColorToken =
  | 'workoutPull'
  | 'workoutPush'
  | 'workoutLegs'
  | 'workoutCardio';

export type WorkoutSoftColorToken =
  | 'workoutPullSoft'
  | 'workoutPushSoft'
  | 'workoutLegsSoft'
  | 'workoutCardioSoft';

export type WorkoutTypeMeta = {
  type: WorkoutType;
  labelKey: string;
  descKey: string;
  colorToken: WorkoutColorToken;
  softColorToken: WorkoutSoftColorToken;
  Icon: ComponentType<WorkoutIconProps>;
};

/**
 * Central mapping of each `WorkoutType` to its anatomical SVG icon,
 * localization keys, and platform-adaptive theme color tokens (`src/theme/tokens.ts`).
 */
export const WORKOUT_CONFIG: Record<WorkoutType, WorkoutTypeMeta> = {
  PULL: {
    type: 'PULL',
    labelKey: 'workout.types.pull',
    descKey: 'workout.types.pullDesc',
    colorToken: 'workoutPull',
    softColorToken: 'workoutPullSoft',
    Icon: BackIcon,
  },
  PUSH: {
    type: 'PUSH',
    labelKey: 'workout.types.push',
    descKey: 'workout.types.pushDesc',
    colorToken: 'workoutPush',
    softColorToken: 'workoutPushSoft',
    Icon: ChestIcon,
  },
  LEGS: {
    type: 'LEGS',
    labelKey: 'workout.types.legs',
    descKey: 'workout.types.legsDesc',
    colorToken: 'workoutLegs',
    softColorToken: 'workoutLegsSoft',
    Icon: LegsIcon,
  },
  CARDIO: {
    type: 'CARDIO',
    labelKey: 'workout.types.cardio',
    descKey: 'workout.types.cardioDesc',
    colorToken: 'workoutCardio',
    softColorToken: 'workoutCardioSoft',
    Icon: HeartIcon,
  },
};

export function getWorkoutColors(
  type: WorkoutType,
  colors: ThemeColors
): { bg: string; softBg: string; fg: string } {
  const meta = WORKOUT_CONFIG[type];
  return {
    bg: colors[meta.colorToken],
    softBg: colors[meta.softColorToken],
    fg: colors.onAccent,
  };
}
