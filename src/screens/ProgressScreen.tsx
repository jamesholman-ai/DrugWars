import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameNavFooter } from '../components/GameNavFooter';
import { GameButton } from '../components/GameButton';
import { ActionMessage } from '../components/ActionMessage';
import {
  AppShell,
  MoneyCard,
  ScreenHeader,
  SectionCard,
  StatBar,
} from '../components/ui';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import {
  formatNextRankRequirements,
  getCurrentRank,
  getNextRank,
  getReputationTier,
  isCityUnlocked,
  getCityUnlockHint,
} from '../game/progression';
import { RANKS, STASH_HOUSE_MAP, INVENTORY_UPGRADE_MAP } from '../data/progression';
import { CITIES } from '../data/locations';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { getAreaLabel } from '../data/locations';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

export function ProgressScreen({ navigation }: Props) {
  const {
    gameState,
    layLow,
    bribePolice,
    hireLawyer,
    useSafehouse,
    destroyEvidence,
    payInformant,
    useBurnerPhone,
  } = useGame();

  useEffect(() => {
    if (!gameState) {
      navigation.replace('Home');
    }
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, progression } = gameState;
  const rank = getCurrentRank(gameState);
  const nextRank = getNextRank(progression.rankId);
  const repTier = getReputationTier(player.reputation);
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const rankProgress = computeRankProgressPercent(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Status"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={rankProgress}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="More" />}
    >
      <ActionMessage message={gameState.lastMessage} />

      <View style={styles.toolsRow}>
        <Pressable style={styles.toolCard} onPress={() => navigation.navigate('Upgrades')}>
          <Text style={styles.toolIcon}>⬆</Text>
          <Text style={styles.toolLabel}>UPGRADES</Text>
          <Text style={styles.toolSub}>Gear · capacity · hideouts</Text>
        </Pressable>
        <Pressable style={styles.toolCard} onPress={() => navigation.navigate('Contacts')}>
          <Text style={styles.toolIcon}>👤</Text>
          <Text style={styles.toolLabel}>CONTACTS</Text>
          <Text style={styles.toolSub}>NPC trust · history</Text>
        </Pressable>
      </View>

      <View style={styles.moneyRow}>
        <Pressable style={styles.financeLink} onPress={() => navigation.navigate('Finance')}>
          <MoneyCard label="Net Worth" amount={formatMoney(netWorth)} tone="purple" icon="🏦" />
        </Pressable>
        <Pressable style={styles.financeLink} onPress={() => navigation.navigate('Finance')}>
          <MoneyCard label="Profit" amount={formatMoney(progression.lifetimeProfit)} tone="green" icon="📈" />
        </Pressable>
      </View>
      <GameButton
        label="OPEN FINANCE"
        size="sm"
        variant="secondary"
        onPress={() => navigation.navigate('Finance')}
        style={styles.financeBtn}
      />

      <SectionCard title="Your Rank" tone="purple" subtitle={rank.description}>
        <View style={styles.rankHero}>
          <Text style={styles.rankName}>{rank.name}</Text>
          <Text style={styles.rankTier}>{repTier.name} · {player.reputation}/100 rep</Text>
        </View>
        <StatBar label="Rank Progress" value={rankProgress} color={palette.purpleBright} />
        <StatBar label="Reputation" value={player.reputation} color={palette.purpleBright} />
      </SectionCard>

      <SectionCard title="Heat & Legal" tone="amber">
        <StatBar label="Heat" value={player.heat} color={palette.amber} dangerAbove={75} />
        <Text style={styles.legalLine}>
          Legal status: {player.legalStatus.replace(/_/g, ' ').toUpperCase()}
          {player.federalCaseSeverity > 0 ? ` · Federal ${player.federalCaseSeverity}%` : ''}
          {player.daysInJail > 0 ? ` · Jail ${player.daysInJail}d` : ''}
        </Text>
        <Text style={styles.legalLine}>
          Cartel standing: {gameState.cartelStanding ?? 0}
          {(gameState.cartelBetrayals ?? 0) > 0
            ? ` · Betrayals ${gameState.cartelBetrayals}`
            : ''}
        </Text>
        <View style={styles.heatActions}>
          <GameButton label="LAY LOW (+1 day)" size="sm" onPress={layLow} style={styles.heatBtn} />
          <GameButton label="BRIBE POLICE" size="sm" variant="secondary" onPress={bribePolice} style={styles.heatBtn} />
          <GameButton label="HIRE LAWYER" size="sm" variant="secondary" onPress={hireLawyer} style={styles.heatBtn} />
          <GameButton label="USE PROPERTY" size="sm" variant="secondary" onPress={useSafehouse} style={styles.heatBtn} />
          <GameButton label="DESTROY EVIDENCE" size="sm" variant="secondary" onPress={destroyEvidence} style={styles.heatBtn} />
          <GameButton label="PAY INFORMANT" size="sm" variant="secondary" onPress={payInformant} style={styles.heatBtn} />
          <GameButton label="USE BURNER" size="sm" variant="secondary" onPress={useBurnerPhone} style={styles.heatBtn} />
        </View>
      </SectionCard>

      {nextRank ? (
        <SectionCard title={`Next — ${nextRank.name}`} tone="amber">
          {formatNextRankRequirements(gameState).map((line) => (
            <Text key={line} style={styles.reqLine}>
              · {line}
            </Text>
          ))}
        </SectionCard>
      ) : (
        <SectionCard title="Maximum Rank" tone="green">
          <Text style={styles.reqLine}>You've reached the top of the ladder.</Text>
        </SectionCard>
      )}

      <SectionCard title="Rank Ladder">
        {RANKS.map((entry) => {
          const achieved =
            RANKS.findIndex((r) => r.id === progression.rankId) >=
            RANKS.findIndex((r) => r.id === entry.id);
          const current = entry.id === rank.id;

          return (
            <View key={entry.id} style={[styles.ladderRow, current && styles.ladderCurrent]}>
              <Text style={[styles.ladderName, achieved && styles.ladderAchieved]}>
                {achieved ? '✓ ' : '○ '}
                {entry.name}
              </Text>
              {current ? <Text style={styles.currentBadge}>NOW</Text> : null}
            </View>
          );
        })}
      </SectionCard>

      <SectionCard title="City Access">
        {CITIES.map((city) => {
          const unlocked = isCityUnlocked(gameState, city.id);
          return (
            <View key={city.id} style={styles.cityRow}>
              <Text style={[styles.cityName, !unlocked && styles.cityLocked]}>{city.name}</Text>
              <View style={[styles.statusPill, unlocked ? styles.statusOpen : styles.statusClosed]}>
                <Text style={styles.statusText}>{unlocked ? 'OPEN' : 'LOCKED'}</Text>
              </View>
            </View>
          );
        })}
        {CITIES.some((c) => !isCityUnlocked(gameState, c.id)) ? (
          <Text style={styles.hint}>
            {CITIES.filter((c) => !isCityUnlocked(gameState, c.id))
              .map((c) => `${c.name}: ${getCityUnlockHint(c.id)}`)
              .join('\n')}
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Empire Summary">
        <SummaryRow label="Days survived" value={String(player.day)} />
        <SummaryRow label="Inventory capacity" value={String(player.inventoryCapacity)} />
        <SummaryRow
          label="Upgrades"
          value={
            progression.purchasedInventoryUpgrades.length > 0
              ? progression.purchasedInventoryUpgrades
                  .map((id) => INVENTORY_UPGRADE_MAP[id]?.name ?? id)
                  .join(', ')
              : 'None'
          }
        />
        <SummaryRow
          label="Hideouts"
          value={
            progression.ownedStashHouses.length > 0
              ? progression.ownedStashHouses
                  .map((id) => STASH_HOUSE_MAP[id]?.name ?? id)
                  .join(', ')
              : 'None'
          }
        />
        <SummaryRow
          label="Properties"
          value={
            (gameState.ownedSafehouses ?? []).length > 0
              ? `${(gameState.ownedSafehouses ?? []).length} owned`
              : 'None'
          }
        />
      </SectionCard>
    </AppShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  financeLink: {
    flex: 1,
  },
  financeBtn: {
    marginBottom: spacing.md,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toolCard: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  toolLabel: {
    color: palette.neon,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  toolSub: {
    color: palette.textMuted,
    fontSize: 8,
    marginTop: 4,
    textAlign: 'center',
  },
  rankHero: {
    marginBottom: spacing.sm,
  },
  rankName: {
    color: palette.purpleBright,
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rankTier: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  legalLine: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  heatActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heatBtn: {
    width: '48%',
    flexGrow: 1,
    marginVertical: 0,
  },
  reqLine: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 18,
  },
  ladderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  ladderCurrent: {
    backgroundColor: palette.purpleGlow,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  ladderName: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  ladderAchieved: {
    color: palette.text,
    fontWeight: '700',
  },
  currentBadge: {
    color: palette.purpleBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  cityName: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '600',
  },
  cityLocked: {
    color: palette.textMuted,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  statusOpen: {
    borderColor: palette.neonDim,
    backgroundColor: palette.neonSoft,
  },
  statusClosed: {
    borderColor: palette.dangerDim,
    backgroundColor: palette.dangerGlow,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: palette.text,
  },
  hint: {
    color: palette.amber,
    fontSize: 9,
    lineHeight: 14,
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 10,
    flex: 1,
  },
  summaryValue: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '600',
    flex: 1.2,
    textAlign: 'right',
  },
});
