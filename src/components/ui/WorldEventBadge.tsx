import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radius, spacing } from '../../theme/theme';

type Severity = 'low' | 'medium' | 'high';

const severityStyle: Record<Severity, { bg: string; text: string; label: string }> = {
  low: { bg: palette.amberGlow, text: palette.amber, label: 'LOW' },
  medium: { bg: palette.purpleGlow, text: palette.purpleBright, label: 'MED' },
  high: { bg: palette.dangerGlow, text: palette.danger, label: 'HIGH' },
};

interface WorldEventBadgeProps {
  severity: Severity;
  daysLeft?: number;
}

export function WorldEventBadge({ severity, daysLeft }: WorldEventBadgeProps) {
  const s = severityStyle[severity];

  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.text }]}>
      <Text style={[styles.text, { color: s.text }]}>{s.label}</Text>
      {daysLeft != null ? (
        <Text style={[styles.days, { color: s.text }]}>{daysLeft}d</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  days: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '700',
    opacity: 0.85,
  },
});
