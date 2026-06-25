import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../utils/theme';

type BadgeTone = 'cheap' | 'high' | 'fair' | 'here' | 'warn' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, { bg: string; text: string; border: string }> = {
  cheap: { bg: colors.accentGlow, text: colors.accent, border: colors.accentDim },
  high: { bg: colors.dangerGlow, text: colors.danger, border: colors.dangerDim },
  fair: { bg: 'rgba(94, 179, 255, 0.12)', text: colors.info, border: colors.info },
  here: { bg: 'rgba(179, 136, 255, 0.12)', text: colors.purple, border: colors.purple },
  warn: { bg: 'rgba(255, 176, 32, 0.12)', text: colors.warning, border: colors.warningDim },
  neutral: { bg: colors.surfaceLight, text: colors.textDim, border: colors.border },
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
