import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AccentTone, accentMap, fonts, glass, palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  tone?: AccentTone;
  style?: ViewStyle;
  headerRight?: ReactNode;
  elevated?: boolean;
}

export function GlassCard({
  title,
  subtitle,
  children,
  tone = 'neutral',
  style,
  headerRight,
  elevated = false,
}: GlassCardProps) {
  const accent = accentMap[tone];

  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        tone !== 'neutral' && { borderColor: accent.border },
        style,
      ]}
    >
      <LinearGradient
        colors={[glass.sheenTop, glass.sheenBottom]}
        style={styles.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {tone !== 'neutral' ? (
        <LinearGradient
          colors={[accent.glow, 'transparent']}
          style={styles.toneGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      ) : null}
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, tone !== 'neutral' && { color: accent.text }]}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  elevated: {
    backgroundColor: palette.bgCardHover,
    ...shadows.elevated,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  toneGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
    lineHeight: 16,
  },
});
