import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

export default function IndexScreen() {
  const { colors } = useTheme();

  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
