import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { animation, palette, radius, spacing } from '../../theme/theme';

interface SkeletonShimmerProps {
  height?: number;
  style?: ViewStyle;
  lines?: number;
}

export function SkeletonShimmer({ height = 88, style, lines = 1 }: SkeletonShimmerProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: animation.shimmerDuration,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[styles.wrap, { gap: spacing.sm }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={[styles.card, { height }]}>
          <Animated.View style={[styles.shimmerTrack, { transform: [{ translateX }] }]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  shimmerTrack: {
    ...StyleSheet.absoluteFill,
    width: '200%',
  },
  gradient: {
    flex: 1,
  },
});
