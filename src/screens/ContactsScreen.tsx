import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameNavFooter } from '../components/GameNavFooter';
import { NpcProfileCard } from '../components/NpcProfileCard';
import { AppShell, ScreenHeader, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import { getCurrentRank } from '../game/progression';
import { listNpcRelations } from '../game/npcSystem';
import { ENCOUNTER_MAP } from '../data/encounterCatalog';
import { getAreaLabel } from '../data/locations';
import { RootStackParamList } from '../types/game';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Contacts'>;

export function ContactsScreen({ navigation }: Props) {
  const { gameState } = useGame();

  useEffect(() => {
    if (!gameState) {
      navigation.replace('Home');
    }
  }, [gameState, navigation]);

  if (!gameState) {
    return null;
  }

  const contacts = listNpcRelations(gameState);
  const known = contacts.filter((c) => c.encounters > 0);
  const unknown = contacts.filter((c) => c.encounters === 0);
  const rank = getCurrentRank(gameState);
  const { player, encounterHistory } = gameState;
  const recentEncounters = (encounterHistory ?? []).slice(-6).reverse();

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Contacts"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Progress" />}
    >
      <SectionCard title="Street Network" tone="purple">
        <Text style={styles.intro}>
          Characters remember your choices. Attitude shifts with every deal, bribe, and betrayal.
          Recurring contacts appear more often as relationships deepen.
        </Text>
      </SectionCard>

      {known.length > 0 ? (
        <SectionCard title="Known Contacts" subtitle={`${known.length} active`}>
          {known.map((npc) => (
            <NpcProfileCard key={npc.npcId} npc={npc} />
          ))}
        </SectionCard>
      ) : null}

      {recentEncounters.length > 0 ? (
        <SectionCard title="Encounter History" subtitle="Recent street events">
          {recentEncounters.map((entry, index) => {
            const def = ENCOUNTER_MAP[entry.encounterId];
            return (
              <View key={`${entry.encounterId}-${entry.day}-${index}`} style={styles.historyRow}>
                <Text style={styles.historyTitle}>{def?.title ?? entry.encounterId}</Text>
                <Text style={styles.historyMeta}>
                  Day {entry.day} · {entry.outcome}
                </Text>
              </View>
            );
          })}
        </SectionCard>
      ) : null}

      {unknown.length > 0 ? (
        <SectionCard title="Not Yet Met" subtitle="Keep moving">
          {unknown.map((npc) => (
            <View key={npc.npcId} style={styles.unknownRow}>
              <Text style={styles.unknownName}>{npc.name}</Text>
              <Text style={styles.unknownType}>{npc.type.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  unknownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.xs,
  },
  unknownName: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  unknownType: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  historyRow: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  historyTitle: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
  },
  historyMeta: {
    color: palette.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
