import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameEvent } from '../types/events';
import { fonts, palette, radius, shadows, spacing } from '../theme/theme';

interface EventModalProps {
  event: GameEvent | null;
  onChoice: (choiceId: string) => void;
}

function attitudeLabel(attitude: number): string {
  if (attitude >= 40) return 'FRIENDLY';
  if (attitude >= 10) return 'NEUTRAL';
  if (attitude >= -15) return 'WARY';
  return 'HOSTILE';
}

function isPoliceEvent(eventType: string): boolean {
  return eventType.includes('police') || eventType.includes('raid');
}

function buildImpactTags(event: GameEvent): { label: string; tone: 'red' | 'purple' | 'green' }[] {
  const tags: { label: string; tone: 'red' | 'purple' | 'green' }[] = [];
  const ctx = event.context;

  if (ctx.priceMultiplier != null) {
    const pct = Math.round((ctx.priceMultiplier - 1) * 100);
    tags.push({
      label: pct >= 0 ? `PRICES +${pct}%` : `PRICES ${pct}%`,
      tone: pct >= 0 ? 'green' : 'red',
    });
  }
  if (ctx.amount != null && ctx.amount !== 0) {
    tags.push({
      label: ctx.amount > 0 ? `CASH +$${ctx.amount}` : `CASH −$${Math.abs(ctx.amount)}`,
      tone: ctx.amount > 0 ? 'green' : 'red',
    });
  }
  if (ctx.quantity != null) {
    tags.push({ label: `QTY ${ctx.quantity}`, tone: 'purple' });
  }
  if (isPoliceEvent(event.eventType)) {
    tags.push({ label: 'HEAT +20%', tone: 'red' });
    tags.push({ label: 'SUPPLY −30%', tone: 'red' });
  }

  return tags.slice(0, 4);
}

const toneColors = {
  red: { bg: palette.dangerGlow, border: palette.danger, text: palette.danger },
  purple: { bg: palette.purpleGlow, border: palette.purple, text: palette.purpleBright },
  green: { bg: palette.neonSoft, border: palette.neonDim, text: palette.neon },
};

export function EventModal({ event, onChoice }: EventModalProps) {
  const impacts = useMemo(() => (event ? buildImpactTags(event) : []), [event]);
  const dramatic = event ? isPoliceEvent(event.eventType) : false;

  return (
    <Modal visible={event !== null} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, dramatic && styles.boxDramatic]}>
          <View style={[styles.heroBand, dramatic ? styles.heroPolice : styles.heroDefault]}>
            <View style={styles.heroGlow} />
            <Text style={styles.tag}>{dramatic ? 'WORLD EVENT' : 'STREET EVENT'}</Text>
            <Text style={styles.heroTitle}>{event?.title}</Text>
          </View>

          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroEmoji}>{dramatic ? '🚔' : '⚡'}</Text>
            <View style={styles.heroGradientLine} />
          </View>

          <ScrollView style={styles.bodyScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>{event?.description}</Text>

            {impacts.length > 0 ? (
              <View style={styles.impactRow}>
                {impacts.map((impact) => {
                  const c = toneColors[impact.tone];
                  return (
                    <View
                      key={impact.label}
                      style={[styles.impactBadge, { backgroundColor: c.bg, borderColor: c.border }]}
                    >
                      <Text style={[styles.impactText, { color: c.text }]}>{impact.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {event?.npc ? (
              <View style={styles.npcBox}>
                <View style={styles.npcHeaderRow}>
                  <Text style={styles.npcName}>{event.npc.name}</Text>
                  <Text style={styles.npcAttitude}>{attitudeLabel(event.npc.attitude)}</Text>
                </View>
                <Text style={styles.npcType}>{event.npc.type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.npcDialogue}>"{event.npc.dialogue}"</Text>
              </View>
            ) : null}

            <Text style={styles.choiceHeader}>YOUR MOVE</Text>
            {event && event.choices.length === 1 ? (
              <Pressable
                style={[styles.understoodBtn, dramatic && styles.understoodDramatic]}
                onPress={() => onChoice(event.choices[0].id)}
              >
                <Text style={styles.understoodText}>UNDERSTOOD</Text>
              </Pressable>
            ) : (
              event?.choices.map((choice) => (
                <Pressable
                  key={choice.id}
                  style={[styles.choiceBtn, dramatic && styles.choiceBtnDramatic]}
                  onPress={() => onChoice(choice.id)}
                >
                  <Text style={[styles.choiceText, dramatic && styles.choiceTextDramatic]}>
                    {choice.label}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  box: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: radius.xl,
    overflow: 'hidden',
    maxHeight: '90%',
    ...shadows.glowPurple,
  },
  boxDramatic: {
    borderColor: palette.purple,
  },
  heroBand: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  heroPolice: {
    backgroundColor: palette.purpleGlow,
    borderBottomWidth: 1,
    borderBottomColor: palette.purple,
  },
  heroDefault: {
    backgroundColor: palette.amberGlow,
    borderBottomWidth: 1,
    borderBottomColor: palette.amberDim,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.purpleBright,
    opacity: 0.8,
  },
  tag: {
    color: palette.purpleBright,
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroPlaceholder: {
    height: 100,
    backgroundColor: '#0a0a12',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  heroEmoji: {
    fontSize: 40,
    opacity: 0.9,
  },
  heroGradientLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: palette.purple,
    opacity: 0.5,
  },
  bodyScroll: {
    padding: spacing.md,
    maxHeight: 360,
  },
  description: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  impactBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 88,
    alignItems: 'center',
  },
  impactText: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  npcBox: {
    borderWidth: 1,
    borderColor: palette.borderBright,
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  npcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  npcName: {
    color: palette.info,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  npcAttitude: {
    color: palette.amber,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  npcType: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  npcDialogue: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  choiceHeader: {
    color: palette.textMuted,
    fontFamily: fonts.display,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  choiceBtn: {
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  choiceBtnDramatic: {
    borderColor: palette.purple,
    backgroundColor: palette.purpleGlow,
  },
  choiceText: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceTextDramatic: {
    color: palette.purpleBright,
  },
  understoodBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neon,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  understoodDramatic: {
    backgroundColor: palette.purpleGlow,
    borderColor: palette.purple,
  },
  understoodText: {
    color: palette.purpleBright,
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
