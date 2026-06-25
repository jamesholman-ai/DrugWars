import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import {
  formatNextRankRequirements,
  getCurrentRank,
  getNextRank,
  getReputationTier,
} from '../game/progression';
import { CITY_MAP } from '../data/locations';
import { STASH_HOUSE_MAP } from '../data/progression';
import { formatMoney } from '../utils/format';
import { colors, fonts, spacing } from '../utils/theme';

export function ProgressPanel() {
  const { gameState } = useGame();
  if (!gameState) return null;

  const { player, progression } = gameState;
  const rank = getCurrentRank(gameState);
  const nextRank = getNextRank(progression.rankId);
  const repTier = getReputationTier(player.reputation);
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const reqLines = formatNextRankRequirements(gameState);

  return (
    <Card title="YOUR STATUS" variant="accent">
      <View style={styles.headerRow}>
        <View style={styles.rankBlock}>
          <Text style={styles.rankLabel}>RANK</Text>
          <Text style={styles.rankName}>{rank.name}</Text>
        </View>
        <Badge label={repTier.name.toUpperCase()} tone="fair" />
      </View>

      <Text style={styles.desc}>{rank.description}</Text>

      <View style={styles.statsGrid}>
        <StatChip label="Net worth" value={formatMoney(netWorth)} />
        <StatChip label="Lifetime profit" value={formatMoney(progression.lifetimeProfit)} />
        <StatChip label="Days" value={String(player.day)} />
        <StatChip
          label="Stash cap"
          value={`${player.inventoryCapacity}`}
        />
      </View>

      {nextRank ? (
        <View style={styles.nextBlock}>
          <Text style={styles.nextTitle}>NEXT — {nextRank.name}</Text>
          {reqLines.map((line) => (
            <Text key={line} style={styles.nextLine}>
              · {line}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.maxRank}>Maximum rank achieved.</Text>
      )}

      <Text style={styles.subTitle}>UNLOCKED CITIES</Text>
      <Text style={styles.meta}>
        {progression.unlockedCities
          .map((id) => CITY_MAP[id]?.name ?? id)
          .join(' · ')}
      </Text>

      {progression.ownedStashHouses.length > 0 ? (
        <>
          <Text style={styles.subTitle}>STASH HOUSES</Text>
          <Text style={styles.meta}>
            {progression.ownedStashHouses
              .map((id) => STASH_HOUSE_MAP[id]?.name ?? id)
              .join(' · ')}
          </Text>
        </>
      ) : null}
    </Card>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  rankBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rankLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
  },
  rankName: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: '700',
  },
  desc: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipValue: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  nextBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  nextTitle: {
    color: colors.warning,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextLine: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 16,
  },
  maxRank: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  subTitle: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  meta: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 15,
  },
});
