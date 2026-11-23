import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CalendarScreen } from '@/screens/CalendarScreen';
import { getWorkoutColors, WorkoutTypeIcon } from '@/config/workoutConfig';
import { useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import {
  formatLocalDateKey,
  getTodayDateKey,
  useWorkoutStore,
  type WorkoutType,
} from '@/stores/useWorkoutStore';
import { useTheme } from '@/theme/ThemeProvider';

export type WorkoutCalendarProps = {
  /** Triggered when the user taps the calendar card container (e.g. to open full History). */
  onPressCalendar?: () => void;
  /** Compact mode for embedding inside widgets or smaller dashboard sections. */
  compact?: boolean;
};

type DayCell = {
  dayNumber: number;
  dateKey: string;
  isToday: boolean;
  loggedType?: WorkoutType;
};

const COLUMNS = 11;

/**
 * Compact 28–31 cell contribution-style workout tracker for the current month.
 * - Renders strictly `1..daysInMonth` sequentially with zero weekday headers or empty offset cells.
 * - Logged days fill with their workout color and render the anatomical SVG symbol centered inside.
 * - Read-only individual cells; tapping the card triggers `onPressCalendar`.
 */
export function WorkoutCalendar({ onPressCalendar, compact = false }: WorkoutCalendarProps) {
  const { colors, spacing, radius, typography, scheme } = useTheme();
  const { t, locale } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const logs = useWorkoutStore((s) => s.logs);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const cardPaddingX = compact ? spacing.sm : spacing.md;
  const cardPaddingY = compact ? spacing.xs : spacing.sm;
  const gridGap = compact ? 4 : 5;

  // Estimate initial inner grid width from windowWidth so the first frame has zero layout jump.
  const estimatedGridWidth = Math.max(
    180,
    windowWidth - spacing.lg * 2 - cardPaddingX * 2 - 2
  );
  const [measuredGridWidth, setMeasuredGridWidth] = useState<number>(estimatedGridWidth);

  const cellSize = Math.floor((measuredGridWidth - gridGap * (COLUMNS - 1)) / COLUMNS);
  const iconSize = compact ? 13 : 15;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayKey = getTodayDateKey(now);

  const monthTitle = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(currentYear, currentMonth, 1));
    } catch {
      return `${currentMonth + 1}/${currentYear}`;
    }
  }, [currentMonth, currentYear, locale]);

  const { days, monthlyCompletedCount } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const list: DayCell[] = [];
    let completedCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatLocalDateKey(currentYear, currentMonth, day);
      const loggedType = logs[dateKey];
      if (loggedType) completedCount += 1;

      list.push({
        dayNumber: day,
        dateKey,
        isToday: dateKey === todayKey,
        loggedType,
      });
    }

    return { days: list, monthlyCompletedCount: completedCount };
  }, [currentMonth, currentYear, logs, todayKey]);

  const unloggedCellBg =
    scheme === 'dark' ? colors.surfaceElevated : colors.background;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          paddingHorizontal: cardPaddingX,
          paddingVertical: cardPaddingY,
          borderColor: colors.border,
          gap: spacing.xs,
        },
      ]}>
      {/* Compact Header: Current Month/Year + Logged Sessions Badge */}
      <View style={styles.headerRow}>
        <Text style={[typography.headline, styles.monthText, { color: colors.textPrimary }]}>
          {monthTitle}
        </Text>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: unloggedCellBg,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.sm,
              paddingVertical: 3,
            },
          ]}>
          <Text style={[typography.caption, styles.countText, { color: colors.textSecondary }]}>
            {t('workout.calendar.sessionsCount', { count: monthlyCompletedCount })}
          </Text>
        </View>
      </View>

      {/* Flat Sequential 28–31 Cell Grid */}
      <View
        onLayout={(e) => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && Math.abs(w - measuredGridWidth) > 1) {
            setMeasuredGridWidth(w);
          }
        }}
        style={[styles.grid, { gap: gridGap }]}>
        {days.map((cell) => {
          const loggedColors = cell.loggedType
            ? getWorkoutColors(cell.loggedType, colors)
            : null;

          return (
            <View
              key={cell.dateKey}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 6,
                  backgroundColor: loggedColors ? loggedColors.bg : unloggedCellBg,
                  borderWidth: cell.isToday && !loggedColors ? 1.5 : 0,
                  borderColor:
                    cell.isToday && !loggedColors ? colors.accent : 'transparent',
                },
              ]}>
              {cell.loggedType && loggedColors ? (
                <WorkoutTypeIcon
                  type={cell.loggedType}
                  size={iconSize}
                  color={loggedColors.fg}
                />
              ) : (
                <Text
                  style={[
                    typography.numeric,
                    styles.dayNumber,
                    {
                      color: cell.isToday ? colors.accent : colors.textSecondary,
                      fontWeight: cell.isToday ? '700' : '500',
                    },
                  ]}>
                  {cell.dayNumber}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const handlePress = () => {
    haptic.light();
    if (onPressCalendar) {
      onPressCalendar();
    } else {
      setCalendarVisible(true);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('workout.calendar.accessibilityLabel', { month: monthTitle })}
        onPress={handlePress}
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
        {content}
      </Pressable>

      <CalendarScreen
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  monthText: {
    textTransform: 'capitalize',
  },
  countBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 11,
    lineHeight: 14,
  },
});
