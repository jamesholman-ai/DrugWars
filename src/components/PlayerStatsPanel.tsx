import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGame } from '../game/GameContext';
import { getInventoryUsed, getNetWorth } from '../game/economy';
import { getReputationTier } from '../game/progression';
import { getAreaLabel } from '../data/locations';
import { formatMoney } from '../utils/format';
import { colors, fonts, radius, spacing } from '../utils/theme';
import { StatBar } from './StatBar';

interface PlayerStatsPanelProps {
  compact?: boolean;
}

export function PlayerStatsPanel({ compact = false }: PlayerStatsPanelProps) {
  const { gameState } = useGame();

  if (!gameState) {
    return null;
  }

  const { player } = gameState;
  const locationName = getAreaLabel(player.currentCityId, player.currentAreaId);
  const inventoryUsed = getInventoryUsed(player);
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const repTier = getReputationTier(player.reputation);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.dayBlock}>
          <Text style={styles.dayLabel}>DAY</Text>
          <Text style={styles.dayValue}>{player.day}</Text>
        </View>
        <View style={styles.locBlock}>
          <Text style={styles.locLabel}>LOCATION</Text>
          <Text style={styles.locValue} numberOfLines={2}>
            {locationName}
          </Text>
        </View>
      </View>

      <View style={styles.moneyRow}>
        <View style={[styles.moneyCard, styles.cashCard]}>
          <Text style={styles.moneyLabel}>CASH</Text>
          <Text style={styles.cashValue}>{formatMoney(player.cash)}</Text>
        </View>
        <View style={[styles.moneyCard, styles.debtCard]}>
          <Text style={styles.moneyLabel}>DEBT</Text>
          <Text style={[styles.debtValue, player.debt <= 0 && styles.debtClear]}>
            {formatMoney(player.debt)}
          </Text>
        </View>
      </View>

      {!compact ? (
        <>
          <StatBar label="Health" value={player.health} color={colors.info} dangerBelow={25} />
          <StatBar label="Heat" value={player.heat} color={colors.warning} dangerAbove={75} />
          <StatBar label="Rep" value={player.reputation} color={colors.purple} />
          <View style={styles.tierRow}>
            <Text style={styles.tierLabel}>REP TIER</Text>
            <Text style={styles.tierValue}>{repTier.name}</Text>
          </View>
          <StatBar
            label="Stash"
            value={inventoryUsed}
            max={player.inventoryCapacity}
            color={colors.accentDim}
            showValue
          />
        </>
      ) : (
        <Text style={styles.compactTier}>
          Rep tier: {repTier.name} ({player.reputation})
        </Text>
      )}

      <View style={styles.netRow}>
        <Text style={styles.netLabel}>NET WORTH</Text>
        <Text style={styles.netValue}>{formatMoney(netWorth)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dayBlock: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  dayLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  dayValue: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 22,
    fontWeight: '700',
  },
  locBlock: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  locLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  locValue: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moneyCard: {
    flex: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
  },
  cashCard: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accentDim,
  },
  debtCard: {
    backgroundColor: colors.dangerGlow,
    borderColor: colors.dangerDim,
  },
  moneyLabel: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cashValue: {
    color: colors.cash,
    fontFamily: fonts.mono,
    fontSize: 17,
    fontWeight: '700',
  },
  debtValue: {
    color: colors.debt,
    fontFamily: fonts.mono,
    fontSize: 17,
    fontWeight: '700',
  },
  debtClear: {
    color: colors.textDim,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  netLabel: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  netValue: {
    color: colors.info,
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: -4,
  },
  tierLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  tierValue: {
    color: colors.purple,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  compactTier: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
});
