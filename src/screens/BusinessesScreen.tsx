import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, EmpireBusinessCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getPortfolioSummary } from '../game/businessManagementSystem';
import {
  BUSINESS_MAP,
  BUSINESS_REPAIR_COST,
  BUSINESS_TYPE_LABELS,
} from '../data/businesses';
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
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Businesses'>;

export function BusinessesScreen({ navigation }: Props) {
  const { gameState, purchaseBusiness, repairBusiness } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, ownedBusinesses } = gameState;
  const rank = getCurrentRank(gameState);
  const local = getBusinessesAtLocation(gameState, player.currentCityId, player.currentAreaId);
  const passiveIncome = getTotalPassiveIncome(gameState);
  const upkeep = getTotalBusinessUpkeep(gameState);
  const launderCap = getTotalLaunderingCapacity(gameState);
  const heatReduction = getTotalBusinessHeatReduction(gameState);
  const avgRisk = getAverageBusinessRisk(gameState);
  const portfolio = getPortfolioSummary(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Businesses"
          subtitle="Fronts · laundering · upgrades"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Empire" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Net/day" amount={formatMoney(portfolio.income - portfolio.upkeep)} tone="green" icon="📈" />
        <MoneyCard label="Launder" amount={formatMoney(portfolio.launder)} tone="purple" icon="💧" />
        <MoneyCard label="Fronts" amount={String(portfolio.count)} tone="amber" icon="🏢" />
      </View>

      <ActionMessage message={lastMessage} />

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

      <SectionCard title="This Area" subtitle={`${local.length} listing(s)`}>
        {local.length === 0 ? (
          <EmptyState icon="📍" title="Nothing for sale here" message="Travel to districts with available fronts." />
        ) : (
          local.map((def) => {
            const owned = isBusinessOwned(gameState, def.id);
            const unlocked = meetsBusinessUnlock(gameState, def);
            const record = (ownedBusinesses ?? []).find((o) => o.businessId === def.id);
            const effectiveIncome =
              record && record.condition > 0
                ? Math.round(def.dailyIncome * Math.max(0.1, record.condition / 100))
                : def.dailyIncome;

            return (
              <View key={def.id} style={styles.card}>
                <Text style={styles.name}>{def.name}</Text>
                <Text style={styles.type}>{BUSINESS_TYPE_LABELS[def.type]}</Text>
                <Text style={styles.desc}>{def.description}</Text>
                <Text style={styles.meta}>
                  Income {formatMoney(effectiveIncome)}/day · Launder {formatMoney(def.launderingCapacityPerDay)}
                  /day · Heat −{def.heatReductionPerDay}/day
                </Text>
                <Text style={styles.meta}>
                  Upkeep {formatMoney(def.upkeepPerDay)}/day · Risk {def.riskLevel}/10
                </Text>
                {!unlocked && !owned ? (
                  <Text style={styles.locked}>
                    Locked — rank/reputation required
                  </Text>
                ) : null}
                {owned ? (
                  <>
                    <Text style={styles.owned}>
                      OWNED · tap Portfolio above for management
                    </Text>
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
                      !unlocked ||
                      player.cash < def.purchaseCost
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
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  empty: { color: palette.textMuted, fontSize: 12 },
  statLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
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
  locked: { color: palette.danger, fontSize: typography.caption, fontWeight: '700', marginTop: 8 },
  owned: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginTop: 8 },
  ownedLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
