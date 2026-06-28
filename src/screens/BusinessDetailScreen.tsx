import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { AppShell, ScreenHeader, SectionCard } from '../components/ui';
import { EmpireBusinessCard, EmpireEventTimeline } from '../components/premium';
import { useGame } from '../game/GameContext';
import { BUSINESS_MAP, BUSINESS_REPAIR_COST, BUSINESS_TYPE_LABELS } from '../data/businesses';
import {
  BUSINESS_UPGRADE_LABELS,
  getBusinessUpgradeCost,
} from '../data/empireCatalog';
import { getBusinessRecord, getEffectiveBusinessStats } from '../game/businessManagementSystem';
import { getBusinessStoryLine } from '../game/empireFlavorText';
import { getAssignedManagerForBusiness } from '../game/crewManagementSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { BusinessUpgradeKind } from '../types/empire';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessDetail'>;

const UPGRADE_KINDS: BusinessUpgradeKind[] = [
  'security',
  'staff',
  'laundering',
  'legitimacy',
  'expansion',
];

export function BusinessDetailScreen({ navigation, route }: Props) {
  const { gameState, repairBusiness, upgradeBusinessAction, assignBusinessManager, layLowBusiness } = useGame();
  const { businessId } = route.params;

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const record = getBusinessRecord(gameState, businessId);
  const def = BUSINESS_MAP[businessId];
  const { player } = gameState;
  const rank = getCurrentRank(gameState);
  const manager = record ? getAssignedManagerForBusiness(gameState, businessId) : undefined;
  const managers = (gameState.hiredCrew ?? []).filter((c) => c.status === 'hired');

  if (!record || !def) {
    return (
      <AppShell header={<ScreenHeader title="Business" day={player.day} />}>
        <Text style={styles.empty}>Business not found.</Text>
        <GameButton label="Back" onPress={() => navigation.goBack()} />
      </AppShell>
    );
  }

  const stats = getEffectiveBusinessStats(gameState, record);
  const upgrades = record.upgradeLevels ?? {
    security: 0,
    staff: 0,
    laundering: 0,
    legitimacy: 0,
    expansion: 0,
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={def.name}
          subtitle={BUSINESS_TYPE_LABELS[def.type]}
          day={player.day}
          location={getAreaLabel(def.cityId, def.areaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
    >
      <ActionMessage message={gameState.lastMessage} />
      <EmpireBusinessCard state={gameState} record={record} />

      <SectionCard title="Front Story" tone="amber">
        <Text style={styles.line}>{getBusinessStoryLine(record)}</Text>
      </SectionCard>

      <SectionCard title="Daily Summary">
        <Text style={styles.line}>Net income ~ ${stats.income - stats.upkeep}/day</Text>
        <Text style={styles.line}>Laundering ${stats.launderCap}/day</Text>
        <Text style={styles.line}>Heat reduction −{stats.heatDrop}/day</Text>
      </SectionCard>

      <SectionCard title="Manager" subtitle={manager ? manager.name : 'Unassigned'}>
        {managers.length === 0 ? (
          <Text style={styles.empty}>Hire an Accountant, Dealer, or Fixer to manage this front.</Text>
        ) : (
          managers.map((c) => (
            <GameButton
              key={c.id}
              label={`${c.name} (${c.role})`}
              size="sm"
              variant={manager?.id === c.id ? 'primary' : 'secondary'}
              onPress={() => assignBusinessManager(businessId, c.id)}
              style={styles.btn}
            />
          ))
        )}
        {manager ? (
          <GameButton
            label="Remove Manager"
            size="sm"
            variant="ghost"
            onPress={() => assignBusinessManager(businessId, null)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Upgrades">
        {UPGRADE_KINDS.map((kind) => {
          const level = upgrades[kind];
          const maxed = level >= 3;
          const cost = maxed ? 0 : getBusinessUpgradeCost(kind, level + 1);
          return (
            <View key={kind} style={styles.upgradeRow}>
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeName}>{BUSINESS_UPGRADE_LABELS[kind]}</Text>
                <Text style={styles.upgradeLevel}>Level {level}/3</Text>
              </View>
              <GameButton
                label={maxed ? 'MAX' : formatMoney(cost)}
                size="sm"
                disabled={maxed || player.cash < cost || record.condition <= 0}
                onPress={() => upgradeBusinessAction(businessId, kind)}
              />
            </View>
          );
        })}
      </SectionCard>

      <SectionCard title="Actions">
        {record.condition < 100 ? (
          <GameButton
            label={`Repair ${formatMoney(BUSINESS_REPAIR_COST)}`}
            size="sm"
            variant="secondary"
            disabled={player.cash < BUSINESS_REPAIR_COST}
            onPress={() => repairBusiness(businessId)}
            style={styles.btn}
          />
        ) : null}
        <GameButton
          label="Lay Low Through Business"
          size="sm"
          variant="secondary"
          disabled={upgrades.legitimacy < 1}
          onPress={() => layLowBusiness(businessId)}
          style={styles.btn}
        />
      </SectionCard>

      <SectionCard title="Recent Events">
        <EmpireEventTimeline events={record.recentEvents ?? []} />
      </SectionCard>

      <GameButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  empty: { color: palette.textMuted, fontSize: typography.caption, marginBottom: spacing.sm },
  line: { color: palette.textSecondary, fontSize: typography.caption, marginBottom: 4 },
  btn: { marginBottom: spacing.xs },
  upgradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  upgradeInfo: { flex: 1 },
  upgradeName: { color: palette.text, fontSize: typography.caption, fontWeight: '700' },
  upgradeLevel: { color: palette.textMuted, fontSize: 10, marginTop: 2 },
});
