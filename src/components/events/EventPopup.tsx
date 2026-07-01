import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameState } from '../../types/game';
import { EventChoice, GameEvent } from '../../types/events';
import { enrichChoiceLocks } from '../../game/eventChoiceLocks';
import {
  buildEventImpactPreview,
  EventImpactPreview,
  getEventArt,
  getEventCategoryBadge,
} from '../../game/eventPresentation';
import { EventResultChip, EventResultSummary } from '../../game/eventResultSummary';
import { NeonButton } from '../premium/NeonButton';
import { fonts, glass, palette, radius, shadows, spacing, typography } from '../../theme/theme';

export type EventPopupPhase = 'choosing' | 'result';

interface EventPopupProps {
  visible: boolean;
  phase: EventPopupPhase;
  event: GameEvent | null;
  gameState: GameState | null;
  resolvedResult?: EventResultSummary | null;
  onChoose: (choiceId: string) => EventResultSummary | null;
  onConfirm: () => void;
}

const CHIP_COLOR: Record<EventResultChip['tone'], string> = {
  green: palette.neon,
  red: palette.danger,
  gray: palette.textSecondary,
  blue: palette.cyan,
  gold: palette.gold,
};

const IMPACT_COLOR = {
  green: palette.neon,
  red: palette.danger,
  purple: palette.purpleBright,
  gold: palette.gold,
  gray: palette.textSecondary,
};

function attitudeLabel(attitude: number): string {
  if (attitude >= 40) return 'FRIENDLY';
  if (attitude >= 10) return 'NEUTRAL';
  if (attitude >= -15) return 'WARY';
  return 'HOSTILE';
}

