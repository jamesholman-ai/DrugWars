import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AAACommandShell, AAAUpgradeTabs, UpgradeTab } from '../components/aaa';
import { EventBanner, FilterChips, MoneyCard, SectionCard } from '../components/ui';
import { EmptyState, EmpireBusinessCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getPortfolioSummary } from '../game/businessManagementSystem';
import { BUSINESS_REPAIR_COST, BUSINESS_TYPE_LABELS } from '../data/businesses';
import {
  getAverageBusinessRisk,
  getBusinessesAtLocation,
  getTotalBusinessHeatReduction,
  getTotalBusinessUpkeep,
  getTotalLaunderingCapacity,
  getTotalPassiveIncome,
  isBusinessOwned,
  meetsBusinessUnlock,
} from '../game/businessSystem';
import { getRankBenefitsForState } from '../data/rankBenefits';
import { getCurrentRank, getNextRank } from '../game/progression';
import {
  filterBusinessesByChip,
  formatBusinessTierSummary,
  getBusinessLockHints,
  getBusinessesUnlockedAtNextRank,
  isBusinessCashLocked,
  isBusinessRankLocked,
} from '../game/unlockHints';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Businesses'>;
type BusinessFilter = 'all' | 'affordable' | 'locked' | 'owned' | 'high_income' | 'laundering';

const BUSINESS_FILTERS: { id: BusinessFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'affordable', label: 'Affordable' },
  { id: 'locked', label: 'Locked' },
  { id: 'owned', label: 'Owned' },
  { id: 'high_income', label: 'High Income' },
  { id: 'laundering', label: 'Laundering' },
];

