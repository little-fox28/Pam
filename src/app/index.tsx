import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutCalendar } from '@/components/WorkoutCalendar';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

const TAB_BAR_SPACE = 84;

export default function IndexScreen() {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
        <View>
          <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>
            {t('tabs.home')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t('workout.calendar.sectionTitle')}
          </Text>
        </View>

        <WorkoutCalendar />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
