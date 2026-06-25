import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { clamp } from '../../utils/random';
import { palette, fonts, radius, spacing } from '../../theme/theme';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  dangerAbove?: number;
  dangerBelow?: number;
  showValue?: boolean;
  compact?: boolean;
}

export function StatBar({
  label,
  value,
  max = 100,
  color = palette.neon,
  dangerAbove,
  dangerBelow,
  showValue = true,
  compact = false,
}: StatBarProps) {
  const pct = clamp(value / max, 0, 1);
  const isDanger =
    (dangerAbove !== undefined && value >= dangerAbove) ||
    (dangerBelow !== undefined && value <= dangerBelow);
  const barColor = isDanger ? palette.danger : color;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showValue ? (
          <Text style={[styles.value, isDanger && styles.valueDanger]}>
            {max === 100 ? `${value}%` : `${value}/${max}`}
          </Text>
        ) : null}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: barColor }]}>
          <View style={styles.fillSheen} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  compact: {
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  value: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
  },
  valueDanger: {
    color: palette.danger,
  },
  track: {
    height: 10,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    minWidth: 4,
  },
  fillSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: radius.pill,
    borderTopRightRadius: radius.pill,
  },
});
