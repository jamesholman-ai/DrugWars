import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AccentTone, accentMap, palette, radius, shadows, spacing, typography } from '../../theme/theme';

export type ActionFeedbackKind =
  | 'success'
  | 'empire'
  | 'finance'
  | 'mission'
  | 'neutral';

interface ActionFeedbackProps {
  title: string;
  message: string;
  kind?: ActionFeedbackKind;
  /** Placeholder for future sound hook */
  soundHint?: string;
}

function kindToTone(kind: ActionFeedbackKind): AccentTone {
  if (kind === 'success' || kind === 'mission') return 'green';
  if (kind === 'empire') return 'purple';
  if (kind === 'finance') return 'amber';
  return 'cyan';
}

export function ActionFeedback({
  title,
  message,
  kind = 'neutral',
  soundHint = '🔔 sfx hook',
}: ActionFeedbackProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const tone = accentMap[kindToTone(kind)];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[styles.wrap, { borderColor: tone.border, backgroundColor: tone.bg }]}>
      <Animated.View style={[styles.glow, { opacity: pulse, backgroundColor: tone.border }]} />
      <Text style={[styles.title, { color: tone.text }]}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.soundHint}>{soundHint}</Text>
    </View>
  );
}

/** Infer feedback presentation from lastMessage text — no persisted state. */
export function inferActionFeedback(lastMessage: string | null | undefined): ActionFeedbackProps | null {
  if (!lastMessage) return null;
  const m = lastMessage.toLowerCase();
  if (m.includes('empire expanding') || m.includes('acquired') || m.includes('welcome to the organization')) {
    return { title: 'EMPIRE', message: lastMessage, kind: 'empire' };
  }
  if (m.includes('mission complete') || m.includes('reward') || m.includes('claimed')) {
    return { title: 'MISSION', message: lastMessage, kind: 'mission' };
  }
  if (m.includes('debt') || m.includes('borrow') || m.includes('payroll') || m.includes('laundered')) {
    return { title: 'FINANCE', message: lastMessage, kind: 'finance' };
  }
  if (m.includes('upgraded') || m.includes('security increased') || m.includes('purchased')) {
    return { title: 'UPGRADE', message: lastMessage, kind: 'success' };
  }
  if (lastMessage.length > 8) {
    return { title: 'UPDATE', message: lastMessage, kind: 'neutral' };
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  title: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  message: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 20,
  },
  soundHint: {
    color: palette.textMuted,
    fontSize: 8,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
