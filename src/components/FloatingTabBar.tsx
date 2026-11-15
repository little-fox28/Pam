import type { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type ComponentProps, useCallback, useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useTheme } from '@/theme/ThemeProvider';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabMeta = {
  labelKey: string;
  iosIcon: {
    active: 'clock.fill' | 'house.fill' | 'gearshape.fill';
    inactive: 'clock' | 'house' | 'gearshape';
  };
  androidIcon: 'timer' | 'home' | 'settings';
};

const TAB_META: Record<string, TabMeta> = {
  timer: {
    labelKey: 'tabs.timer',
    iosIcon: { active: 'clock.fill', inactive: 'clock' },
    androidIcon: 'timer',
  },
  index: {
    labelKey: 'tabs.home',
    iosIcon: { active: 'house.fill', inactive: 'house' },
    androidIcon: 'home',
  },
  settings: {
    labelKey: 'tabs.settings',
    iosIcon: { active: 'gearshape.fill', inactive: 'gearshape' },
    androidIcon: 'settings',
  },
};

const TAB_WIDTH = 92;
const TAB_HEIGHT = 52;
const TAB_GAP = 4;
const PILL_PADDING = 4;
const STEP = TAB_WIDTH + TAB_GAP;

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 200,
  mass: 0.65,
};

/**
 * Native-proportioned floating pill bottom navigation bar.
 * Features a fluid sliding background capsule (`Animated.View`) that glides
 * between tabs both when tapping and when dragging/scrubbing horizontally.
 */
export function FloatingTabBar({ state, emitter, navigateToTab, insets }: TabBarProps) {
  'use no memo';
  const { scheme, colors, radius } = useTheme();
  const { t } = useTranslation();

  const visibleRoutes = useMemo(
    () => state.routes.filter((r) => Boolean(TAB_META[r.name])),
    [state.routes]
  );

  const tabCount = visibleRoutes.length;
  const maxOffset = Math.max(0, (tabCount - 1) * STEP);

  const indicatorX = useSharedValue(state.index * STEP);
  const indicatorScaleX = useSharedValue(1);
  const indicatorScaleY = useSharedValue(1);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const lastHoveredIndexRef = useRef(state.index);

  // Keep latest values in refs for PanResponder callbacks.
  const stateRef = useRef(state);
  stateRef.current = state;
  const visibleRoutesRef = useRef(visibleRoutes);
  visibleRoutesRef.current = visibleRoutes;

  const animateToIndex = useCallback(
    (targetIndex: number) => {
      indicatorX.value = withSpring(targetIndex * STEP, SPRING_CONFIG);
      // Subtle liquid stretch as the background pill slides between tabs.
      indicatorScaleX.value = withSequence(
        withTiming(1.08, { duration: 110 }),
        withSpring(1, SPRING_CONFIG)
      );
      indicatorScaleY.value = withSequence(
        withTiming(0.94, { duration: 110 }),
        withSpring(1, SPRING_CONFIG)
      );
    },
    [indicatorScaleX, indicatorScaleY, indicatorX]
  );

  const selectTabByIndex = useCallback(
    (targetIndex: number, shouldSpring = true) => {
      const routes = visibleRoutesRef.current;
      const route = routes[targetIndex];
      if (!route) return;

      if (shouldSpring) {
        animateToIndex(targetIndex);
      }

      const isCurrentlyFocused = stateRef.current.index === targetIndex;
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isCurrentlyFocused && !event.defaultPrevented) {
        haptic.light();
        navigateToTab(route.key);
      }
    },
    [animateToIndex, emitter, navigateToTab]
  );

  // Sync sliding indicator when active tab changes outside of a drag gesture.
  useEffect(() => {
    lastHoveredIndexRef.current = state.index;
    if (!isDraggingRef.current) {
      animateToIndex(state.index);
    }
  }, [state.index, animateToIndex]);

  // Capture horizontal slide gestures even when the touch starts on a child <Pressable>.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          dragStartXRef.current = stateRef.current.index * STEP;
          lastHoveredIndexRef.current = stateRef.current.index;
          indicatorScaleX.value = withTiming(1.05, { duration: 100 });
          indicatorScaleY.value = withTiming(0.95, { duration: 100 });
        },
        onPanResponderMove: (_, gestureState) => {
          const clampedX = Math.max(
            0,
            Math.min(maxOffset, dragStartXRef.current + gestureState.dx)
          );
          indicatorX.value = clampedX;

          const hoveredIndex = Math.max(
            0,
            Math.min(
              visibleRoutesRef.current.length - 1,
              Math.round(clampedX / STEP)
            )
          );

          if (hoveredIndex !== lastHoveredIndexRef.current) {
            lastHoveredIndexRef.current = hoveredIndex;
            selectTabByIndex(hoveredIndex, false);
          }
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
          const targetIndex = lastHoveredIndexRef.current;
          indicatorX.value = withSpring(targetIndex * STEP, SPRING_CONFIG);
          indicatorScaleX.value = withSpring(1, SPRING_CONFIG);
          indicatorScaleY.value = withSpring(1, SPRING_CONFIG);
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          const targetIndex = lastHoveredIndexRef.current;
          indicatorX.value = withSpring(targetIndex * STEP, SPRING_CONFIG);
          indicatorScaleX.value = withSpring(1, SPRING_CONFIG);
          indicatorScaleY.value = withSpring(1, SPRING_CONFIG);
        },
      }),
    [indicatorScaleX, indicatorScaleY, indicatorX, maxOffset, selectTabByIndex]
  );

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorX.value },
      { scaleX: indicatorScaleX.value },
      { scaleY: indicatorScaleY.value },
    ],
  }));

  const bottomOffset = Platform.select({
    ios: insets.bottom > 0 ? insets.bottom - 4 : 16,
    default: Math.max(insets.bottom + 8, 16),
  });

  const activeBg =
    scheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View
        {...panResponder.panHandlers}
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: radius.pill,
          },
        ]}>
        {/* Sliding active background capsule */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            {
              backgroundColor: activeBg,
              borderRadius: radius.pill,
            },
            animatedIndicatorStyle,
          ]}
        />

        {visibleRoutes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const tintColor = isFocused ? colors.accent : colors.textSecondary;
          const label = t(meta.labelKey);

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={() => selectTabByIndex(index, true)}
              style={({ pressed }) => [
                styles.tab,
                {
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <SymbolView
                name={{
                  ios: isFocused ? meta.iosIcon.active : meta.iosIcon.inactive,
                  android: meta.androidIcon,
                }}
                size={30}
                weight={isFocused ? 'semibold' : 'regular'}
                tintColor={tintColor}
              />
              {/* <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: tintColor,
                    fontWeight: isFocused ? '600' : '500',
                  },
                ]}>
                {label}
              </Text> */}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: PILL_PADDING,
    gap: TAB_GAP,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activeIndicator: {
    position: 'absolute',
    top: PILL_PADDING,
    left: PILL_PADDING,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 5,
    gap: 2,
  },
  // label: {
  //   fontSize: 10.5,
  //   lineHeight: 13,
  //   letterSpacing: 0.1,
  // },
});
