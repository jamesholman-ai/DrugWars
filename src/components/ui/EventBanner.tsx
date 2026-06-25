import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AccentTone, accentMap, fonts, palette, radius, spacing } from '../../theme/theme';

interface EventBannerProps {
  label: string;
  message: string;
  tone?: AccentTone;
}

export function EventBanner({ label, message, tone = 'neutral' }: EventBannerProps) {
  const accent = accentMap[tone];

  return (
    <View style={[styles.banner, { borderLeftColor: accent.text }]}>
      <Text style={[styles.label, { color: accent.text }]}>{label}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: palette.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  message: {
    color: palette.textSecondary,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 15,
  },
});