export function BusinessesScreen({ navigation }: Props) {
  const { gameState, purchaseBusiness, repairBusiness } = useGame();
  const [filter, setFilter] = useState<BusinessFilter>('all');
  const [upgradeTab, setUpgradeTab] = useState<UpgradeTab>('business');

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, ownedBusinesses } = gameState;
  const rank = getCurrentRank(gameState);
  const nextRank = getNextRank(gameState.progression.rankId);
  const rankBenefits = getRankBenefitsForState(gameState);
  const tierSummary = formatBusinessTierSummary(gameState);
  const localAll = getBusinessesAtLocation(gameState, player.currentCityId, player.currentAreaId);
  const local = useMemo(
    () => filterBusinessesByChip(gameState, localAll, filter),
    [gameState, localAll, filter]
  );
  const unlockedAtNext = useMemo(
    () => getBusinessesUnlockedAtNextRank(gameState, localAll),
    [gameState, localAll]
  );
  const passiveIncome = getTotalPassiveIncome(gameState);
  const upkeep = getTotalBusinessUpkeep(gameState);
  const launderCap = getTotalLaunderingCapacity(gameState);
  const heatReduction = getTotalBusinessHeatReduction(gameState);
  const avgRisk = getAverageBusinessRisk(gameState);
  const portfolio = getPortfolioSummary(gameState);

  if (upgradeTab !== 'business') {
    const tabRoutes: Record<Exclude<UpgradeTab, 'business'>, { title: string; route: 'Store' | 'Safehouses' }> = {
      equipment: { title: 'Equipment upgrades live in the Empire Store.', route: 'Store' },
      vehicles: { title: 'Vehicle upgrades live in the Empire Store.', route: 'Store' },
      hideout: { title: 'Hideouts and properties are managed separately.', route: 'Safehouses' },
    };
    const redirect = tabRoutes[upgradeTab];
    return (
      <AAACommandShell footer={<GameNavFooter navigation={navigation} active="Empire" />}>
        <AAAUpgradeTabs
          active={upgradeTab}
          onChange={setUpgradeTab}
          cashLabel={formatMoney(player.cash)}
        />
        <View style={styles.altTab}>
          <Text style={styles.altTitle}>{redirect.title}</Text>
          <GameButton
            label={upgradeTab === 'hideout' ? 'OPEN PROPERTIES' : 'OPEN STORE'}
            onPress={() => navigation.navigate(redirect.route)}
          />
        </View>
      </AAACommandShell>
    );
  }

  return (
    <AAACommandShell footer={<GameNavFooter navigation={navigation} active="Empire" />}>
      <AAAUpgradeTabs
        active={upgradeTab}
        onChange={setUpgradeTab}
        cashLabel={formatMoney(player.cash)}
      />

      <View style={styles.moneyRow}>
        <MoneyCard label="Net/day" amount={formatMoney(portfolio.income - portfolio.upkeep)} tone="green" icon="📈" />
        <MoneyCard label="Launder" amount={formatMoney(portfolio.launder)} tone="purple" icon="💧" />
        <MoneyCard label="Fronts" amount={String(portfolio.count)} tone="amber" icon="🏢" />
      </View>

      <ActionMessage message={lastMessage} />

      <SectionCard title="Rank Access" tone="purple" subtitle={`${rank.name} · business tier ${rankBenefits.maxBusinessTier}`}>
        <Text style={styles.hintLine}>
          You can buy tier 1–{rankBenefits.maxBusinessTier} fronts. Listings refresh daily and when you travel.
        </Text>
        {nextRank && tierSummary.nextTier != null && tierSummary.nextTier > tierSummary.currentTier ? (
          <Text style={styles.nextRankLine}>
            Next rank ({nextRank.name}): tier {tierSummary.nextTier} businesses unlock
          </Text>
        ) : null}
      </SectionCard>

      <EventBanner
        label="Fronts & Laundering"
        message="Buy on-site. Income is clean. Launder dirty cash daily. Fronts reduce heat. High heat risks raids."
        tone="green"
      />

      <SectionCard title="Empire Stats" subtitle={`${(ownedBusinesses ?? []).length} business(es) owned`}>
        <Text style={styles.statLine}>Passive income: {formatMoney(passiveIncome)}/day</Text>
        <Text style={styles.statLine}>Upkeep: {formatMoney(upkeep)}/day</Text>
        <Text style={styles.statLine}>Laundering: {formatMoney(launderCap)}/day</Text>
        <Text style={styles.statLine}>Heat reduction: −{heatReduction}/day</Text>
        {avgRisk > 0 ? (
          <Text style={styles.statLine}>Average risk: {avgRisk}/10</Text>
        ) : null}
      </SectionCard>

      {(ownedBusinesses ?? []).length > 0 ? (
        <SectionCard title="Portfolio" subtitle="Tap a front for upgrades and manager">
          {(ownedBusinesses ?? []).map((record) => (
            <EmpireBusinessCard
              key={record.businessId}
              state={gameState}
              record={record}
              onPress={() => navigation.navigate('BusinessDetail', { businessId: record.businessId })}
            />
          ))}
        </SectionCard>
      ) : (
        <SectionCard title="Portfolio">
          <EmptyState
            icon="🏢"
            title="No businesses yet"
            message="Buy a front on-site to earn clean income and launder dirty cash. Upgrades and crew managers unlock later."
          />
        </SectionCard>
      )}

      {unlockedAtNext.length > 0 ? (
        <SectionCard title="Unlocked at Next Rank" tone="amber" subtitle={`Promote to ${nextRank?.name} to access these`}>
          {unlockedAtNext.slice(0, 5).map((def) => (
            <Text key={def.id} style={styles.previewLine} numberOfLines={1}>
              · {def.name} — {BUSINESS_TYPE_LABELS[def.type]} (tier {def.tier ?? 1})
            </Text>
          ))}
          {unlockedAtNext.length > 5 ? (
            <Text style={styles.previewMore}>+{unlockedAtNext.length - 5} more waiting at next rank</Text>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="This Area" subtitle={`${local.length} of ${localAll.length} listing(s)`}>
        <FilterChips options={BUSINESS_FILTERS} value={filter} onChange={setFilter} />

        {local.length === 0 ? (
          <EmptyState
            icon="📍"
            title={filter === 'all' ? 'Nothing for sale here' : 'No matches'}
            message={
              filter === 'all'
                ? 'Travel to districts with available fronts.'
                : 'Try another filter or travel to refresh listings.'
            }
          />
        ) : (
          local.map((def) => {
            const owned = isBusinessOwned(gameState, def.id);
            const unlocked = meetsBusinessUnlock(gameState, def);
            const rankLocked = isBusinessRankLocked(gameState, def);
            const cashLocked = isBusinessCashLocked(gameState, def);
            const lockHints = owned ? [] : getBusinessLockHints(gameState, def);
            const record = (ownedBusinesses ?? []).find((o) => o.businessId === def.id);
            const effectiveIncome =
              record && record.condition > 0
                ? Math.round(def.dailyIncome * Math.max(0.1, record.condition / 100))
                : def.dailyIncome;

            return (
              <View key={def.id} style={styles.card}>
                <Text style={styles.name} numberOfLines={2}>{def.name}</Text>
                <Text style={styles.type}>
                  {BUSINESS_TYPE_LABELS[def.type]}
                  {(def.tier ?? 1) > 1 ? ` · Tier ${def.tier}` : ''}
                </Text>
                <Text style={styles.desc} numberOfLines={3}>{def.description}</Text>
                <Text style={styles.meta}>
                  Income {formatMoney(effectiveIncome)}/day · Launder {formatMoney(def.launderingCapacityPerDay)}/day
                </Text>
                <Text style={styles.meta}>
                  Upkeep {formatMoney(def.upkeepPerDay)}/day · Risk {def.riskLevel}/10
                </Text>
                {!owned && lockHints.length > 0 ? (
                  <View style={styles.lockBox}>
                    {lockHints.map((hint) => (
                      <Text key={hint} style={styles.lockHint} numberOfLines={2}>
                        · {hint}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {owned ? (
                  <>
                    <Text style={styles.owned}>OWNED · tap Portfolio above for management</Text>
                    {record && record.condition < 100 ? (
                      <GameButton
                        label={`REPAIR ${formatMoney(BUSINESS_REPAIR_COST)}`}
                        size="sm"
                        variant="secondary"
                        disabled={player.isGameOver || player.cash < BUSINESS_REPAIR_COST}
                        onPress={() => repairBusiness(def.id)}
                        style={styles.btn}
                      />
                    ) : null}
                  </>
                ) : (
                  <GameButton
                    label={`BUY ${formatMoney(def.purchaseCost)}`}
                    size="sm"
                    disabled={
                      player.isGameOver ||
                      rankLocked ||
                      cashLocked ||
                      !unlocked
                    }
                    onPress={() => purchaseBusiness(def.id)}
                    style={styles.btn}
                  />
                )}
              </View>
            );
          })
        )}
      </SectionCard>
    </AAACommandShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  altTab: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  altTitle: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  statLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
  hintLine: { color: palette.textSecondary, fontSize: 11, lineHeight: 17 },
  nextRankLine: { color: palette.amber, fontSize: 11, lineHeight: 17, marginTop: spacing.xs, fontWeight: '600' },
  previewLine: { color: palette.textSecondary, fontSize: 11, lineHeight: 17, marginBottom: 2 },
  previewMore: { color: palette.textMuted, fontSize: 10, marginTop: spacing.xs },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  type: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginTop: 4 },
  desc: { color: palette.textSecondary, fontSize: typography.caption, marginTop: 6, lineHeight: 18 },
  meta: { color: palette.textMuted, fontSize: typography.caption, marginTop: 4, lineHeight: 16 },
  lockBox: { marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: palette.border },
  lockHint: { color: palette.danger, fontSize: typography.caption, fontWeight: '600', lineHeight: 17 },
  owned: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginTop: 8 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
