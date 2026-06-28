import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing, typography, animation } from '../../theme/theme';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  dangerBelow?: number;
  dangerAbove?: number;
  showValue?: boolean;
}

export function StatBar({
  label,
  value,
  max = 100,
  color = palette.neon,
  dangerBelow,
  dangerAbove,
  showValue = true,
}: StatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const widthAnim = useRef(new Animated.Value(pct)).current;
  const isDanger =
    (dangerBelow != null && value <= dangerBelow) ||
    (dangerAbove != null && value >= dangerAbove);
  const fillColor = isDanger ? palette.danger : color;
  const displayValue = showValue ? (max !== 100 ? `${value}/${max}` : String(value)) : '';

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: animation.normal,
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap} accessibilityLabel={`${label} ${displayValue}`}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showValue ? (
          <Text style={[styles.value, isDanger && styles.valueDanger]}>{displayValue}</Text>
        ) : null}
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth,
              backgroundColor: fillColor,
              shadowColor: fillColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  value: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  valueDanger: {
    color: palette.danger,
  },
  track: {
    height: 8,
    backgroundColor: palette.bg,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
});
