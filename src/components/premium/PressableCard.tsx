import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { animation } from '../../theme/theme';

interface PressableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function PressableCard({
  children,
  onPress,
  disabled,
  style,
  accessibilityLabel,
}: PressableCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPress ? pressIn : undefined}
        onPressOut={onPress ? pressOut : undefined}
        disabled={disabled || !onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
