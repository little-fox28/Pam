import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importing these runs their synchronous MMKV reads (theme, locale) before first render.
import '@/config/env';
import '@/theme/mode-store';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { db } from '@/db/client';
import { i18n } from '@/i18n'; // also runs the synchronous locale read
import { setupNotifications } from '@/services/notifications';
import { startNetworkMonitor } from '@/stores/network';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <Boot />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function Boot() {
  const { colors, typography } = useTheme();
  const { success, error } = useMigrations(db, migrations);
  const ready = success || !!error;

  useEffect(() => {
    startNetworkMonitor();
    setupNotifications().catch(() => { });
  }, []);

  useEffect(() => {
    // Preferences are already loaded synchronously; release the splash once the DB is ready.
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}>
        <Text style={[typography.headline, { color: colors.destructive }]}>
          {i18n.t('boot.dbError')}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{error.message}</Text>
      </View>
    );
  }

  if (!success) return null;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="timer" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
