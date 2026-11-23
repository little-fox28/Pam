import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DumbbellAiIcon } from '@/components/DumbbellAiIcon';
import {
  getWorkoutColors,
  WORKOUT_CONFIG,
  WorkoutTypeIcon,
} from '@/config/workoutConfig';
import { useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import {
  getTodayDateKey,
  useWorkoutStore,
  WORKOUT_TYPES,
  type WorkoutType,
} from '@/stores/useWorkoutStore';
import { useTheme } from '@/theme/ThemeProvider';

const TAB_BAR_SPACE = 84;

export default function WorkoutScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const logs = useWorkoutStore((s) => s.logs);
  const logTodayWorkout = useWorkoutStore((s) => s.logTodayWorkout);

  const todayKey = getTodayDateKey();
  const todayWorkout: WorkoutType | undefined = logs[todayKey];

  const handleSelectWorkout = (type: WorkoutType) => {
    haptic.success();
    logTodayWorkout(type);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
          gap: spacing.xl,
        }}>
        {/* Screen Header */}
        <View>
          <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>
            {t('workout.title')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t('workout.subtitle')}
          </Text>
        </View>

        {/* State A (Not logged today) vs State B (Logged today) */}
        <View>
          {!todayWorkout ? (
            <View style={{ gap: spacing.md }}>
              <Text
                style={[
                  typography.caption,
                  styles.sectionLabel,
                  { color: colors.textSecondary },
                ]}>
                {t('workout.selectPrompt').toUpperCase()}
              </Text>

              <View style={[styles.grid, { gap: spacing.md }]}>
                {WORKOUT_TYPES.map((type) => {
                  const meta = WORKOUT_CONFIG[type];
                  const palette = getWorkoutColors(type, colors);

                  return (
                    <Pressable
                      key={type}
                      accessibilityRole="button"
                      accessibilityLabel={t(meta.labelKey)}
                      onPress={() => handleSelectWorkout(type)}
                      style={({ pressed }) => [
                        styles.optionCard,
                        {
                          backgroundColor: colors.surface,
                          borderRadius: radius.lg,
                          padding: spacing.lg,
                          borderColor: colors.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}>
                      <View
                        style={[
                          styles.iconBadge,
                          {
                            backgroundColor: palette.bg,
                            borderRadius: radius.md,
                          },
                        ]}>
                        <WorkoutTypeIcon type={type} size={22} color={palette.fg} />
                      </View>

                      <View style={{ gap: 2 }}>
                        <Text style={[typography.headline, { color: colors.textPrimary }]}>
                          {t(meta.labelKey)}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={[typography.caption, { color: colors.textSecondary }]}>
                          {t(meta.descKey)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <TodayWorkoutContainer type={todayWorkout} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TodayWorkoutContainer({ type }: { type: WorkoutType }) {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const meta = WORKOUT_CONFIG[type];
  const palette = getWorkoutColors(type, colors);

  return (
    <View
      style={[
        styles.todayCard,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderColor: colors.border,
          gap: spacing.lg,
        },
      ]}>
      {/* Selected Workout Header Badge */}
      <View style={styles.todayHeader}>
        <View style={[styles.todayBadgeRow, { gap: spacing.md }]}>
          <View
            style={[
              styles.iconBadgeLarge,
              {
                backgroundColor: palette.bg,
                borderRadius: radius.md,
              },
            ]}>
            <WorkoutTypeIcon type={type} size={26} color={palette.fg} />
          </View>

          <View style={styles.flex}>
            <Text
              style={[
                typography.caption,
                styles.sectionLabel,
                { color: palette.bg },
              ]}>
              {t('workout.today.label').toUpperCase()}
            </Text>
            <Text style={[typography.title, { color: colors.textPrimary }]}>
              {t(meta.labelKey)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t(meta.descKey)}
            </Text>
          </View>
        </View>
      </View>

      {/* AI Exercise Routine Container (Ready for Exercise List integration) */}
      <View
        style={[
          styles.aiRoutineBox,
          {
            backgroundColor: palette.softBg,
            borderRadius: radius.md,
            padding: spacing.lg,
            gap: spacing.sm,
          },
        ]}>
        <View style={[styles.aiHeaderRow, { gap: spacing.sm }]}>
          <DumbbellAiIcon size={24} color={palette.bg} />
          <Text style={[typography.headline, { color: colors.textPrimary }]}>
            {t('workout.today.routineTitle')}
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('workout.today.routineEmpty')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    minHeight: 136,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeLarge: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiRoutineBox: {
    alignItems: 'flex-start',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
