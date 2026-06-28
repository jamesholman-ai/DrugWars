import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, NeonButton } from '../components/premium';
import { useGame } from '../game/GameContext';
import { COMMODITY_MAP } from '../data/commodities';
import { SUPPLIER_MAP } from '../data/suppliers';
import { MISSION_MAP } from '../data/missions';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { daysUntilDeadline } from '../game/contractSystem';
import {
  formatMissionRewardSummary,
  getCurrentStoryMission,
  getDailyProgressLabel,
  getMissionProgressWidgetText,
  isStoryCampaignComplete,
} from '../game/missionSystem';
import { formatIntelSource, getTopActiveIntel } from '../game/intelSystem';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { AppIcons } from '../theme/icons';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OperationsDashboard'>;

export function OperationsDashboardScreen({ navigation }: Props) {
  const { gameState, claimMissionReward, claimDailyObjective, fulfillContract, isClaimingReward } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  const storyMission = useMemo(
    () => (gameState ? getCurrentStoryMission(gameState) : undefined),
    [gameState]
  );

  if (!gameState) return null;

  const { player, lastMessage, activeContracts, supplierOffers, dailyObjectives, completedMissions } = gameState;
  const rank = getCurrentRank(gameState);
  const storyDef = storyMission ? MISSION_MAP[storyMission.id] : undefined;
  const storyComplete = isStoryCampaignComplete(gameState);
  const todaysDaily = (dailyObjectives ?? []).filter((o) => o.generatedDay === player.day);
  const claimable = (completedMissions ?? []).filter((m) => !m.claimed);
  const topIntel = getTopActiveIntel(gameState);
  const contracts = activeContracts ?? [];
  const suppliers = supplierOffers ?? [];

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Operations"
          subtitle="Jobs · deals · supply"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Operations" />}
    >
      <ActionMessage message={lastMessage} />

      <SectionCard title="Story Mission" tone="amber" subtitle={storyComplete ? 'Campaign complete' : 'Current objective'}>
        {storyComplete ? (
          <Text style={styles.meta}>Story complete — keep building your empire.</Text>
        ) : storyDef && storyMission ? (
          <>
            <Text style={styles.title}>{storyDef.title}</Text>
            <Text style={styles.meta}>{storyDef.description}</Text>
            <Text style={styles.progress}>{getMissionProgressWidgetText(gameState, storyMission)}</Text>
            <NeonButton label="Open Missions" size="sm" onPress={() => navigation.navigate('Missions')} />
          </>
        ) : (
          <EmptyState icon={AppIcons.mission} title="No story mission" message="Advance the day or check Missions." actionLabel="Missions" onAction={() => navigation.navigate('Missions')} />
        )}
      </SectionCard>

      {todaysDaily.length > 0 ? (
        <SectionCard title="Daily Objectives" tone="green" subtitle={`${todaysDaily.length} today`}>
          {todaysDaily.slice(0, 4).map((obj) => {
            const done = obj.progress >= obj.target;
            const claiming = isClaimingReward(`daily:${obj.id}`);
            return (
              <View key={obj.id} style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{obj.title}</Text>
                  <Text style={styles.meta}>{getDailyProgressLabel(obj)}</Text>
                </View>
                {obj.claimed ? (
                  <Text style={styles.tag}>CLAIMED</Text>
                ) : done ? (
                  <Pressable style={styles.claimBtn} onPress={() => claimDailyObjective(obj.id)} disabled={claiming}>
                    <Text style={styles.claimText}>{claiming ? '…' : 'CLAIM'}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </SectionCard>
      ) : null}

      {claimable.length > 0 ? (
        <SectionCard title="Rewards Ready" tone="purple" subtitle={`${claimable.length} to claim`}>
          {claimable.slice(0, 3).map((m) => {
            const def = MISSION_MAP[m.id];
            if (!def) return null;
            const claiming = isClaimingReward(`mission:${m.id}`);
            return (
              <View key={m.id} style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{def.title}</Text>
                  <Text style={styles.meta}>{formatMissionRewardSummary(def.rewards)}</Text>
                </View>
                <Pressable style={styles.claimBtn} onPress={() => claimMissionReward(m.id)} disabled={claiming}>
                  <Text style={styles.claimText}>{claiming ? '…' : 'CLAIM'}</Text>
                </Pressable>
              </View>
            );
          })}
        </SectionCard>
      ) : null}

      <SectionCard title="Active Contracts" tone="cyan" subtitle={`${contracts.length} active`}>
        {contracts.length === 0 ? (
          <EmptyState icon={AppIcons.contract} title="No active contracts" message="Find buyers in Contracts." actionLabel="Contracts" onAction={() => navigation.navigate('Contracts')} />
        ) : (
          contracts.slice(0, 4).map((contract) => {
            const drug = COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug;
            const daysLeft = daysUntilDeadline(gameState, contract);
            const atSite =
              player.currentCityId === contract.cityId && player.currentAreaId === contract.areaId;
            return (
              <View key={contract.id} style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{contract.buyerName}</Text>
                  <Text style={styles.meta}>
                    {contract.requestedQuantity}× {drug} · {formatMoney(contract.payout)} ·{' '}
                    {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                  </Text>
                </View>
                {atSite ? (
                  <Pressable style={styles.claimBtn} onPress={() => fulfillContract(contract.id)}>
                    <Text style={styles.claimText}>DELIVER</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.viewBtn} onPress={() => navigation.navigate('Contracts')}>
                    <Text style={styles.viewText}>VIEW</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </SectionCard>

      <SectionCard title="Supplier Offers" tone="green" subtitle={`${suppliers.length} available`}>
        {suppliers.length === 0 ? (
          <Text style={styles.meta}>No supplier offers right now. Travel or advance the day.</Text>
        ) : (
          suppliers.slice(0, 3).map((offer) => {
            const supplier = SUPPLIER_MAP[offer.supplierId];
            return (
            <View key={offer.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{supplier?.name ?? offer.supplierId}</Text>
                <Text style={styles.meta}>
                  {COMMODITY_MAP[offer.commodityId]?.name ?? offer.commodityId} · {formatMoney(offer.unitPrice)}/u
                </Text>
              </View>
            </View>
            );
          })
        )}
        <View style={styles.navRow}>
          <GameButton label="Missions" size="sm" variant="secondary" onPress={() => navigation.navigate('Missions')} style={styles.navBtn} />
          <GameButton label="Contracts" size="sm" variant="secondary" onPress={() => navigation.navigate('Contracts')} style={styles.navBtn} />
          <GameButton label="Suppliers" size="sm" variant="secondary" onPress={() => navigation.navigate('Suppliers')} style={styles.navBtn} />
        </View>
      </SectionCard>

      {topIntel ? (
        <EventBanner label="Intel Tip" message={topIntel.message} tone="purple" />
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800', marginBottom: 4 },
  meta: { color: palette.textSecondary, fontSize: typography.caption, lineHeight: 18, marginBottom: spacing.sm },
  progress: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  rowBody: { flex: 1 },
  rowTitle: { color: palette.text, fontSize: typography.body, fontWeight: '700' },
  tag: { color: palette.textMuted, fontSize: typography.caption, fontWeight: '800' },
  claimBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  claimText: { color: palette.neon, fontSize: typography.caption, fontWeight: '800' },
  viewBtn: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  viewText: { color: palette.textSecondary, fontSize: typography.caption, fontWeight: '700' },
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  navBtn: { flex: 1, minWidth: '30%' },
});
