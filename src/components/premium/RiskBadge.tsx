import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { RiskLevel, palette, radius, riskAccentMap, spacing, typography } from '../../theme/theme';

interface RiskBadgeProps {
  level: RiskLevel | 'LOW' | 'MED' | 'HIGH' | number;
  label?: string;
  style?: ViewStyle;
}

function normalizeLevel(level: RiskBadgeProps['level']): RiskLevel {
  if (typeof level === 'number') {
    if (level >= 4) return 'high';
    if (level >= 3) return 'medium';
    return 'low';
  }
  const upper = String(level).toUpperCase();
  if (upper === 'HIGH') return 'high';
  if (upper === 'MED' || upper === 'MEDIUM') return 'medium';
  return 'low';
}

export function RiskBadge({ level, label, style }: RiskBadgeProps) {
  const risk = normalizeLevel(level);
  const accent = riskAccentMap[risk];
  const text = label ?? (risk === 'high' ? 'High Risk' : risk === 'medium' ? 'Medium Risk' : 'Low Risk');

  return (
    <View style={[styles.badge, { borderColor: accent.border, backgroundColor: accent.bg }, style]}>
      <Text style={[styles.text, { color: accent.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
