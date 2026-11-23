import type { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DumbbellAiIcon } from '@/components/DumbbellAiIcon';
import { useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useTheme } from '@/theme/ThemeProvider';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabMeta = {
  labelKey: string;
  iosIcon: {
    active: 'clock.fill' | 'dumbbell.fill' | 'house.fill' | 'gearshape.fill';
    inactive: 'clock' | 'dumbbell' | 'house' | 'gearshape';
  };
  androidIcon: 'timer' | 'exercise' | 'home' | 'settings';
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
  workout: {
    labelKey: 'tabs.workout',
    iosIcon: { active: 'dumbbell.fill', inactive: 'dumbbell' },
    androidIcon: 'exercise',
  },
  settings: {
    labelKey: 'tabs.settings',
    iosIcon: { active: 'gearshape.fill', inactive: 'gearshape' },
    androidIcon: 'settings',
  },
};

const TAB_WIDTH = 76;
const TAB_HEIGHT = 52;
const TAB_GAP = 4;
const PILL_PADDING = 4;
const STEP = TAB_WIDTH + TAB_GAP;

// Tuned spring for instant, lightweight 60fps UI-thread transition
const SPRING_CONFIG = {
  damping: 22,
  stiffness: 260,
  mass: 0.5,
};

/**
 * High-performance, lightweight floating pill bottom navigation bar.
 *
 * Performance Optimizations:
 * - 100% UI-thread animation: uses a single `indicatorX` shared value driven directly by `state.index`.
 * - Zero JS-thread per-frame math: eliminates PanResponder, touch coordinate calculations, scale sequencing, and redundant refs.
 * - Minimal re-renders: pure layout-driven geometry.
 */
export function FloatingTabBar({ state, emitter, navigateToTab, insets }: TabBarProps) {
  'use no memo';
  const { scheme, colors, radius } = useTheme();
  const { t } = useTranslation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const visibleRoutes = useMemo(
    () => state.routes.filter((r) => Boolean(TAB_META[r.name])),
    [state.routes]
  );

  // Single shared value for the indicator's X offset
  const indicatorX = useSharedValue(state.index * STEP);

  // Directly spring to target tab on the UI thread when state.index changes
  useEffect(() => {
    indicatorX.value = withSpring(state.index * STEP, SPRING_CONFIG);
  }, [state.index, indicatorX]);

  // Hide floating navbar while the software keyboard is open
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const bottomOffset = Platform.select({
    ios: insets.bottom > 0 ? Math.max(insets.bottom - 14, 14) : 10,
    android: insets.bottom > 0 ? insets.bottom + 4 : 12,
    default: Math.max(insets.bottom, 12),
  });

  const activeBg =
    scheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

  if (keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: scheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : colors.border,
            borderRadius: radius.pill,
          },
        ]}>
        {/* Sliding active background capsule (pure GPU/UI thread) */}
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

          const handlePress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              haptic.light();
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.tab,
                {
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              {route.name === 'workout' ? (
                <DumbbellAiIcon size={32} color={tintColor} />
              ) : (
                <SymbolView
                  name={{
                    ios: isFocused ? meta.iosIcon.active : meta.iosIcon.inactive,
                    android: meta.androidIcon,
                  }}
                  size={32}
                  weight={isFocused ? 'semibold' : 'regular'}
                  tintColor={tintColor}
                />
              )}
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
    borderWidth: StyleSheet.hairlineWidth,
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
});
