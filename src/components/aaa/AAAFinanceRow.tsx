import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedMoney } from '../premium/AnimatedMoney';
import { AppIcon, IconName } from '../../theme/icons';
import { accentMap, palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface AAAFinanceRowProps {
  cash: number;
  debt: number;
  netWorth: number;
  onCashPress?: () => void;
  onDebtPress?: () => void;
  onNetWorthPress?: () => void;
}

const FINANCE_ICON: Record<string, IconName> = {
  cash: 'cash',
  debt: 'debt',
  netWorth: 'netWorth',
};

function FinanceTile({
  label,
  tone,
  iconKey,
  value,
  onPress,
}: {
  label: string;
  tone: 'green' | 'red' | 'purple';
  iconKey: string;
  value: number;
  onPress?: () => void;
}) {
  const accent = accentMap[tone];
  const iconName = FINANCE_ICON[iconKey];

  return (
    <Pressable
      style={[styles.tile, { borderColor: accent.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <LinearGradient colors={[accent.glow, 'transparent']} style={styles.tileGlow} />
      {iconName ? (
        <View style={styles.tileIconWrap}>
          <AppIcon name={iconName} size={22} color={accent.text} />
        </View>
      ) : null}
      <Text style={[styles.tileLabel, { color: accent.text }]}>{label}</Text>
      <AnimatedMoney
        value={value}
        tone={tone}
        style={styles.tileValue}
      />
    </Pressable>
  );
}

function AAAFinanceRowInner({ cash, debt, netWorth, onCashPress, onDebtPress, onNetWorthPress }: AAAFinanceRowProps) {
  return (
    <View style={styles.row}>
      <FinanceTile label="CASH" tone="green" iconKey="cash" value={cash} onPress={onCashPress} />
      <FinanceTile label="DEBT" tone="red" iconKey="debt" value={debt} onPress={onDebtPress} />
      <FinanceTile label="NET WORTH" tone="purple" iconKey="netWorth" value={netWorth} onPress={onNetWorthPress} />
    </View>
  );
}

export const AAAFinanceRow = memo(AAAFinanceRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(16, 19, 26, 0.92)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    minHeight: 88,
    overflow: 'hidden',
    ...shadows.card,
  },
  tileGlow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.45,
  },
  tileIconWrap: {
    width: 28,
    height: 28,
    marginBottom: 4,
    justifyContent: 'center',
    opacity: 0.95,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
