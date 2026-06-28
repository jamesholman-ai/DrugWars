import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radius, spacing, typography, animation, buttons } from '../../theme/theme';
import { triggerPressHaptic } from '../../hooks/usePressFeedback';

export type NeonButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'outline'
  | 'success'
  | 'gold'
  | 'purple';
export type NeonButtonSize = 'sm' | 'md' | 'lg';

interface NeonButtonProps {
  label: string;
  onPress?: () => void;
  variant?: NeonButtonVariant;
  size?: NeonButtonSize;
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const variantStyles: Record<
  NeonButtonVariant,
  { border: string; bg: string; text: string; gradient?: readonly [string, string] }
> = {
  primary: {
    border: palette.neonDim,
    bg: palette.neonSoft,
    text: palette.neon,
    gradient: ['rgba(53,255,136,0.22)', 'rgba(53,255,136,0.06)'],
  },
  secondary: {
    border: palette.borderBright,
    bg: palette.bgCardHover,
    text: palette.text,
    gradient: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
  },
  danger: {
    border: palette.dangerDim,
    bg: palette.dangerGlow,
    text: palette.danger,
    gradient: ['rgba(255,59,79,0.2)', 'rgba(255,59,79,0.05)'],
  },
  ghost: {
    border: palette.border,
    bg: 'transparent',
    text: palette.textSecondary,
  },
  outline: {
    border: palette.neonDim,
    bg: 'transparent',
    text: palette.neon,
  },
  success: {
    border: palette.neonDim,
    bg: palette.neonSoft,
    text: palette.neon,
    gradient: ['rgba(53,255,136,0.28)', 'rgba(53,255,136,0.08)'],
  },
  gold: {
    border: palette.amberDim,
    bg: palette.amberGlow,
    text: palette.gold,
    gradient: ['rgba(255,184,77,0.22)', 'rgba(255,184,77,0.06)'],
  },
  purple: {
    border: palette.purple,
    bg: palette.purpleGlow,
    text: palette.purpleBright,
    gradient: ['rgba(155,92,255,0.22)', 'rgba(155,92,255,0.06)'],
  },
};

const sizeStyles: Record<NeonButtonSize, { minHeight: number; padV: number; padH: number; font: number }> = {
  sm: { minHeight: buttons.heightSm, padV: spacing.xs + 2, padH: spacing.sm, font: typography.caption },
  md: { minHeight: buttons.heightMd, padV: spacing.sm + 2, padH: spacing.md, font: typography.body },
  lg: { minHeight: buttons.heightLg, padV: spacing.md, padH: spacing.lg, font: typography.subtitle },
};

export function NeonButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  style,
  accessibilityLabel,
}: NeonButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: animation.pressScale,
      useNativeDriver: true,
      speed: animation.spring.speed,
      bounciness: 0,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: animation.spring.speed,
      bounciness: animation.spring.bounciness,
    }).start();
  };

  const handlePress = () => {
    if (!onPress || disabled) return;
    triggerPressHaptic(variant === 'success' ? 'success' : 'light');
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: !!disabled }}
        android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
        style={[
          styles.button,
          {
            minHeight: s.minHeight,
            paddingVertical: s.padV,
            paddingHorizontal: s.padH,
            borderColor: v.border,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        {v.gradient ? (
          <LinearGradient
            colors={[...v.gradient]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : null}
        <View style={styles.inner}>
          {icon ? <Text style={[styles.icon, { color: v.text }]}>{icon}</Text> : null}
          <Text style={[styles.label, { color: v.text, fontSize: s.font }]} numberOfLines={2}>
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
