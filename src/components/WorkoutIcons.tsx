import Svg, { Path } from 'react-native-svg';

import type { WorkoutType } from '@/stores/useWorkoutStore';

export type WorkoutIconProps = {
  size?: number;
  color: string;
};

/**
 * Push Day (`PUSH`) — Chest & Abs (Cơ ngực & Cơ bụng)
 * Athletic male torso silhouette with sculpted pectoral plates and 6-pack abs definition.
 */
export function ChestIcon({ size = 24, color }: WorkoutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Shoulders, neck collarbone & V-taper torso outline */}
      <Path
        d="M9.5 3.2L12 4.4L14.5 3.2C17.6 3.5 20.2 5.2 20.2 7.8C20.2 10.4 18.5 12.5 17.6 15.5L16.6 20.8H7.4L6.4 15.5C5.5 12.5 3.8 10.4 3.8 7.8C3.8 5.2 6.4 3.5 9.5 3.2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left & Right Pectoral Plates (Cơ ngực) */}
      <Path
        d="M4.6 9.8C5.6 11.4 7.6 12 10.4 11.8C11.4 11.7 12 11 12 9.8V4.6M19.4 9.8C18.4 11.4 16.4 12 13.6 11.8C12.6 11.7 12 11 12 9.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 6-Pack Abs Grid (Cơ bụng 6 múi) */}
      <Path
        d="M9.2 13.8H14.8V19.6H9.2V13.8ZM12 11.8V20.5M9.2 15.8H14.8M9.2 17.8H14.8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Pull Day (`PULL`) — Back (Lưng)
 * Minimalist V-taper upper back / lats & spine silhouette.
 */
export function BackIcon({ size = 24, color }: WorkoutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* V-taper lats & broad shoulders outline */}
      <Path
        d="M3.5 7.2C3.5 5.4 6.2 4 9.5 4L12 5L14.5 4C17.8 4 20.5 5.4 20.5 7.2C20.5 10.5 17.8 14.5 16.2 19.5H7.8C6.2 14.5 3.5 10.5 3.5 7.2Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Spine & rear scapular V-lines */}
      <Path
        d="M12 5V19.5M7 7.5L12 11.5L17 7.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Legs Day (`LEGS`) — Legs (Chân)
 * Minimalist lower-body quadriceps & legs silhouette.
 */
export function LegsIcon({ size = 24, color }: WorkoutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Waistband & left/right quadriceps + lower legs */}
      <Path
        d="M6.5 3.5H17.5L18.5 11.5L17.2 20.5H13.8L13.2 13L12 10.5L10.8 13L10.2 20.5H6.8L5.5 11.5L6.5 3.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Quad muscle sweep accents */}
      <Path
        d="M8.2 7.5C7.6 9.2 7.8 11 8.6 12.5M15.8 7.5C16.4 9.2 16.2 11 15.4 12.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Cardio (`CARDIO`) — Heart (Tim)
 * Clean anatomical/fitness heart with an ECG pulse line.
 */
export function HeartIcon({ size = 24, color }: WorkoutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5C12 20.5 3.5 15 3.5 8.8C3.5 5.8 5.8 3.5 8.6 3.5C10.3 3.5 11.4 4.3 12 5.4C12.6 4.3 13.7 3.5 15.4 3.5C18.2 3.5 20.5 5.8 20.5 8.8C20.5 15 12 20.5 12 20.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 11.5H9.2L10.7 8.8L13.1 14.2L14.6 11.5H17.5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Streak Flame Symbol (`StreakIcon`)
 * Filled athletic streak fire symbol (Duolingo / Apple Fitness style).
 */
export function StreakIcon({ size = 16, color }: WorkoutIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.6 2.2C12.9 5.4 15.8 7.5 17.5 10.2C19.1 12.7 19.5 15.8 17.8 18.4C16.4 20.5 14 21.8 11.5 21.8C7.6 21.8 4.8 18.9 4.8 15C4.8 12.1 6.4 9.5 8.5 7.7C8.3 9.4 9.1 10.9 10.4 11.6C9.8 8.4 10.6 4.8 12.6 2.2ZM11.8 14.2C10.5 15.1 9.8 16.5 10.2 17.9C10.5 19 11.6 19.6 12.7 19.4C14.1 19.1 14.9 17.7 14.5 16.2C14.2 15.1 13.1 14.6 11.8 14.2Z"
        fill={color}
      />
    </Svg>
  );
}

/**
 * Dispatcher component mapping a `WorkoutType` to its corresponding anatomical SVG icon.
 */
export function WorkoutTypeIcon({
  type,
  size = 20,
  color,
}: {
  type: WorkoutType;
  size?: number;
  color: string;
}) {
  switch (type) {
    case 'PUSH':
      return <ChestIcon size={size} color={color} />;
    case 'PULL':
      return <BackIcon size={size} color={color} />;
    case 'LEGS':
      return <LegsIcon size={size} color={color} />;
    case 'CARDIO':
      return <HeartIcon size={size} color={color} />;
  }
}
