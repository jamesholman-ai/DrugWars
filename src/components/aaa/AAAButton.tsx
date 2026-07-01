import React, { memo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { animation, buttons, palette, radius, shadows, typography } from '../../theme/theme';

export type AAAButtonVariant = 'gold' | 'green' | 'red' | 'blue' | 'ghost';

interface AAAButtonProps {
  label: string;
  onPress: () => void;
  variant?: AAAButtonVariant;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  fullWidth?: boolean;
}

const VARIANTS: Record<
  AAAButtonVariant,
  { colors: readonly [string, string]; text: string; border: string }
> = {
  gold: {
    colors: ['#FFB84D', '#CC9220'],
    text: '#0A0D14',
    border: 'rgba(255, 184, 77, 0.6)',
  },
  green: {
    colors: ['#35FF88', '#1FAF5C'],
    text: '#0A0D14',
    border: 'rgba(53, 255, 136, 0.5)',
  },
  red: {
    colors: ['#FF3B4F', '#CC2A3A'],
    text: '#FFFFFF',
    border: 'rgba(255, 59, 79, 0.5)',
  },
  blue: {
    colors: ['#39C8FF', '#2088CC'],
    text: '#0A0D14',
    border: 'rgba(57, 200, 255, 0.5)',
  },
  ghost: {
    colors: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
    text: palette.text,
    border: palette.borderBright,
  },
};

function AAAButtonInner({
  label,
  onPress,
  variant = 'gold',
  disabled = false,
  size = 'md',
  style,
  fullWidth,
}: AAAButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const v = VARIANTS[variant];
  const height =
    size === 'lg' ? buttons.heightLg : size === 'sm' ? buttons.heightSm : buttons.heightMd;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: animation.pressScale,
          useNativeDriver: true,
          speed: 50,
          bounciness: 0,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 4,
        }).start()
      }
      style={[fullWidth && styles.full, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.wrap,
          {
            height,
            borderColor: v.border,
            opacity: disabled ? 0.45 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient
          colors={[...v.colors]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={[styles.label, { color: v.text, fontSize: size === 'sm' ? typography.caption : typography.body }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export const AAAButton = memo(AAAButtonInner);

const styles = StyleSheet.create({
  full: { width: '100%' },
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
