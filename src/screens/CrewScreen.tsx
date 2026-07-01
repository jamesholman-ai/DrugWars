import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, FilterChips, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, EmpireCrewCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { CREW_ROLE_LABELS } from '../game/crewBonuses';
import { getDailyPayroll, getHiredCrewCount } from '../game/crewBonuses';
import { getRankBenefits, getRankBenefitsForState, getMaxHiredCrew } from '../data/rankBenefits';
import { getNextRank, getCurrentRank } from '../game/progression';
import {
  canHireCrewRecruit,
  filterCrewRecruitsByChip,
  formatBusinessTierSummary,
  getCrewRecruitLockHints,
  getCrewQualityTierLabel,
  meetsCrewRecruitUnlock,
} from '../game/unlockHints';
import { getAreaLabel } from '../data/locations';
import { CrewRole } from '../types/crew';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Crew'>;
type CrewFilter = 'all' | 'affordable' | 'locked' | 'hired' | 'role';

const CREW_FILTERS: { id: CrewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'affordable', label: 'Affordable' },
  { id: 'locked', label: 'Locked' },
  { id: 'hired', label: 'Hired' },
  { id: 'role', label: 'Role' },
];

const ROLE_FILTERS: { id: CrewRole | 'all'; label: string }[] = [
  { id: 'all', label: 'All Roles' },
  { id: 'runner', label: 'Runner' },
  { id: 'lookout', label: 'Lookout' },
  { id: 'enforcer', label: 'Enforcer' },
  { id: 'smuggler', label: 'Smuggler' },
  { id: 'dealer', label: 'Dealer' },
  { id: 'fixer', label: 'Fixer' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'supplier_scout', label: 'Scout' },
];