export function EventPopup({
  visible,
  phase,
  event,
  gameState,
  resolvedResult,
  onChoose,
  onConfirm,
}: EventPopupProps) {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<EventResultSummary | null>(null);
  const [awaitingResult, setAwaitingResult] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const confirmGuardRef = useRef(false);
  const sessionEventRef = useRef<GameEvent | null>(null);

  const displayEvent = event ?? sessionEventRef.current;
  const activeResult = localResult ?? resolvedResult ?? null;
  const showingResult = activeResult != null;
  const displayPhase: EventPopupPhase = showingResult ? 'result' : phase;

  useEffect(() => {
    if (event) {
      sessionEventRef.current = event;
    }
    if (!visible) {
      sessionEventRef.current = null;
      setLocalResult(null);
      setAwaitingResult(false);
      setSelectedChoiceId(null);
      setConfirmReady(false);
      confirmGuardRef.current = false;
    }
  }, [event, visible]);

  useEffect(() => {
    if (!visible) return;
    setLocalResult(null);
    setAwaitingResult(false);
    setSelectedChoiceId(null);
    setConfirmReady(false);
    confirmGuardRef.current = false;
  }, [displayEvent?.id, visible]);

  useEffect(() => {
    if (resolvedResult && !localResult) {
      setLocalResult(resolvedResult);
      setAwaitingResult(false);
    }
  }, [resolvedResult, localResult, displayEvent?.id]);

  useEffect(() => {
    if (!showingResult) {
      setConfirmReady(false);
      confirmGuardRef.current = false;
      return;
    }

    setConfirmReady(false);
    confirmGuardRef.current = true;
    const timer = setTimeout(() => {
      confirmGuardRef.current = false;
      setConfirmReady(true);
    }, 750);

    return () => clearTimeout(timer);
  }, [showingResult, displayEvent?.id, activeResult?.title]);

  const choices = useMemo(() => {
    if (!displayEvent || !gameState || displayPhase !== 'choosing') return [];
    return enrichChoiceLocks(gameState, displayEvent);
  }, [displayEvent, gameState, displayPhase]);

  const impacts = useMemo(
    () => (displayEvent ? buildEventImpactPreview(displayEvent) : []),
    [displayEvent]
  );
  const category = displayEvent ? getEventCategoryBadge(displayEvent) : 'EVENT';
  const art = displayEvent
    ? getEventArt(displayEvent, gameState?.player.currentCityId)
    : { source: null };

  if (!visible || !displayEvent) return null;

  const choosingLocked = selectedChoiceId != null || showingResult || awaitingResult;
  const singleContinue = displayEvent.choices.length === 1 && displayPhase === 'choosing';

  const handleChoice = (choiceId: string, lockedReason?: string) => {
    if (choosingLocked || lockedReason) return;
    setSelectedChoiceId(choiceId);
    setAwaitingResult(true);
    const result = onChoose(choiceId);
    if (result) {
      setLocalResult(result);
    } else {
      setSelectedChoiceId(null);
    }
    setAwaitingResult(false);
  };

  const handleConfirm = () => {
    if (!confirmReady || confirmGuardRef.current) return;
    setLocalResult(null);
    setAwaitingResult(false);
    setSelectedChoiceId(null);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <LinearGradient
            colors={[glass.sheenTop, glass.sheenBottom]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.imageHeader}>
            {art.source ? (
              <Image source={art.source} style={styles.headerImage} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={['#120a1e', '#1a1030', '#0a0612']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(5,6,10,0.92)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.headerContent}>
              <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
                {displayPhase === 'result' ? (
                  <View style={[styles.categoryBadge, styles.resultBadge]}>
                    <Text style={styles.categoryText}>RESULT</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.title}>{displayEvent.title.toUpperCase()}</Text>
            </View>
          </View>

          <ScrollView style={styles.body} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {displayPhase === 'choosing' ? (
              <>
                <Text style={styles.description}>{displayEvent.description}</Text>

                {impacts.length > 0 ? (
                  <View style={styles.impactRow}>
                    {impacts.map((impact: EventImpactPreview) => (
                      <View key={impact.label} style={styles.impactChip}>
                        <Text style={[styles.impactText, { color: IMPACT_COLOR[impact.tone] }]}>
                          {impact.label.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {displayEvent.npc ? (
                  <View style={styles.npcBox}>
                    <View style={styles.npcHeaderRow}>
                      <Text style={styles.npcName}>{displayEvent.npc.name}</Text>
                      <Text style={styles.npcAttitude}>{attitudeLabel(displayEvent.npc.attitude)}</Text>
                    </View>
                    <Text style={styles.npcType}>{displayEvent.npc.type.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.npcDialogue}>&ldquo;{displayEvent.npc.dialogue}&rdquo;</Text>
                  </View>
                ) : null}

                <Text style={styles.choiceHeader}>YOUR MOVE</Text>
                {singleContinue ? (
                  <NeonButton
                    label="Continue"
                    size="lg"
                    onPress={() => handleChoice(displayEvent.choices[0].id)}
                    disabled={choosingLocked}
                  />
                ) : awaitingResult ? (
                  <View style={styles.resolvingBox}>
                    <Text style={styles.resolvingText}>Resolving your move...</Text>
                  </View>
                ) : (
                  choices.map((choice: EventChoice) => {
                    const locked = choice.lockedReason;
                    const isSelected = selectedChoiceId === choice.id;
                    return (
                      <Pressable
                        key={choice.id}
                        style={[
                          styles.choiceBtn,
                          locked && styles.choiceLocked,
                          isSelected && styles.choiceSelected,
                        ]}
                        onPress={() => handleChoice(choice.id, locked)}
                        disabled={choosingLocked || !!locked}
                        accessibilityState={{ disabled: choosingLocked || !!locked }}
                      >
                        <Text style={[styles.choiceText, locked && styles.choiceTextLocked]}>
                          {choice.label}
                        </Text>
                        {locked ? <Text style={styles.lockReason}>{locked}</Text> : null}
                      </Pressable>
                    );
                  })
                )}
              </>
            ) : (
              <>
                <Text style={styles.resultTitle}>
                  {activeResult?.title ?? `${displayEvent.title} — Outcome`}
                </Text>
                <Text style={styles.story}>
                  {activeResult?.story ?? activeResult?.message ?? 'Event resolved.'}
                </Text>

                {activeResult?.chips && activeResult.chips.length > 0 ? (
                  <View style={styles.deltaWrap}>
                    {activeResult.chips.map((chip) => (
                      <View key={chip.label} style={styles.deltaChip}>
                        <Text style={[styles.deltaText, { color: CHIP_COLOR[chip.tone] }]}>
                          {chip.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {activeResult?.financeLogMessage ? (
                  <Text style={styles.financeNote}>
                    Logged: {activeResult.financeLogMessage}
                  </Text>
                ) : null}

                <View
                  style={styles.confirmWrap}
                  pointerEvents={confirmReady ? 'auto' : 'none'}
                >
                  <NeonButton
                    label="Continue"
                    size="lg"
                    onPress={handleConfirm}
                    disabled={!confirmReady}
                  />
                </View>
              </>
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
    maxHeight: '92%',
    ...shadows.glowPurple,
  },
  imageHeader: {
    height: 160,
    justifyContent: 'flex-end',
  },
  headerImage: {
    ...StyleSheet.absoluteFill,
  },
  headerContent: {
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    borderWidth: 1,
    borderColor: palette.borderBright,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  resultBadge: {
    borderColor: palette.neonDim,
    backgroundColor: palette.neonSoft,
  },
  categoryText: {
    color: palette.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 1,
  },
  body: {
    padding: spacing.md,
    maxHeight: 420,
  },
  description: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  impactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  impactChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: palette.bgElevated,
  },
  impactText: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.4,
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
    fontSize: typography.body,
    fontWeight: '700',
  },
  npcAttitude: {
    color: palette.amber,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  npcType: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  npcDialogue: {
    color: palette.text,
    fontSize: typography.caption,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  choiceHeader: {
    color: palette.textMuted,
    fontFamily: fonts.display,
    fontSize: typography.caption,
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
  choiceLocked: {
    opacity: 0.45,
  },
  choiceSelected: {
    borderColor: palette.neon,
    backgroundColor: palette.neonSoft,
  },
  choiceText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceTextLocked: {
    color: palette.textSecondary,
  },
  lockReason: {
    color: palette.amber,
    fontSize: typography.tiny,
    marginTop: 4,
    textAlign: 'center',
  },
  resolvingBox: {
    borderWidth: 1,
    borderColor: palette.borderBright,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    backgroundColor: palette.bgElevated,
  },
  resolvingText: {
    color: palette.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  resultTitle: {
    color: palette.neon,
    fontSize: typography.subtitle,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  story: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  resultMessage: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  deltaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  deltaChip: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: palette.bgElevated,
  },
  deltaText: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
  financeNote: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  confirmWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
