import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NeonButton } from './NeonButton';
import { palette, radius, spacing, typography } from '../../theme/theme';
import { AppIcons } from '../../theme/icons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = AppIcons.empty,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <NeonButton label={actionLabel} variant="outline" size="sm" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 24,
    color: palette.textSecondary,
  },
  title: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});
