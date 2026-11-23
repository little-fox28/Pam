import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type ListRenderItemInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  getWorkoutColors,
  WORKOUT_CONFIG,
  WorkoutTypeIcon,
} from '@/config/workoutConfig';
import { useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import {
  formatLocalDateKey,
  getTodayDateKey,
  useWorkoutStore,
  type WorkoutSession,
  type WorkoutSessionMap,
} from '@/stores/useWorkoutStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export type CalendarScreenProps = {
  visible?: boolean;
  onClose: () => void;
};

type MonthDescriptor = {
  id: string;
  year: number;
  monthIndex: number; // 0..11
};

type DayMatrixCell =
  | { kind: 'empty'; key: string }
  | {
    kind: 'day';
    key: string;
    dayNumber: number;
    dateKey: string;
  };

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const PAST_MONTHS = 18;
const FUTURE_MONTHS = 6;
const TOTAL_MONTHS = PAST_MONTHS + FUTURE_MONTHS + 1;
const TODAY_MONTH_INDEX = PAST_MONTHS;

function buildMonthList(anchorYear: number, anchorMonth: number): MonthDescriptor[] {
  const list: MonthDescriptor[] = [];
  for (let offset = -PAST_MONTHS; offset <= FUTURE_MONTHS; offset++) {
    const d = new Date(anchorYear, anchorMonth + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    list.push({
      id: `${y}-${String(m + 1).padStart(2, '0')}`,
      year: y,
      monthIndex: m,
    });
  }
  return list;
}

function buildMonthMatrix(year: number, monthIndex: number): DayMatrixCell[][] {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Monday-first offset (0 = Mon .. 6 = Sun)
  const leadingEmpty = (firstDay.getDay() + 6) % 7;

  const cells: DayMatrixCell[] = [];
  for (let i = 0; i < leadingEmpty; i++) {
    cells.push({ kind: 'empty', key: `e-start-${year}-${monthIndex}-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatLocalDateKey(year, monthIndex, day);
    cells.push({
      kind: 'day',
      key: dateKey,
      dayNumber: day,
      dateKey,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'empty', key: `e-end-${year}-${monthIndex}-${cells.length}` });
  }

  const weeks: DayMatrixCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function parseDateKeyToLocal(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

function formatDuration(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  return `${mins}m`;
}

type DayCellProps = {
  dayNumber: number;
  dateKey: string;
  isToday: boolean;
  isSelected: boolean;
  session?: WorkoutSession;
  theme: Theme;
  onSelectDate: (dateKey: string) => void;
};

const DayCellItem = React.memo(function DayCellItem({
  dayNumber,
  dateKey,
  isToday,
  isSelected,
  session,
  theme,
  onSelectDate,
}: DayCellProps) {
  const { colors, typography } = theme;
  const workoutPalette = session ? getWorkoutColors(session.type, colors) : null;

  const circleBg = isSelected
    ? isToday
      ? colors.destructive
      : colors.textPrimary
    : isToday
      ? colors.destructive
      : 'transparent';

  const numberColor = isSelected
    ? isToday
      ? colors.onAccent
      : colors.background
    : isToday
      ? colors.onAccent
      : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={dateKey}
      onPress={() => onSelectDate(dateKey)}
      style={[
        styles.dayCellTouch,
        {
          borderTopColor: colors.border,
        },
      ]}>
      <View
        style={[
          styles.dayNumberCircle,
          {
            backgroundColor: circleBg,
          },
        ]}>
        <Text
          style={[
            typography.numeric,
            styles.dayNumberText,
            {
              color: numberColor,
              fontWeight: isToday || isSelected ? '700' : '500',
            },
          ]}>
          {dayNumber}
        </Text>
      </View>

      {/* Workout indicator badge below the day number */}
      <View style={styles.indicatorSlot}>
        {session && workoutPalette ? (
          <View
            style={[
              styles.workoutMiniPill,
              { backgroundColor: workoutPalette.bg },
            ]}>
            <WorkoutTypeIcon
              type={session.type}
              size={12}
              color={workoutPalette.fg}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

type MonthPageProps = {
  descriptor: MonthDescriptor;
  width: number;
  todayKey: string;
  selectedDate: string | null;
  sessions: WorkoutSessionMap;
  theme: Theme;
  onSelectDate: (dateKey: string) => void;
};

const MonthPage = React.memo(function MonthPage({
  descriptor,
  width,
  todayKey,
  selectedDate,
  sessions,
  theme,
  onSelectDate,
}: MonthPageProps) {
  const weeks = useMemo(
    () => buildMonthMatrix(descriptor.year, descriptor.monthIndex),
    [descriptor.monthIndex, descriptor.year]
  );

  return (
    <View style={[styles.monthPage, { width, paddingHorizontal: theme.spacing.md }]}>
      {weeks.map((week, wIdx) => (
        <View key={`w-${descriptor.id}-${wIdx}`} style={styles.weekRow}>
          {week.map((cell) => {
            if (cell.kind === 'empty') {
              return (
                <View
                  key={cell.key}
                  style={[
                    styles.dayCellTouch,
                    { borderTopColor: theme.colors.border },
                  ]}
                />
              );
            }
            return (
              <DayCellItem
                key={cell.key}
                dayNumber={cell.dayNumber}
                dateKey={cell.dateKey}
                isToday={cell.dateKey === todayKey}
                isSelected={cell.dateKey === selectedDate}
                session={sessions[cell.dateKey]}
                theme={theme}
                onSelectDate={onSelectDate}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

function CalendarScreenContent({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const { colors, spacing, radius, typography, scheme } = theme;
  const { t, locale } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sessions = useWorkoutStore((s) => s.sessions);

  const nowRef = useRef(new Date());
  const todayKey = getTodayDateKey(nowRef.current);

  const months = useMemo(
    () => buildMonthList(nowRef.current.getFullYear(), nowRef.current.getMonth()),
    []
  );

  // Closed by default (`null`) so the full-screen calendar is never covered until a day is tapped.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState<number>(TODAY_MONTH_INDEX);
  const listRef = useRef<FlatList<MonthDescriptor>>(null);

  const activeMonth = months[visibleMonthIndex] ?? months[TODAY_MONTH_INDEX];
  const canGoPrevMonth = visibleMonthIndex > 0;
  const canGoNextMonth = visibleMonthIndex < TOTAL_MONTHS - 1;

  const headerMonthTitle = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(activeMonth.year, activeMonth.monthIndex, 1));
    } catch {
      return `${activeMonth.monthIndex + 1}/${activeMonth.year}`;
    }
  }, [activeMonth.monthIndex, activeMonth.year, locale]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(parseDateKeyToLocal(selectedDate));
    } catch {
      return selectedDate;
    }
  }, [locale, selectedDate]);

  const handleSelectDate = useCallback((dateKey: string) => {
    haptic.light();
    setSelectedDate((current) => (current === dateKey ? null : dateKey));
  }, []);

  const handlePrevMonth = useCallback(() => {
    if (visibleMonthIndex <= 0) return;
    haptic.light();
    const targetIdx = visibleMonthIndex - 1;
    setVisibleMonthIndex(targetIdx);
    listRef.current?.scrollToIndex({ index: targetIdx, animated: true });
  }, [visibleMonthIndex]);

  const handleNextMonth = useCallback(() => {
    if (visibleMonthIndex >= TOTAL_MONTHS - 1) return;
    haptic.light();
    const targetIdx = visibleMonthIndex + 1;
    setVisibleMonthIndex(targetIdx);
    listRef.current?.scrollToIndex({ index: targetIdx, animated: true });
  }, [visibleMonthIndex]);

  const handleJumpToToday = useCallback(() => {
    haptic.medium();
    setVisibleMonthIndex(TODAY_MONTH_INDEX);
    listRef.current?.scrollToIndex({ index: TODAY_MONTH_INDEX, animated: true });
    setSelectedDate(todayKey);
  }, [todayKey]);

  const selectedSession: WorkoutSession | undefined = selectedDate
    ? sessions[selectedDate]
    : undefined;
  const selectedWorkoutMeta = selectedSession
    ? WORKOUT_CONFIG[selectedSession.type]
    : null;
  const selectedWorkoutPalette = selectedSession
    ? getWorkoutColors(selectedSession.type, colors)
    : null;

  const totalExercises = selectedSession?.exercises.length ?? 0;
  const totalSets = useMemo(
    () =>
      selectedSession
        ? selectedSession.exercises.reduce((acc, ex) => acc + ex.sets, 0)
        : 0,
    [selectedSession]
  );

  const renderMonthItem = useCallback(
    ({ item }: ListRenderItemInfo<MonthDescriptor>) => (
      <MonthPage
        descriptor={item}
        width={windowWidth}
        todayKey={todayKey}
        selectedDate={selectedDate}
        sessions={sessions}
        theme={theme}
        onSelectDate={handleSelectDate}
      />
    ),
    [handleSelectDate, selectedDate, sessions, theme, todayKey, windowWidth]
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        {/* FR2: Top Sticky OS Calendar Header with Back, Prev/Next Month Chevrons & Today */}
        <View
          style={[
            styles.topHeader,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderBottomColor: colors.border,
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.calendarScreen.back')}
            hitSlop={6}
            onPress={() => {
              haptic.light();
              onClose();
            }}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.pill,
                opacity: pressed ? 0.65 : 1,
              },
            ]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back' }}
              size={20}
              weight="semibold"
              tintColor={colors.textPrimary}
            />
          </Pressable>

          {/* Month Switcher: < Month Year > (icon-only to distinguish from the Back button) */}
          <View style={styles.monthSwitcherRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('workout.calendarScreen.prevMonth')}
              accessibilityState={{ disabled: !canGoPrevMonth }}
              disabled={!canGoPrevMonth}
              hitSlop={8}
              onPress={handlePrevMonth}
              style={({ pressed }) => [
                styles.monthNavBtn,
                {
                  opacity: !canGoPrevMonth ? 0.3 : pressed ? 0.55 : 1,
                },
              ]}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'chevron_left' }}
                size={20}
                weight="semibold"
                tintColor={colors.textSecondary}
              />
            </Pressable>

            <Text
              numberOfLines={1}
              style={[
                typography.headline,
                styles.headerTitle,
                { color: colors.textPrimary },
              ]}>
              {headerMonthTitle}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('workout.calendarScreen.nextMonth')}
              accessibilityState={{ disabled: !canGoNextMonth }}
              disabled={!canGoNextMonth}
              hitSlop={8}
              onPress={handleNextMonth}
              style={({ pressed }) => [
                styles.monthNavBtn,
                {
                  opacity: !canGoNextMonth ? 0.3 : pressed ? 0.55 : 1,
                },
              ]}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right' }}
                size={20}
                weight="semibold"
                tintColor={colors.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.calendarScreen.today')}
            hitSlop={6}
            onPress={handleJumpToToday}
            style={({ pressed }) => [
              styles.todayPillBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                opacity: pressed ? 0.65 : 1,
              },
            ]}>
            <Text style={[typography.caption, styles.todayBtnText, { color: colors.accent }]}>
              {t('workout.calendarScreen.today')}
            </Text>
          </Pressable>
        </View>

        {/* Fixed Weekday Strip (Mon - Sun) */}
        <View
          style={[
            styles.weekdayStrip,
            {
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}>
          {WEEKDAY_KEYS.map((dayKey) => (
            <View key={dayKey} style={styles.weekdayCell}>
              <Text
                style={[
                  typography.caption,
                  styles.weekdayText,
                  { color: colors.textSecondary },
                ]}>
                {t(`workout.calendar.weekdays.${dayKey}`)}
              </Text>
            </View>
          ))}
        </View>

        {/* Full-Height Paged Monthly Calendar Grid */}
        <View style={styles.flex}>
          <FlatList
            ref={listRef}
            data={months}
            keyExtractor={(item) => item.id}
            renderItem={renderMonthItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={TODAY_MONTH_INDEX}
            getItemLayout={(_, index) => ({
              length: windowWidth,
              offset: windowWidth * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const nextIdx = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
              if (nextIdx >= 0 && nextIdx < TOTAL_MONTHS && nextIdx !== visibleMonthIndex) {
                setVisibleMonthIndex(nextIdx);
              }
            }}
            windowSize={3}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
          />
        </View>
      </SafeAreaView>

      {/* FR3: Edge-to-Edge Day Details Bottom Sheet (Only visible when a day is selected) */}
      {selectedDate !== null ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Dimmed backdrop — tapping outside closes the details sheet */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.calendarScreen.back')}
            onPress={() => {
              haptic.light();
              setSelectedDate(null);
            }}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor:
                  scheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)',
              },
            ]}
          />

          {/* Edge-to-Edge Bottom Sheet Container (left: 0, right: 0, bottom: 0) */}
          <View
            style={[
              styles.bottomSheet,
              {
                maxHeight: Math.round(windowHeight * 0.62),
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius.lg * 1.5,
                borderTopRightRadius: radius.lg * 1.5,
                borderColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.sm,
                paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.lg,
                gap: spacing.md,
              },
            ]}>
            <Pressable
              onPress={() => setSelectedDate(null)}
              hitSlop={12}
              style={styles.grabberHitArea}>
              <View style={[styles.panelHandle, { backgroundColor: colors.border }]} />
            </Pressable>

            {/* Day Inspector Header: Formatted Full Date + Workout Badge */}
            <View style={styles.inspectorHeaderRow}>
              <View style={styles.flex}>
                <Text
                  style={[
                    typography.headline,
                    styles.fullDateText,
                    { color: colors.textPrimary },
                  ]}>
                  {formattedSelectedDate}
                </Text>
              </View>

              {selectedSession && selectedWorkoutMeta && selectedWorkoutPalette ? (
                <View
                  style={[
                    styles.workoutTypeBadge,
                    {
                      backgroundColor: selectedWorkoutPalette.bg,
                      borderRadius: radius.pill,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 5,
                      gap: 6,
                    },
                  ]}>
                  <WorkoutTypeIcon
                    type={selectedSession.type}
                    size={15}
                    color={selectedWorkoutPalette.fg}
                  />
                  <Text
                    style={[
                      typography.caption,
                      styles.workoutBadgeLabel,
                      { color: selectedWorkoutPalette.fg },
                    ]}>
                    {t(selectedWorkoutMeta.labelKey)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Summary Stats Row (when a workout is logged) */}
            {selectedSession && selectedWorkoutPalette ? (
              <View style={[styles.statsRow, { gap: spacing.sm }]}>
                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: colors.background,
                      borderRadius: radius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {t('workout.calendarScreen.stats.exercises')}
                  </Text>
                  <Text style={[typography.numeric, { color: colors.textPrimary }]}>
                    {totalExercises}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: colors.background,
                      borderRadius: radius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {t('workout.calendarScreen.stats.sets')}
                  </Text>
                  <Text style={[typography.numeric, { color: colors.textPrimary }]}>
                    {totalSets}
                  </Text>
                </View>

                {typeof selectedSession.durationSeconds === 'number' ? (
                  <View
                    style={[
                      styles.statPill,
                      {
                        backgroundColor: colors.background,
                        borderRadius: radius.md,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                      },
                    ]}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('workout.calendarScreen.stats.duration')}
                    </Text>
                    <Text style={[typography.numeric, { color: colors.textPrimary }]}>
                      {formatDuration(selectedSession.durationSeconds)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Exercise Breakdown List or Empty State */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}>
              {!selectedSession ? (
                <View
                  style={[
                    styles.emptyStateBox,
                    {
                      backgroundColor: colors.background,
                      borderRadius: radius.md,
                      padding: spacing.lg,
                    },
                  ]}>
                  <Text
                    style={[
                      typography.body,
                      styles.emptyStateText,
                      { color: colors.textSecondary },
                    ]}>
                    {t('workout.calendarScreen.restDay')}
                  </Text>
                </View>
              ) : selectedSession.exercises.length === 0 ? (
                <View
                  style={[
                    styles.emptyStateBox,
                    {
                      backgroundColor: selectedWorkoutPalette?.softBg ?? colors.background,
                      borderRadius: radius.md,
                      padding: spacing.lg,
                    },
                  ]}>
                  <Text
                    style={[
                      typography.body,
                      styles.emptyStateText,
                      { color: colors.textPrimary },
                    ]}>
                    {t('workout.calendarScreen.emptyExercises', {
                      type: selectedWorkoutMeta
                        ? t(selectedWorkoutMeta.labelKey)
                        : selectedSession.type,
                    })}
                  </Text>
                </View>
              ) : (
                selectedSession.exercises.map((exercise, idx) => {
                  const repsDetail =
                    exercise.repsPerSet && exercise.repsPerSet.length > 0
                      ? t('workout.calendarScreen.repsPerSetFormat', {
                        sets: exercise.sets,
                        breakdown: exercise.repsPerSet.join(' / '),
                      })
                      : t('workout.calendarScreen.setsRepsFormat', {
                        sets: exercise.sets,
                        reps: exercise.reps,
                      });

                  return (
                    <View
                      key={exercise.id || `${exercise.name}-${idx}`}
                      style={[
                        styles.exerciseRow,
                        {
                          backgroundColor: colors.background,
                          borderRadius: radius.md,
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm + 2,
                        },
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={[
                          typography.headline,
                          styles.flex,
                          { color: colors.textPrimary },
                        ]}>
                        {exercise.name}
                      </Text>
                      <Text style={[typography.numeric, { color: colors.textSecondary }]}>
                        {repsDetail}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function CalendarScreen({ visible = true, onClose }: CalendarScreenProps) {
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setMountKey((k) => k + 1);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <SafeAreaProvider>
        <CalendarScreenContent key={mountKey} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

export default CalendarScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayPillBtn: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayBtnText: {
    fontWeight: '700',
  },
  monthSwitcherRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  monthNavBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    textAlign: 'center',
    textTransform: 'capitalize',
    minWidth: 118,
  },
  weekdayStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontWeight: '600',
    fontSize: 12,
  },
  monthPage: {
    flex: 1,
    paddingTop: 8,
  },
  weekRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    maxHeight: 88,
  },
  dayCellTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 16,
    lineHeight: 20,
  },
  indicatorSlot: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  workoutMiniPill: {
    width: 22,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grabberHitArea: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  panelHandle: {
    width: 38,
    height: 5,
    borderRadius: 3,
  },
  inspectorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fullDateText: {
    textTransform: 'capitalize',
  },
  workoutTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutBadgeLabel: {
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPill: {
    flex: 1,
    gap: 2,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
