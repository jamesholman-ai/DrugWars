import React, { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius, shadows, spacing } from '../utils/theme';

type CardVariant = 'default' | 'accent' | 'warning' | 'danger';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
}

const borderColors: Record<CardVariant, string> = {
  default: colors.border,
  accent: colors.accentDim,
  warning: colors.warningDim,
  danger: colors.dangerDim,
};

export function Card({ children, variant = 'default', style, title, subtitle }: CardProps) {
  return (
    <View style={[styles.card, { borderColor: borderColors[variant] }, style]}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  header: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
});
