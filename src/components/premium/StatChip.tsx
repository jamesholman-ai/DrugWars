import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AccentTone, accentMap, palette, radius, spacing, typography } from '../../theme/theme';

interface StatChipProps {
  label: string;
  value: string;
  tone?: AccentTone;
  icon?: string;
  style?: ViewStyle;
}

export function StatChip({ label, value, tone = 'neutral', icon, style }: StatChipProps) {
  const accent = accentMap[tone];
  return (
    <View
      style={[
        styles.chip,
        { borderColor: accent.border, backgroundColor: accent.bg },
        style,
      ]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  label: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: typography.body,
    fontWeight: '800',
  },
});
