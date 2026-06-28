import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, EmpireBusinessCard, EmpireCrewCard, EmpirePropertyCard, StatBar } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import { getDailyPayroll, getHiredCrewCount } from '../game/crewBonuses';
import { getDailySafehouseUpkeep, getTotalStorageCapacity } from '../game/safehouseSystem';
import {
  getAverageBusinessRisk,
  getTotalBusinessUpkeep,
  getTotalPassiveIncome,
} from '../game/businessSystem';
import { getPortfolioSummary } from '../game/businessManagementSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { AppIcons } from '../theme/icons';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EmpireDashboard'>;

export function EmpireDashboardScreen({ navigation }: Props) {
  const { gameState } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, hiredCrew, ownedBusinesses, ownedSafehouses } = gameState;
  const rank = getCurrentRank(gameState);
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const portfolio = getPortfolioSummary(gameState);
  const payroll = getDailyPayroll(gameState);
  const propertyUpkeep = getDailySafehouseUpkeep(gameState);
  const businessUpkeep = getTotalBusinessUpkeep(gameState);
  const passiveIncome = getTotalPassiveIncome(gameState);
  const dailyNet = portfolio.income - payroll - propertyUpkeep - businessUpkeep;
  const businessRisk = getAverageBusinessRisk(gameState);
  const activeCrew = (hiredCrew ?? []).filter((c) => c.status === 'hired');
  const businesses = ownedBusinesses ?? [];
  const properties = ownedSafehouses ?? [];

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Empire"
          subtitle="Assets · crew · storage"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Empire" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Net Worth" amount={formatMoney(netWorth)} amountValue={netWorth} tone="purple" icon={AppIcons.netWorth} />
        <MoneyCard label="Daily Net" amount={formatMoney(dailyNet)} amountValue={dailyNet} tone={dailyNet >= 0 ? 'green' : 'red'} icon={AppIcons.finance} />
      </View>

      <ActionMessage message={lastMessage} />

      <SectionCard title="Empire Summary" tone="purple">
        <Text style={styles.line}>Front income {formatMoney(passiveIncome)}/day · Payroll {formatMoney(payroll)}/day</Text>
        <Text style={styles.line}>Storage capacity {getTotalStorageCapacity(gameState)} · Empire risk {businessRisk}/10</Text>
        <StatBar label="Heat" value={player.heat} color={palette.amber} dangerAbove={75} />
      </SectionCard>

      <SectionCard title="Crew" tone="cyan" subtitle={`${activeCrew.length} active`}>
        {activeCrew.length === 0 ? (
          <EmptyState icon={AppIcons.crew} title="No crew hired" message="Recruit operators to boost your empire." actionLabel="Open Crew" onAction={() => navigation.navigate('Crew')} />
        ) : (
          activeCrew.slice(0, 2).map((member) => (
            <EmpireCrewCard
              key={member.id}
              member={member}
              onPress={() => navigation.navigate('CrewDetail', { crewId: member.id })}
            />
          ))
        )}
        <GameButton label="Manage Crew" size="sm" variant="secondary" onPress={() => navigation.navigate('Crew')} />
      </SectionCard>

      <SectionCard title="Businesses" tone="amber" subtitle={`${businesses.length} fronts`}>
        {businesses.length === 0 ? (
          <EmptyState icon={AppIcons.business} title="No businesses" message="Buy fronts to launder and reduce heat." actionLabel="Businesses" onAction={() => navigation.navigate('Businesses')} />
        ) : (
          businesses.slice(0, 2).map((record) => (
            <EmpireBusinessCard
              key={record.businessId}
              state={gameState}
              record={record}
              onPress={() => navigation.navigate('BusinessDetail', { businessId: record.businessId })}
            />
          ))
        )}
        <GameButton label="Manage Businesses" size="sm" variant="secondary" onPress={() => navigation.navigate('Businesses')} />
      </SectionCard>

      <SectionCard title="Properties & Storage" tone="green" subtitle={`${properties.length} sites`}>
        {properties.length === 0 ? (
          <EmptyState icon={AppIcons.property} title="No properties" message="Safehouses expand storage and security." actionLabel="Properties" onAction={() => navigation.navigate('Safehouses')} />
        ) : (
          properties.slice(0, 2).map((record) => (
            <EmpirePropertyCard
              key={record.safehouseId}
              state={gameState}
              record={record}
              onPress={() => navigation.navigate('PropertyDetail', { safehouseId: record.safehouseId })}
            />
          ))
        )}
        <View style={styles.navRow}>
          <GameButton label="Properties" size="sm" variant="secondary" onPress={() => navigation.navigate('Safehouses')} style={styles.navBtn} />
          <GameButton label="Storage" size="sm" variant="secondary" onPress={() => navigation.navigate('Inventory')} style={styles.navBtn} />
        </View>
      </SectionCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  line: { color: palette.textSecondary, fontSize: typography.caption, marginBottom: 4, lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  navBtn: { flex: 1 },
});
