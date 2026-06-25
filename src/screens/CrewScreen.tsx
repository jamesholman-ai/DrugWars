import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import { CREW_ROLE_LABELS } from '../game/crewBonuses';
import { getDailyPayroll, getHiredCrewCount } from '../game/crewBonuses';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Crew'>;

export function CrewScreen({ navigation }: Props) {
  const { gameState, hireCrew, fireCrew } = useGame();

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
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Crew" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Payroll" amount={formatMoney(payroll)} tone="amber" icon="💸" />
        <MoneyCard label="Crew" amount={String(getHiredCrewCount(gameState))} tone="purple" icon="☷" />
      </View>

      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Crew Rules"
        message="Salaries charge on day advance. Unpaid crew lose loyalty — betrayal and theft possible. Stay or travel to find recruits."
        tone="purple"
      />

      <SectionCard title="Hired Crew" subtitle={`${active.length} active`}>
        {active.length === 0 ? (
          <Text style={styles.empty}>No crew yet. Check recruits below.</Text>
        ) : (
          active.map((member) => (
            <View key={member.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.role}>{CREW_ROLE_LABELS[member.role]}</Text>
              </View>
              <Text style={styles.meta}>
                Skill {member.skill} · Loyalty {member.loyalty} · ${member.salaryPerDay}/day
              </Text>
              <Text style={styles.traits} numberOfLines={1}>
                {member.riskTraits.join(' · ')}
              </Text>
              <GameButton
                label="FIRE"
                size="sm"
                variant="ghost"
                onPress={() => fireCrew(member.id)}
                style={styles.fireBtn}
              />
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard title="Recruits" subtitle="Local area only">
        {recruits.length === 0 ? (
          <Text style={styles.empty}>No recruits here. Move districts or advance days.</Text>
        ) : (
          recruits.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.cost}>{formatMoney(r.hireCost)}</Text>
              </View>
              <Text style={styles.role}>{CREW_ROLE_LABELS[r.role]}</Text>
              <Text style={styles.meta}>
                Skill {r.skill} · ${r.salaryPerDay}/day · Expires day {r.expiresDay}
              </Text>
              <GameButton
                label={`HIRE ${r.name.toUpperCase()}`}
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
  empty: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  role: { color: palette.purpleBright, fontSize: 10, fontWeight: '700', marginTop: 2 },
  cost: { color: palette.neon, fontSize: 14, fontWeight: '800' },
  meta: { color: palette.textMuted, fontSize: 10, marginTop: 4 },
  traits: { color: palette.textSecondary, fontSize: 9, marginTop: 2 },
  fireBtn: { marginTop: spacing.sm, marginBottom: 0 },
  hireBtn: { marginTop: spacing.sm, marginBottom: 0 },
});
