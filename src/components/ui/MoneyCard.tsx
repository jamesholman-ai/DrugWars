import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AccentTone, accentMap, fonts, palette, radius, shadows, spacing } from '../../theme/theme';

interface MoneyCardProps {
  label: string;
  amount: string;
  tone?: AccentTone;
  icon?: string;
  style?: ViewStyle;
}

export function MoneyCard({ label, amount, tone = 'green', icon, style }: MoneyCardProps) {
  const accent = accentMap[tone];

  return (
    <View style={[styles.card, { borderColor: accent.border, backgroundColor: accent.bg }, style]}>
      <View style={styles.sheen} />
      {icon ? <Text style={[styles.icon, { color: accent.text }]}>{icon}</Text> : null}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, { color: accent.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.bgGloss,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
