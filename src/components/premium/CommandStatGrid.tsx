import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimatedMoney } from './AnimatedMoney';
import { AppIcons } from '../../theme/icons';
import { palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface CommandStatGridProps {
  cash: number;
  heat: number;
  reputation: number;
  netWorth: number;
  reputationTitle: string;
  onCashPress?: () => void;
  onHeatPress?: () => void;
  onReputationPress?: () => void;
  onNetWorthPress?: () => void;
}

function CommandStatGridInner({
  cash,
  heat,
  reputation,
  netWorth,
  reputationTitle,
  onCashPress,
  onHeatPress,
  onReputationPress,
  onNetWorthPress,
}: CommandStatGridProps) {
  return (
    <View style={styles.grid}>
      <Pressable style={styles.stat} onPress={onCashPress} accessibilityLabel={`Cash ${cash}`}>
        <Text style={styles.label}>{AppIcons.money} CASH</Text>
        <AnimatedMoney value={cash} tone="green" style={styles.value} />
      </Pressable>
      <Pressable style={styles.stat} onPress={onHeatPress} accessibilityLabel={`Heat ${heat}`}>
        <Text style={styles.label}>{AppIcons.heat} HEAT</Text>
        <Text style={[styles.valueText, heat >= 70 && styles.danger]}>{heat}</Text>
      </Pressable>
      <Pressable style={styles.stat} onPress={onReputationPress} accessibilityLabel={`Reputation ${reputation}`}>
        <Text style={styles.label}>{AppIcons.reputation} REP</Text>
        <Text style={styles.valueText}>{reputation}</Text>
        <Text style={styles.sub} numberOfLines={1}>{reputationTitle}</Text>
      </Pressable>
      <Pressable style={styles.stat} onPress={onNetWorthPress} accessibilityLabel={`Net worth ${netWorth}`}>
        <Text style={styles.label}>{AppIcons.netWorth} NET</Text>
        <AnimatedMoney value={netWorth} tone="purple" style={styles.valueSmall} />
      </Pressable>
    </View>
  );
}

export const CommandStatGrid = memo(CommandStatGridInner);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  label: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.subtitle,
  },
  valueSmall: {
    fontSize: typography.subtitle,
  },
  valueText: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '900',
  },
  danger: {
    color: palette.danger,
  },
  sub: {
    color: palette.gold,
    fontSize: typography.tiny,
    fontWeight: '700',
    marginTop: 2,
  },
});
