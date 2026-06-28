import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AccentTone, accentMap, palette, radius, spacing, typography } from '../../theme/theme';

interface EventBannerProps {
  label: string;
  message: string;
  tone?: AccentTone;
}

export function EventBanner({ label, message, tone = 'neutral' }: EventBannerProps) {
  const accent = accentMap[tone];

  return (
    <View style={[styles.banner, { borderColor: accent.border, backgroundColor: accent.bg }]}>
      <Text style={[styles.label, { color: accent.text }]}>{label}</Text>
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '800',
    marginBottom: 4,
  },
  message: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
