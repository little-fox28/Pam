import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import type { TimerState } from '@/hooks/useIntervalTimer';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type AnimatedCircularProgressProps = {
  /** Current phase of the interval timer state machine. */
  state: TimerState;
  /** Remaining whole seconds in the current phase. */
  remainingTime: number;
  /** Total duration (in seconds) of the current active phase. */
  totalDuration: number;
  /** Current repetition index (used to detect phase resets across reps). */
  currentRep?: number;
  /** Whether the active phase is currently paused. */
  isPaused?: boolean;
  /** Outer diameter of the SVG ring in dp. Defaults to 240. */
  size?: number;
  /** Thickness of the progress ring stroke in dp. Defaults to 14. */
  strokeWidth?: number;
  /** Center content (e.g. countdown digits, phase badge, rep counter). */
  children?: ReactNode;
};

/**
 * 60fps UI-thread Circular Progress ring driven by `react-native-reanimated`
 * and `react-native-svg`.
 *
 * - Primary colors: Green (`colors.success`) for WORK / IDLE / COMPLETED,
 *   and Orange (`colors.warning`) for REST.
 */
export function AnimatedCircularProgress({
  state,
  remainingTime,
  totalDuration,
  currentRep = 1,
  isPaused = false,
  size = 240,
  strokeWidth = 14,
  children,
}: AnimatedCircularProgressProps) {
  const { colors } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(1);
  const prevPhaseKeyRef = useRef<string>(`${state}-${currentRep}`);

  useEffect(() => {
    const phaseKey = `${state}-${currentRep}`;
    const isNewPhase = prevPhaseKeyRef.current !== phaseKey;
    prevPhaseKeyRef.current = phaseKey;

    if (state === 'idle') {
      cancelAnimation(progress);
      progress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    if (state === 'completed') {
      cancelAnimation(progress);
      progress.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
      return;
    }

    if (isPaused) {
      cancelAnimation(progress);
      return;
    }

    const safeTotal = Math.max(1, totalDuration);
    const currentFraction = Math.min(1, Math.max(0, remainingTime / safeTotal));
    const nextSecondFraction = Math.min(1, Math.max(0, (remainingTime - 1) / safeTotal));

    if (isNewPhase && remainingTime === safeTotal) {
      progress.value = 1;
    } else if (Math.abs(progress.value - currentFraction) > 1.5 / safeTotal) {
      progress.value = currentFraction;
    }

    progress.value = withTiming(nextSecondFraction, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [state, remainingTime, totalDuration, currentRep, isPaused, progress]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Green (success) for WORK / IDLE / COMPLETED, Orange (warning) for REST
  const strokeColor = state === 'resting' ? colors.warning : colors.success;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          strokeOpacity={0.35}
          fill="none"
        />

        {/* Animated foreground progress circle (rotated -90deg so 12 o'clock is start) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          fill="none"
          originX={center}
          originY={center}
          rotation={-90}
        />
      </Svg>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.centerContent}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
