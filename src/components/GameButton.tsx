import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { colors, fonts, radius, spacing, touch } from '../utils/theme';

interface GameButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export function GameButton({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  disabled,
  ...props
}: GameButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`size_${size}`],
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      activeOpacity={0.65}
      {...props}
    >
      <View style={styles.inner}>
        {icon ? <Text style={[styles.icon, disabled && styles.labelDisabled]}>{icon}</Text> : null}
        <Text
          style={[
            styles.label,
            styles[`label_${size}`],
            variant === 'secondary' && styles.labelSecondary,
            variant === 'ghost' && styles.labelGhost,
            disabled && styles.labelDisabled,
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accentGlow,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    minHeight: touch.minHeight,
    justifyContent: 'center',
  },
  size_sm: {
    minHeight: 40,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  size_lg: {
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondary: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderBright,
  },
  danger: {
    backgroundColor: colors.dangerGlow,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.38,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  icon: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  label: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  label_sm: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  label_md: {
    fontSize: 12,
  },
  label_lg: {
    fontSize: 14,
    letterSpacing: 1.2,
  },
  labelSecondary: {
    color: colors.text,
  },
  labelGhost: {
    color: colors.textDim,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
});