export function CrewScreen({ navigation }: Props) {
  const { gameState, hireCrew } = useGame();
  const [filter, setFilter] = useState<CrewFilter>('all');
  const [roleFilter, setRoleFilter] = useState<CrewRole | 'all'>('all');

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, availableCrew, hiredCrew } = gameState;
  const rank = getCurrentRank(gameState);
  const nextRank = getNextRank(gameState.progression.rankId);
  const rankBenefits = getRankBenefitsForState(gameState);
  const tierSummary = formatBusinessTierSummary(gameState);
  const nextBenefits = nextRank ? getRankBenefits(nextRank.id) : null;
  const payroll = getDailyPayroll(gameState);
  const active = (hiredCrew ?? []).filter((c) => c.status === 'hired');
  const maxSlots = getMaxHiredCrew(gameState);
  const allRecruits = (availableCrew ?? []).filter((r) => r.expiresDay > player.day);
  const recruits = useMemo(() => {
    const role = filter === 'role' && roleFilter !== 'all' ? roleFilter : undefined;
    return filterCrewRecruitsByChip(gameState, allRecruits, filter === 'hired' ? 'all' : filter, role);
  }, [gameState, allRecruits, filter, roleFilter]);

  const showRecruits = filter !== 'hired';
  const showHired = filter === 'all' || filter === 'hired';

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
        <MoneyCard label="Crew Slots" amount={`${active.length}/${maxSlots}`} tone="purple" icon="☷" />
      </View>

      <ActionMessage message={lastMessage} />

      <SectionCard title="Rank Access" tone="purple" subtitle={`${rank.name} · ${tierSummary.crewQualityLabel}`}>
        <Text style={styles.hintLine}>
          Crew slots: {active.length}/{maxSlots} used · recruit skill cap ~{tierSummary.crewSkillCap}
        </Text>
        {nextRank && nextBenefits ? (
          <Text style={styles.nextRankLine}>
            Next rank ({nextRank.name}): {nextBenefits.maxHiredCrew} slots · {getCrewQualityTierLabel(nextBenefits.maxCrewQualityTier)}
          </Text>
        ) : null}
      </SectionCard>

      <EventBanner
        label="Empire Crew"
        message="Assign roles for income, intel, heat control, and protection. Pay on time — unpaid crew crack under stress."
        tone="purple"
      />

      <FilterChips options={CREW_FILTERS} value={filter} onChange={setFilter} />

      {filter === 'role' ? (
        <FilterChips
          options={ROLE_FILTERS}
          value={roleFilter}
          onChange={setRoleFilter}
          style={styles.roleFilters}
        />
      ) : null}

      {showHired ? (
        <SectionCard title="Your Crew" subtitle={`${active.length}/${maxSlots} slots · tap for detail`}>
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
      ) : null}

      {showRecruits ? (
        <SectionCard title="Recruits" subtitle={`${recruits.length} of ${allRecruits.length} local`}>
          {recruits.length === 0 ? (
            <EmptyState
              icon="📋"
              title={filter === 'all' ? 'No recruits here' : 'No matches'}
              message={
                filter === 'all'
                  ? 'Move districts or advance days to refresh local talent.'
                  : 'Try another filter or travel to refresh listings.'
              }
            />
          ) : (
            recruits.map((r) => {
              const lockHints = getCrewRecruitLockHints(gameState, r);
              const canHire = canHireCrewRecruit(gameState, r);
              const rankLocked = !meetsCrewRecruitUnlock(gameState, r);

              return (
                <View key={r.id} style={styles.recruitCard}>
                  <View style={styles.recruitHeader}>
                    <Text style={styles.recruitName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.recruitCost}>{formatMoney(r.hireCost)}</Text>
                  </View>
                  <Text style={styles.recruitRole}>{CREW_ROLE_LABELS[r.role]}</Text>
                  {r.specialty ? (
                    <Text style={styles.recruitSpecialty} numberOfLines={1}>{r.specialty}</Text>
                  ) : null}
                  {r.personalityLine ? (
                    <Text style={styles.recruitPersonality} numberOfLines={2}>{r.personalityLine}</Text>
                  ) : null}
                  <Text style={styles.recruitMeta}>
                    Skill {r.skill} · ${r.salaryPerDay}/day · Expires day {r.expiresDay}
                  </Text>
                  {lockHints.length > 0 ? (
                    <View style={styles.lockBox}>
                      {lockHints.map((hint) => (
                        <Text key={hint} style={styles.lockHint} numberOfLines={2}>
                          · {hint}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <GameButton
                    label={rankLocked ? 'Rank locked' : canHire ? `Hire ${r.name.split(' ')[0]}` : 'Cannot hire'}
                    size="sm"
                    disabled={player.isGameOver || !canHire}
                    onPress={() => hireCrew(r.id)}
                    style={styles.hireBtn}
                  />
                </View>
              );
            })
          )}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  hintLine: { color: palette.textSecondary, fontSize: 11, lineHeight: 17 },
  nextRankLine: { color: palette.amber, fontSize: 11, lineHeight: 17, marginTop: spacing.xs, fontWeight: '600' },
  roleFilters: { marginBottom: spacing.xs, paddingHorizontal: spacing.sm },
  recruitCard: {
    backgroundColor: palette.bgCard,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recruitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  recruitName: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800', flex: 1 },
  recruitCost: { color: palette.neon, fontSize: typography.subtitle, fontWeight: '800' },
  recruitRole: { color: palette.purpleBright, fontSize: typography.caption, fontWeight: '700', marginTop: 4 },
  recruitSpecialty: { color: palette.textMuted, fontSize: typography.caption, marginTop: 2 },
  recruitPersonality: { color: palette.textSecondary, fontSize: typography.caption, marginTop: 4, lineHeight: 16 },
  recruitMeta: { color: palette.textSecondary, fontSize: typography.caption, marginTop: 4 },
  lockBox: { marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: palette.border },
  lockHint: { color: palette.danger, fontSize: typography.caption, fontWeight: '600', lineHeight: 17 },
  hireBtn: { marginTop: spacing.sm, marginBottom: 0 },
});
