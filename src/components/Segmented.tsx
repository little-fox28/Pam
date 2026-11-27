import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

type Option<T extends string> = { value: T; label: string };

/** Minimal iOS-style segmented control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs },
      ]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              {
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
                backgroundColor: selected ? colors.accent : 'transparent',
              },
            ]}>
            <Text
              style={[
                typography.body,
                {
                  color: selected ? colors.onAccent : colors.textPrimary,
                  fontWeight: selected ? '600' : '400',
                  textAlign: 'center',
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  item: { flex: 1 },
});

