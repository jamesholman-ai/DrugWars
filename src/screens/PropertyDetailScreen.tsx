import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { AppShell, ScreenHeader, SectionCard } from '../components/ui';
import { EmpirePropertyCard, EmpireEventTimeline } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getPropertyTypeLabel } from '../data/safehouses';
import { getPropertyDef } from '../game/propertyPoolSystem';
import { PROPERTY_CATEGORY_LABELS } from '../data/propertyTemplates';
import {
  PROPERTY_UPGRADE_LABELS,
  getPropertyUpgradeCost,
} from '../data/empireCatalog';
import {
  getPropertyRecord,
  getEffectivePropertyStats,
} from '../game/propertyManagementSystem';
import { getPropertyAtmosphereSummary } from '../game/empireFlavorText';
import { getAssignedGuardForProperty } from '../game/crewManagementSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { PropertyUpgradeKind } from '../types/empire';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>;

const UPGRADE_KINDS: PropertyUpgradeKind[] = [
  'locks',
  'hiddenCompartments',
  'storageExpansion',
  'escapeRoute',
  'safeRoom',
  'surveillance',
  'cleanerCrew',
];

export function PropertyDetailScreen({ navigation, route }: Props) {
  const {
    gameState,
    assignPropertyGuard,
    upgradePropertyAction,
    layLowProperty,
    setHomeBase,
  } = useGame();
  const { safehouseId } = route.params;

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const record = getPropertyRecord(gameState, safehouseId);
  const def = getPropertyDef(gameState, safehouseId);
  const { player } = gameState;
  const rank = getCurrentRank(gameState);
  const guard = record ? getAssignedGuardForProperty(gameState, safehouseId) : undefined;
  const guards = (gameState.hiredCrew ?? []).filter((c) => c.status === 'hired');

  if (!record || !def) {
    return (
      <AppShell header={<ScreenHeader title="Property" day={player.day} />}>
        <Text style={styles.empty}>Property not found.</Text>
        <GameButton label="Back" onPress={() => navigation.goBack()} />
      </AppShell>
    );
  }

  const stats = getEffectivePropertyStats(gameState, record);
  const upgrades = record.upgradeLevels ?? {
    locks: 0,
    hiddenCompartments: 0,
    storageExpansion: 0,
    escapeRoute: 0,
    safeRoom: 0,
    surveillance: 0,
    cleanerCrew: 0,
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={def.name}
          subtitle={`${PROPERTY_CATEGORY_LABELS[def.category]} · ${getPropertyTypeLabel(def)}`}
          day={player.day}
          location={getAreaLabel(def.cityId, def.areaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
    >
      <ActionMessage message={gameState.lastMessage} />
      <EmpirePropertyCard state={gameState} record={record} />

      <SectionCard title="Atmosphere" tone="cyan">
        {getPropertyAtmosphereSummary(record).map((line) => (
          <Text key={line} style={styles.line}>{line}</Text>
        ))}
      </SectionCard>

      <SectionCard title="Protection">
        <Text style={styles.line}>Seizure protection {Math.round(stats.seizureProtection * 100)}%</Text>
        <Text style={styles.line}>Robbery reduction {Math.round(stats.robberyProtection * 100)}%</Text>
        <Text style={styles.line}>Heat relief +{stats.heatReduction}/day</Text>
      </SectionCard>

      <SectionCard title="Guard" subtitle={guard ? guard.name : 'Unassigned'}>
        {guards.length === 0 ? (
          <Text style={styles.empty}>Hire an Enforcer or Lookout to guard this property.</Text>
        ) : (
          guards.map((c) => (
            <GameButton
              key={c.id}
              label={`${c.name} (${c.role})`}
              size="sm"
              variant={guard?.id === c.id ? 'primary' : 'secondary'}
              onPress={() => assignPropertyGuard(safehouseId, c.id)}
              style={styles.btn}
            />
          ))
        )}
        {guard ? (
          <GameButton
            label="Remove Guard"
            size="sm"
            variant="ghost"
            onPress={() => assignPropertyGuard(safehouseId, null)}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Upgrades">
        {UPGRADE_KINDS.map((kind) => {
          const level = upgrades[kind];
          const maxed = level >= 3;
          const cost = maxed ? 0 : getPropertyUpgradeCost(kind, level + 1);
          return (
            <GameButton
              key={kind}
              label={`${PROPERTY_UPGRADE_LABELS[kind]} L${level}/3 — ${maxed ? 'MAX' : formatMoney(cost)}`}
              size="sm"
              variant="secondary"
              disabled={maxed || player.cash < cost}
              onPress={() => upgradePropertyAction(safehouseId, kind)}
              style={styles.btn}
            />
          );
        })}
      </SectionCard>

      <SectionCard title="Actions">
        <GameButton
          label={player.homeBaseId === safehouseId ? 'Primary Base' : 'Set as Primary Base'}
          size="sm"
          variant={player.homeBaseId === safehouseId ? 'primary' : 'secondary'}
          disabled={player.homeBaseId === safehouseId}
          onPress={() => setHomeBase(safehouseId)}
          style={styles.btn}
        />
        <GameButton
          label="Manage Storage"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('Inventory')}
          style={styles.btn}
        />
        <GameButton
          label="Lay Low Here"
          size="sm"
          variant="secondary"
          onPress={() => layLowProperty(safehouseId)}
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
});
