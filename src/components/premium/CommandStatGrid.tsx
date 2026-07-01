import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimatedMoney } from './AnimatedMoney';
import { AppIcon, AppIcons, IconName } from '../../theme/icons';
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

function StatLabel({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.labelRow}>
      <AppIcon name={icon} size={12} color={palette.textMuted} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
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
        <StatLabel icon={AppIcons.money} label="CASH" />
        <AnimatedMoney value={cash} tone="green" style={styles.value} />
      </Pressable>
      <Pressable style={styles.stat} onPress={onHeatPress} accessibilityLabel={`Heat ${heat}`}>
        <StatLabel icon={AppIcons.heat} label="HEAT" />
        <Text style={[styles.valueText, heat >= 70 && styles.danger]}>{heat}</Text>
      </Pressable>
      <Pressable style={styles.stat} onPress={onReputationPress} accessibilityLabel={`Reputation ${reputation}`}>
        <StatLabel icon={AppIcons.reputation} label="REP" />
        <Text style={styles.valueText}>{reputation}</Text>
        <Text style={styles.sub} numberOfLines={1}>{reputationTitle}</Text>
      </Pressable>
      <Pressable style={styles.stat} onPress={onNetWorthPress} accessibilityLabel={`Net worth ${netWorth}`}>
        <StatLabel icon={AppIcons.netWorth} label="NET" />
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  label: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.6,
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
