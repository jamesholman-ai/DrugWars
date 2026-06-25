import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, ScreenHeader, SectionCard } from '../components/ui';
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
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Missions'>;
type Tab = 'story' | 'active' | 'daily' | 'completed';

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
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Progress" />}
    >
      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Objectives"
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
              {t.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'story' ? (
        <SectionCard title="Story Arc" subtitle={arcLabel}>
          {storyComplete ? (
            <>
              <Text style={styles.empty}>Empire Builder arc complete.</Text>
              <Text style={styles.subNote}>
                Continue growing your empire — rank up, expand cities, and stack businesses.
              </Text>
              <Text style={styles.subNote}>More story content coming.</Text>
            </>
          ) : storyMission ? (
            <MissionCard
              title={MISSION_MAP[storyMission.id]?.title ?? storyMission.id}
              description={MISSION_MAP[storyMission.id]?.description ?? ''}
              progress={getMissionProgressWidgetText(gameState, storyMission)}
              reward={formatMissionRewardSummary(MISSION_MAP[storyMission.id]?.rewards ?? {})}
            />
          ) : (
            <Text style={styles.empty}>No active story mission. Arc may be complete.</Text>
          )}
          {storyChainMissions.length > 1 ? (
            <Text style={styles.subNote}>
              {storyChainMissions.length} objective(s) in this arc.
            </Text>
          ) : null}
        </SectionCard>
      ) : null}

      {tab === 'active' ? (
        <SectionCard title="Active" subtitle={`${(activeMissions ?? []).length} mission(s)`}>
          {(activeMissions ?? []).length === 0 ? (
            <Text style={styles.empty}>No active missions.</Text>
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
        <SectionCard title="Daily Objectives" subtitle={`Day ${player.day}`}>
          {todaysDaily.length === 0 ? (
            <Text style={styles.empty}>Daily objectives refresh when the day advances.</Text>
          ) : (
            todaysDaily.map((obj) => {
              const done = obj.progress >= obj.target;
              const claimKey = `daily:${obj.id}`;
              const claiming = isClaimingReward(claimKey);
              return (
                <View key={obj.id} style={styles.card}>
                  <Text style={styles.name}>{obj.title}</Text>
                  <Text style={styles.desc}>{obj.description}</Text>
                  <Text style={styles.meta}>
                    Progress {getDailyProgressLabel(obj)} · {formatMissionRewardSummary(obj.rewards)}
                  </Text>
                  {obj.claimed ? (
                    <Text style={styles.claimed}>CLAIMED</Text>
                  ) : done ? (
                    <GameButton
                      label={claiming ? 'CLAIMING…' : 'CLAIM REWARD'}
                      size="sm"
                      onPress={() => claimDailyObjective(obj.id)}
                      disabled={claiming}
                      style={styles.btn}
                    />
                  ) : null}
                </View>
              );
            })
          )}
        </SectionCard>
      ) : null}

      {tab === 'completed' ? (
        <>
          <SectionCard title="Claim Rewards" subtitle={`${claimableCompleted.length} pending`}>
            {claimableCompleted.length === 0 ? (
              <Text style={styles.empty}>Nothing to claim.</Text>
            ) : (
              claimableCompleted.map((m) => {
                const def = MISSION_MAP[m.id];
                if (!def) return null;
                const claimKey = `mission:${m.id}`;
                const claiming = isClaimingReward(claimKey);
                return (
                  <View key={m.id} style={styles.card}>
                    <Text style={styles.name}>{def.title}</Text>
                    <Text style={styles.meta}>{formatMissionRewardSummary(def.rewards)}</Text>
                    <GameButton
                      label={claiming ? 'CLAIMING…' : 'CLAIM'}
                      size="sm"
                      onPress={() => claimMissionReward(m.id)}
                      disabled={claiming}
                      style={styles.btn}
                    />
                  </View>
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

function MissionCard({
  title,
  description,
  progress,
  reward,
}: {
  title: string;
  description: string;
  progress: string;
  reward: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {progress ? <Text style={styles.meta}>Progress: {progress}</Text> : null}
      <Text style={styles.meta}>Reward: {reward}</Text>
    </View>
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
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: palette.neon,
    backgroundColor: palette.neonSoft,
  },
  tabText: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: palette.neon,
  },
  empty: { color: palette.textMuted, fontSize: 12 },
  subNote: { color: palette.textMuted, fontSize: 10, marginTop: spacing.sm },
  card: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  name: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  desc: { color: palette.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 },
  meta: { color: palette.textMuted, fontSize: 10, marginTop: 4 },
  claimed: { color: palette.neon, fontSize: 10, fontWeight: '800', marginTop: 6 },
  historyLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
