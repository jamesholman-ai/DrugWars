import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TUTORIAL_STEPS, TUTORIAL_STEP_COUNT } from '../data/tutorial';
import { fonts, palette, radius, spacing } from '../theme/theme';

interface TutorialOverlayProps {
  visible: boolean;
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({ visible, step, onNext, onSkip }: TutorialOverlayProps) {
  const def = TUTORIAL_STEPS[step];
  if (!visible || !def) return null;

  const isLast = step >= TUTORIAL_STEP_COUNT - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.kicker}>
            QUICK START {step + 1}/{TUTORIAL_STEP_COUNT}
          </Text>
          <Text style={styles.title}>{def.title}</Text>
          <Text style={styles.body}>{def.body}</Text>
          {def.hint ? <Text style={styles.hint}>{def.hint}</Text> : null}

          <View style={styles.dots}>
            {TUTORIAL_STEPS.map((s, i) => (
              <View key={s.id} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip Tutorial</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={onNext}>
              <Text style={styles.nextText}>{isLast ? 'Start Hustling' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.neonDim,
    padding: spacing.lg,
  },
  kicker: {
    color: palette.amber,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  title: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  body: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  hint: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.border,
  },
  dotActive: {
    backgroundColor: palette.neon,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neon,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  nextText: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
