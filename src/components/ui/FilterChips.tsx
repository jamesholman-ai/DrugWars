import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, ViewStyle } from 'react-native';
import { palette, radius, spacing, typography } from '../../theme/theme';

export interface FilterChipOption<T extends string> {
  id: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  style,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgCard,
  },
  chipActive: {
    borderColor: palette.neon,
    backgroundColor: palette.neonDim,
  },
  chipText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  chipTextActive: {
    color: palette.neon,
  },
});
