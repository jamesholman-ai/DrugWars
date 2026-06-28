import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, EmpireCrewCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { CREW_ROLE_LABELS } from '../game/crewBonuses';
import { getDailyPayroll, getHiredCrewCount } from '../game/crewBonuses';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Crew'>;

export function CrewScreen({ navigation }: Props) {
  const { gameState, hireCrew } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, availableCrew, hiredCrew } = gameState;
  const rank = getCurrentRank(gameState);
  const payroll = getDailyPayroll(gameState);
  const active = (hiredCrew ?? []).filter((c) => c.status === 'hired');
  const recruits = (availableCrew ?? []).filter((r) => r.expiresDay > player.day);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Crew"
          subtitle="Assignments · loyalty · payroll"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Empire" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Payroll" amount={formatMoney(payroll)} tone="amber" icon="💸" />
        <MoneyCard label="Active Crew" amount={String(getHiredCrewCount(gameState))} tone="purple" icon="☷" />
      </View>

      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Empire Crew"
        message="Assign roles for income, intel, heat control, and protection. Pay on time — unpaid crew crack under stress."
        tone="purple"
      />

      <SectionCard title="Your Crew" subtitle={`${active.length} active · tap for detail`}>
        {active.length === 0 ? (
          <EmptyState
            icon="☷"
            title="No crew yet"
            message="Recruits appear when you travel districts. Hire runners, lookouts, and specialists to grow your empire."
          />
        ) : (
          active.map((member) => (
            <EmpireCrewCard
              key={member.id}
              member={member}
              onPress={() => navigation.navigate('CrewDetail', { crewId: member.id })}
            />
          ))
        )}
      </SectionCard>

      <SectionCard title="Recruits" subtitle="Local area only">
        {recruits.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No recruits here"
            message="Move districts or advance days to refresh local talent."
          />
        ) : (
          recruits.map((r) => (
            <View key={r.id} style={styles.recruitCard}>
              <View style={styles.recruitHeader}>
                <Text style={styles.recruitName}>{r.name}</Text>
                <Text style={styles.recruitCost}>{formatMoney(r.hireCost)}</Text>
              </View>
              <Text style={styles.recruitRole}>{CREW_ROLE_LABELS[r.role]}</Text>
              <Text style={styles.recruitMeta}>
                Skill {r.skill} · ${r.salaryPerDay}/day · Expires day {r.expiresDay}
              </Text>
              <GameButton
                label={`Hire ${r.name}`}
                size="sm"
                disabled={player.isGameOver || player.cash < r.hireCost}
                onPress={() => hireCrew(r.id)}
                style={styles.hireBtn}
              />
            </View>
          ))
        )}
      </SectionCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  recruitCard: {
    backgroundColor: palette.bgCard,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recruitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recruitName: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800' },
  recruitCost: { color: palette.neon, fontSize: typography.subtitle, fontWeight: '800' },
  recruitRole: { color: palette.purpleBright, fontSize: typography.caption, fontWeight: '700', marginTop: 4 },
  recruitMeta: { color: palette.textSecondary, fontSize: typography.caption, marginTop: 4 },
  hireBtn: { marginTop: spacing.sm, marginBottom: 0 },
});
