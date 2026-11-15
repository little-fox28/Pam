import type { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useTheme } from '@/theme/ThemeProvider';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabMeta = {
  labelKey: string;
  iosIcon: {
    active: 'clock.fill' | 'house.fill' | 'gearshape.fill';
    inactive: 'clock' | 'house' | 'gearshape'
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

/**
 * Threads-style floating rounded pill bottom navigation bar.
 * Displays each route's native symbol icon and localized label.
 */
export function FloatingTabBar({ state, emitter, navigateToTab, insets }: TabBarProps) {
  const { scheme, colors, radius, spacing } = useTheme();
  const { t } = useTranslation();

  const bottomOffset = Math.max(insets.bottom, spacing.md);
  const activeBg = scheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: radius.pill,
            padding: spacing.xs,
          },
        ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name];
          if (!meta) return null;

          const tintColor = isFocused ? colors.accent : colors.textSecondary;
          const label = t(meta.labelKey);

          const onPress = () => {
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
              onPress={onPress}
              style={({ pressed }) => [
                styles.tab,
                {
                  borderRadius: radius.pill,
                  backgroundColor: isFocused ? activeBg : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name={{
                  ios: isFocused ? meta.iosIcon.active : meta.iosIcon.inactive,
                  android: meta.androidIcon,
                }}
                size={35}
                tintColor={tintColor}
              />
              {/* <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: tintColor,
                    fontWeight: isFocused ? '500' : '400',
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
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  // label: {
  //   fontSize: 11,
  //   lineHeight: 14,
  // },
});
