import React, { memo, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AccentTone, accentMap, palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface AAAGlassCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  tone?: AccentTone;
  style?: ViewStyle;
  noPadding?: boolean;
}

function AAAGlassCardInner({
  children,
  title,
  subtitle,
  tone = 'neutral',
  style,
  noPadding,
}: AAAGlassCardProps) {
  const accent = accentMap[tone];

  return (
    <View style={[styles.wrap, { borderColor: accent.border }, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {(title || subtitle) && (
        <View style={styles.header}>
          {title ? (
            <Text style={[styles.title, { color: accent.text }]}>{title}</Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      <View style={noPadding ? undefined : styles.body}>{children}</View>
    </View>
  );
}

export const AAAGlassCard = memo(AAAGlassCardInner);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(16, 19, 26, 0.82)',
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  body: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
});
