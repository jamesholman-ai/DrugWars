import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge } from './Badge';
import { Card } from './Card';
import { StatBar } from './StatBar';
import {
  getNpcMemoryNotes,
  getRelationTier,
  getTrustLabel,
  NpcRelationView,
} from '../game/npcSystem';
import { useGame } from '../game/GameContext';
import { colors, fonts, spacing } from '../utils/theme';

interface NpcProfileCardProps {
  npc: NpcRelationView;
}

function typeLabel(type: string): string {
  return type.replace(/_/g, ' ').toUpperCase();
}

function toneForRelation(tone: 'ally' | 'neutral' | 'wary' | 'hostile'): 'cheap' | 'fair' | 'warn' | 'high' {
  switch (tone) {
    case 'ally':
      return 'cheap';
    case 'neutral':
      return 'fair';
    case 'wary':
      return 'warn';
    default:
      return 'high';
  }
}

export function NpcProfileCard({ npc }: NpcProfileCardProps) {
  const { gameState } = useGame();
  const tier = getRelationTier(npc.attitude);
  const memoryNotes =
    gameState != null ? getNpcMemoryNotes(npc.npcId, gameState.memoryFlags) : [];

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{npc.name}</Text>
          <Text style={styles.type}>{typeLabel(npc.type)}</Text>
        </View>
        <Badge label={tier.label} tone={toneForRelation(tier.tone)} />
      </View>

      <View style={styles.statBlock}>
        <StatBar label="Attitude" value={npc.attitude + 100} max={200} color={colors.accent} />
        <Text style={styles.statHint}>
          {npc.attitude > 0 ? '+' : ''}
          {npc.attitude}
        </Text>
      </View>

      <View style={styles.statBlock}>
        <StatBar label="Trust" value={npc.trust} max={100} color={colors.info} />
        <Text style={styles.statHint}>{getTrustLabel(npc.trust)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          Encounters: {npc.encounters}
          {npc.lastSeenDay > 0 ? ` · Last seen day ${npc.lastSeenDay}` : ''}
        </Text>
      </View>

      {memoryNotes.length > 0 ? (
        <View style={styles.memoryBlock}>
          <Text style={styles.memoryTitle}>REMEMBERS</Text>
          {memoryNotes.map((note) => (
            <Text key={note} style={styles.memoryLine}>
              · {note}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.noMemory}>No major history yet.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nameBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 16,
    fontWeight: '700',
  },
  type: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  statBlock: {
    marginBottom: spacing.sm,
  },
  statHint: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    marginTop: 2,
  },
  metaRow: {
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  memoryBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  memoryTitle: {
    color: colors.warning,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  memoryLine: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 18,
  },
  noMemory: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
