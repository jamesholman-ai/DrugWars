import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, MissionCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { STORY_ARC_LABELS, StoryArcId, MISSION_MAP } from '../data/missions';
import {
  getCurrentStoryMission,
  getDailyProgressLabel,
  getMissionProgressWidgetText,
  isStoryCampaignComplete,
  formatMissionRewardSummary,
} from '../game/missionSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, radius, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Missions'>;
type Tab = 'story' | 'active' | 'daily' | 'completed';

const TAB_LABELS: Record<Tab, string> = {
  story: 'Story',
  active: 'Active',
  daily: 'Daily',
  completed: 'Done',
};

export function MissionsScreen({ navigation }: Props) {
  const { gameState, claimMissionReward, claimDailyObjective, isClaimingReward } = useGame();
  const [tab, setTab] = useState<Tab>('story');

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  const storyMission = useMemo(
    () => (gameState ? getCurrentStoryMission(gameState) : undefined),
    [gameState]
  );

  if (!gameState) return null;

  const { player, lastMessage, activeMissions, completedMissions, dailyObjectives, currentStoryArc } =
    gameState;
  const rank = getCurrentRank(gameState);
  const arcLabel = currentStoryArc
    ? STORY_ARC_LABELS[currentStoryArc as StoryArcId] ?? currentStoryArc
    : 'Complete';
  const storyComplete = isStoryCampaignComplete(gameState);

  const storyChainMissions = (activeMissions ?? []).filter((m) => {
    const def = MISSION_MAP[m.id];
    return def?.chainId === currentStoryArc;
  });

  const sideActive = (activeMissions ?? []).filter((m) => {
    const def = MISSION_MAP[m.id];
    return !def?.chainId || def.chainId !== currentStoryArc;
  });

  const claimableCompleted = (completedMissions ?? []).filter((m) => !m.claimed);
  const todaysDaily = (dailyObjectives ?? []).filter((o) => o.generatedDay === player.day);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Missions"
          subtitle="Objectives & rewards"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Operations" />}
    >
      <ActionMessage message={lastMessage} />

      <EventBanner
        label="How it works"
        message="Progress tracks automatically. Claim rewards once complete."
        tone="green"
      />

      <View style={styles.tabs}>
        {(['story', 'active', 'daily', 'completed'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {TAB_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'story' ? (
        <SectionCard title="Story Arc" subtitle={arcLabel} tone="purple">
          {storyComplete ? (
            <EmptyState
              icon="👑"
              title="Empire Builder complete"
              message="Continue growing your empire — rank up, expand cities, and stack businesses."
            />
          ) : storyMission ? (
            <MissionCard
              title={MISSION_MAP[storyMission.id]?.title ?? storyMission.id}
              description={MISSION_MAP[storyMission.id]?.description ?? ''}
              progress={getMissionProgressWidgetText(gameState, storyMission)}
              reward={formatMissionRewardSummary(MISSION_MAP[storyMission.id]?.rewards ?? {})}
              chainLabel={arcLabel}
            />
          ) : (
            <EmptyState title="No active story mission" message="Your arc may be complete." />
          )}
          {storyChainMissions.length > 1 ? (
            <Text style={styles.subNote}>
              {storyChainMissions.length} objectives in this arc.
            </Text>
          ) : null}
        </SectionCard>
      ) : null}

      {tab === 'active' ? (
        <SectionCard title="Active Missions" subtitle={`${(activeMissions ?? []).length} in progress`}>
          {(activeMissions ?? []).length === 0 ? (
            <EmptyState title="No active missions" message="Check story or daily tabs." />
          ) : (
            (activeMissions ?? []).map((m) => {
              const def = MISSION_MAP[m.id];
              if (!def) return null;
              return (
                <MissionCard
                  key={m.id}
                  title={def.title}
                  description={def.description}
                  progress={getMissionProgressWidgetText(gameState, m)}
                  reward={formatMissionRewardSummary(def.rewards)}
                  chainLabel={def.chainId ? STORY_ARC_LABELS[def.chainId as StoryArcId] : undefined}
                />
              );
            })
          )}
          {sideActive.length > 0 ? (
            <Text style={styles.subNote}>Includes side objectives from other arcs.</Text>
          ) : null}
        </SectionCard>
      ) : null}

      {tab === 'daily' ? (
        <SectionCard title="Daily Objectives" subtitle={`Day ${player.day}`} tone="amber">
          {todaysDaily.length === 0 ? (
            <EmptyState
              title="No dailies yet"
              message="Daily objectives refresh when the day advances."
            />
          ) : (
            todaysDaily.map((obj) => {
              const done = obj.progress >= obj.target;
              const claimKey = `daily:${obj.id}`;
              const claiming = isClaimingReward(claimKey);
              const pct = obj.target > 0 ? (obj.progress / obj.target) * 100 : 0;
              return (
                <MissionCard
                  key={obj.id}
                  title={obj.title}
                  description={obj.description}
                  progress={getDailyProgressLabel(obj)}
                  progressPct={pct}
                  reward={formatMissionRewardSummary(obj.rewards)}
                  claimed={obj.claimed}
                  canClaim={done && !obj.claimed}
                  claiming={claiming}
                  onClaim={() => claimDailyObjective(obj.id)}
                />
              );
            })
          )}
        </SectionCard>
      ) : null}

      {tab === 'completed' ? (
        <>
          <SectionCard title="Claim Rewards" subtitle={`${claimableCompleted.length} pending`} tone="green">
            {claimableCompleted.length === 0 ? (
              <EmptyState title="Nothing to claim" message="Complete missions to earn rewards." />
            ) : (
              claimableCompleted.map((m) => {
                const def = MISSION_MAP[m.id];
                if (!def) return null;
                const claimKey = `mission:${m.id}`;
                const claiming = isClaimingReward(claimKey);
                return (
                  <MissionCard
                    key={m.id}
                    title={def.title}
                    reward={formatMissionRewardSummary(def.rewards)}
                    canClaim
                    claiming={claiming}
                    onClaim={() => claimMissionReward(m.id)}
                  />
                );
              })
            )}
          </SectionCard>
          <SectionCard title="Completed History" subtitle={`${(completedMissions ?? []).length} total`}>
            {(completedMissions ?? [])
              .filter((m) => m.claimed)
              .slice(-8)
              .reverse()
              .map((m) => (
                <Text key={m.id} style={styles.historyLine}>
                  ✓ {MISSION_MAP[m.id]?.title ?? m.id}
                </Text>
              ))}
          </SectionCard>
        </>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    backgroundColor: palette.bgCard,
  },
  tabActive: {
    borderColor: palette.neon,
    backgroundColor: palette.neonSoft,
  },
  tabText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tabTextActive: {
    color: palette.neon,
  },
  subNote: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  historyLine: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginBottom: 6,
  },
});
