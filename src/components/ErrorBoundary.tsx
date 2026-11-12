import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { i18n, useLocaleStore } from '@/i18n';
import { sessionStorage, settingsStorage } from '@/lib/storage';
import { useUnitsStore } from '@/stores/units';
import { useThemeModeStore } from '@/theme/mode-store';
import { createTheme } from '@/theme/tokens';

type State = { error: Error | null };

/**
 * Root error boundary. Sits outside <ThemeProvider>, so the fallback reads the
 * system scheme and design tokens directly instead of using `useTheme()`.
 */
export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook for a crash reporter later (e.g. Sentry).
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  retry = () => this.setState({ error: null });

  reset = () => {
    settingsStorage.clearAll();
    sessionStorage.clearAll();
    useThemeModeStore.getState().setMode('system');
    useLocaleStore.getState().setLocale('en');
    useUnitsStore.getState().setWeightUnit('kg');
    useUnitsStore.getState().setHeightUnit('cm');
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return <Fallback message={this.state.error.message} onRetry={this.retry} onReset={this.reset} />;
  }
}

function Fallback({
  message,
  onRetry,
  onReset,
}: {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}) {
  const theme = createTheme(useColorScheme() === 'dark' ? 'dark' : 'light');
  const { colors, spacing, radius, typography } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.xl }]}>
      <Text style={[typography.title, { color: colors.textPrimary }]}>
        {i18n.t('error.title')}
      </Text>
      <Text style={[typography.body, styles.message, { color: colors.textSecondary }]}>
        {i18n.t('error.message')}
      </Text>
      {__DEV__ ? (
        <Text style={[typography.caption, styles.message, { color: colors.destructive }]}>
          {message}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={[styles.button, { backgroundColor: colors.accent, borderRadius: radius.md }]}>
        <Text style={[typography.headline, { color: '#FFFFFF' }]}>{i18n.t('error.retry')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onReset} style={styles.secondary}>
        <Text style={[typography.body, { color: colors.destructive }]}>{i18n.t('error.reset')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  message: { textAlign: 'center', marginTop: 8 },
  button: { marginTop: 24, paddingVertical: 14, paddingHorizontal: 32 },
  secondary: { marginTop: 16, padding: 8 },
});

