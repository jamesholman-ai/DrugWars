import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
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
import { fonts, palette, radius, spacing } from '../theme/theme';

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
  const dirty = player.dirtyCash ?? 0;
  const clean = player.cleanCash ?? 0;

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Businesses"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Progress" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Dirty" amount={formatMoney(dirty)} tone="amber" icon="💸" />
        <MoneyCard label="Clean" amount={formatMoney(clean)} tone="green" icon="✓" />
        <MoneyCard label="Income" amount={formatMoney(passiveIncome)} tone="purple" icon="📈" />
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

      <SectionCard title="This Area" subtitle={`${local.length} listing(s)`}>
        {local.length === 0 ? (
          <Text style={styles.empty}>No businesses for sale in this district.</Text>
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
                      OWNED · Condition {record?.condition ?? 100}%
                      {record && record.condition <= 0 ? ' · SHUT DOWN' : ''}
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

      {(ownedBusinesses ?? []).length > 0 ? (
        <SectionCard title="Your Portfolio" subtitle="All owned fronts">
          {(ownedBusinesses ?? []).map((o) => {
            const def = BUSINESS_MAP[o.businessId];
            const name = def?.name ?? o.businessId;
            const city = def ? getAreaLabel(def.cityId, def.areaId) : 'Unknown';
            return (
              <Text key={o.businessId} style={styles.ownedLine}>
                {name} · {city} · condition {o.condition}%
                {o.condition <= 0 ? ' (needs repair)' : ''}
              </Text>
            );
          })}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  empty: { color: palette.textMuted, fontSize: 12 },
  statLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
  card: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  name: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  type: { color: palette.neon, fontSize: 9, fontWeight: '800', marginTop: 2 },
  desc: { color: palette.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 },
  meta: { color: palette.textMuted, fontSize: 10, marginTop: 4 },
  locked: { color: palette.danger, fontSize: 10, fontWeight: '700', marginTop: 6 },
  owned: { color: palette.neon, fontSize: 10, fontWeight: '700', marginTop: 6 },
  ownedLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
