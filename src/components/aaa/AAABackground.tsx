import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, palette } from '../../theme/theme';

interface AAABackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'cinematic' | 'hub';
  style?: ViewStyle;
}

function AAABackgroundInner({ children, variant = 'default', style }: AAABackgroundProps) {
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftLoop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 18000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    driftLoop.start();
    pulseLoop.start();
    return () => {
      driftLoop.stop();
      pulseLoop.stop();
    };
  }, [drift, pulse]);

  const orbTranslate = drift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 12, 0],
  });
  const bloomOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.45],
  });

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={[...gradients.cinematicBg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
      />
      <Animated.View
        style={[
          styles.bloom,
          variant === 'cinematic' && styles.bloomCinematic,
          { opacity: bloomOpacity, transform: [{ translateY: orbTranslate }] },
        ]}
      />
      <View style={[styles.orb, styles.orbPurple]} />
      <View style={[styles.orb, styles.orbGreen, variant === 'hub' && styles.orbHub]} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
        style={styles.vignetteBottom}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export const AAABackground = memo(AAABackgroundInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  bloom: {
    position: 'absolute',
    width: 320,
    height: 320,
    top: -60,
    right: -80,
    borderRadius: 999,
    backgroundColor: 'rgba(155, 92, 255, 0.12)',
  },
  bloomCinematic: {
    width: 420,
    height: 420,
    opacity: 0.5,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPurple: {
    width: 240,
    height: 240,
    top: '20%',
    left: -100,
    backgroundColor: 'rgba(57, 200, 255, 0.06)',
  },
  orbGreen: {
    width: 200,
    height: 200,
    bottom: 80,
    right: -60,
    backgroundColor: 'rgba(53, 255, 136, 0.06)',
  },
  orbHub: {
    width: 280,
    height: 280,
    bottom: 40,
    opacity: 0.8,
  },
  vignetteBottom: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
});
