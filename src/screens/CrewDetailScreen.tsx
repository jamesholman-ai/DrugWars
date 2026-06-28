import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { AppShell, ScreenHeader, SectionCard } from '../components/ui';
import { EmpireCrewCard, EmpireEventTimeline, StatBar } from '../components/premium';
import { useGame } from '../game/GameContext';
import { CREW_ROLE_LABELS } from '../game/crewBonuses';
import { getCrewMember } from '../game/crewManagementSystem';
import { getCrewPersonalityLine } from '../game/empireFlavorText';
import {
  ALL_CREW_ASSIGNMENTS,
  CREW_ASSIGNMENT_DESCRIPTIONS,
  CREW_ASSIGNMENT_LABELS,
} from '../data/empireCatalog';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CrewDetail'>;

export function CrewDetailScreen({ navigation, route }: Props) {
  const { gameState, assignCrew, fireCrew } = useGame();
  const { crewId } = route.params;

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const member = getCrewMember(gameState, crewId);
  const { player } = gameState;
  const rank = getCurrentRank(gameState);

  if (!member) {
    return (
      <AppShell header={<ScreenHeader title="Crew Member" day={player.day} />}>
        <Text style={styles.empty}>Crew member not found.</Text>
        <GameButton label="Back to Crew" onPress={() => navigation.goBack()} />
      </AppShell>
    );
  }

  const simpleAssignments = ALL_CREW_ASSIGNMENTS.filter(
    (a) => !['manage_business', 'guard_property'].includes(a)
  );

  return (
    <AppShell
      header={
        <ScreenHeader
          title={member.name}
          subtitle={CREW_ROLE_LABELS[member.role]}
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
    >
      <ActionMessage message={gameState.lastMessage} />
      <EmpireCrewCard member={member} />

      <SectionCard title="Relationship" tone="purple">
        <Text style={styles.personality}>{getCrewPersonalityLine(member)}</Text>
        <StatBar label="Relationship" value={member.relationshipLevel ?? 50} color={palette.purpleBright} />
        {member.personalGoal ? (
          <Text style={styles.goal}>Goal: {member.personalGoal}</Text>
        ) : null}
        <Text style={styles.traits}>{member.riskTraits.join(' · ')}</Text>
      </SectionCard>

      <SectionCard title="Assignment" subtitle={CREW_ASSIGNMENT_LABELS[member.currentAssignment ?? 'idle']}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {simpleAssignments.map((assignment) => (
            <GameButton
              key={assignment}
              label={CREW_ASSIGNMENT_LABELS[assignment]}
              size="sm"
              variant={member.currentAssignment === assignment ? 'primary' : 'secondary'}
              onPress={() => assignCrew(crewId, assignment)}
              style={styles.chip}
            />
          ))}
        </ScrollView>
        <Text style={styles.help}>
          {CREW_ASSIGNMENT_DESCRIPTIONS[member.currentAssignment ?? 'idle']}
        </Text>
        <Text style={styles.help}>
          Assign managers and guards from Business or Property detail screens.
        </Text>
      </SectionCard>

      <SectionCard title="Recent Events">
        <EmpireEventTimeline events={member.recentEvents ?? []} />
      </SectionCard>

      <GameButton label="Fire Crew Member" variant="ghost" onPress={() => fireCrew(crewId)} />
      <GameButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  empty: { color: palette.textMuted, marginBottom: spacing.md },
  goal: { color: palette.textSecondary, fontSize: typography.caption, marginTop: spacing.sm },
  personality: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 20,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  traits: { color: palette.textMuted, fontSize: typography.caption, marginTop: spacing.xs },
  chipRow: { marginBottom: spacing.sm },
  chip: { marginRight: spacing.xs, marginBottom: spacing.xs },
  help: { color: palette.textMuted, fontSize: typography.caption, lineHeight: 16, marginTop: spacing.xs },
});
