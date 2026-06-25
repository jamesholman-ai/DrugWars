import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AccentTone, accentMap, fonts, palette, radius, shadows, spacing } from '../../theme/theme';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  tone?: AccentTone;
  style?: ViewStyle;
  headerRight?: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  children,
  tone = 'neutral',
  style,
  headerRight,
}: SectionCardProps) {
  const accent = accentMap[tone];

  return (
    <View
      style={[
        styles.card,
        { borderColor: tone === 'neutral' ? palette.border : accent.border },
        style,
      ]}
    >
      <View style={styles.sheen} />
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
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.bgGloss,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
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
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: 2,
  },
});
