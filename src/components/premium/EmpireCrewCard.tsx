import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HiredCrewMember } from '../../types/crew';
import { CREW_ROLE_ICONS, CREW_ASSIGNMENT_LABELS } from '../../data/empireCatalog';
import { CREW_ROLE_LABELS } from '../../game/crewBonuses';
import { StatBar } from './StatBar';
import { RiskBadge } from './RiskBadge';
import { GlassCard } from './GlassCard';
import { PressableCard } from './PressableCard';
import { palette, spacing, typography } from '../../theme/theme';

interface EmpireCrewCardProps {
  member: HiredCrewMember;
  onPress?: () => void;
}

function EmpireCrewCardInner({ member, onPress }: EmpireCrewCardProps) {
  const assignment = member.currentAssignment ?? 'idle';

  const card = (
    <GlassCard tone="purple" elevated style={styles.cardInner}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{CREW_ROLE_ICONS[member.role]}</Text>
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.role}>{CREW_ROLE_LABELS[member.role]}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.assignmentBadge}>
              <Text style={styles.assignment}>{CREW_ASSIGNMENT_LABELS[assignment]}</Text>
            </View>
            <RiskBadge level={member.riskProfile ?? 'medium'} />
          </View>
        </View>
      </View>
      <StatBar label="Skill" value={member.skill} color={palette.purpleBright} />
      <StatBar label="Loyalty" value={member.loyalty} color={palette.neon} />
      <StatBar label="Morale" value={member.morale ?? 70} color={palette.cyan} />
      <StatBar label="Stress" value={member.stress ?? 20} color={palette.amber} dangerAbove={75} />
      <Text style={styles.meta}>
        ${member.salaryPerDay}/day · {member.specialty ?? member.riskTraits[0] ?? 'Street ops'}
      </Text>
    </GlassCard>
  );

  if (!onPress) return card;

  return (
    <PressableCard onPress={onPress} accessibilityLabel={`Crew member ${member.name}`}>
      {card}
    </PressableCard>
  );
}

export const EmpireCrewCard = memo(EmpireCrewCardInner);

const styles = StyleSheet.create({
  cardInner: { marginBottom: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24 },
  headerBody: { flex: 1 },
  name: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800' },
  role: { color: palette.purpleBright, fontSize: typography.caption, fontWeight: '700', marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  assignmentBadge: {
    backgroundColor: palette.bgElevated,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: palette.border,
  },
  assignment: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  meta: { color: palette.textSecondary, fontSize: typography.caption, marginTop: spacing.sm },
});
