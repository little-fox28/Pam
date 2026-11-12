import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/Segmented';
import { LOCALES, useLocaleStore, useTranslation } from '@/i18n';
import { haptic } from '@/services/haptics';
import { useNetworkStore } from '@/stores/network';
import { useUnitsStore } from '@/stores/units';
import { THEME_MODES, useThemeModeStore } from '@/theme/mode-store';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();

  const mode = useThemeModeStore((s) => s.mode);
  const setMode = useThemeModeStore((s) => s.setMode);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const weightUnit = useUnitsStore((s) => s.weightUnit);
  const setWeightUnit = useUnitsStore((s) => s.setWeightUnit);
  const isOnline = useNetworkStore((s) => s.isOnline);

  const label = (text: string) => (
    <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
      {text.toUpperCase()}
    </Text>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: 112,
          gap: spacing.xl,
        }}>
        <View>
          <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>
            {t('settings.title')}
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t('settings.subtitle')}
          </Text>
        </View>

        <View>
          {label(t('settings.theme'))}
          <Segmented
            value={mode}
            options={THEME_MODES.map((m) => ({ value: m, label: t(`theme.${m}`) }))}
            onChange={(m) => {
              haptic.light();
              setMode(m);
            }}
          />
        </View>

        <View>
          {label(t('settings.language'))}
          <Segmented
            value={locale}
            options={LOCALES.map((l) => ({ value: l, label: t(`language.${l}`) }))}
            onChange={(l) => {
              haptic.light();
              setLocale(l);
            }}
          />
        </View>

        <View>
          {label(t('settings.units'))}
          <Segmented
            value={weightUnit}
            options={(['kg', 'lbs'] as const).map((u) => ({ value: u, label: t(`units.${u}`) }))}
            onChange={(u) => {
              haptic.light();
              setWeightUnit(u);
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });

