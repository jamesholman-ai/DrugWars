import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextStyle } from 'react-native';
import { formatMoney } from '../../utils/format';
import { animation, palette, typography } from '../../theme/theme';

interface AnimatedMoneyProps {
  value: number;
  style?: TextStyle;
  hero?: boolean;
  tone?: 'green' | 'red' | 'purple' | 'amber' | 'cyan';
  duration?: number;
  accessibilityLabel?: string;
}

const toneColors = {
  green: palette.cash,
  red: palette.debt,
  purple: palette.netWorth,
  amber: palette.gold,
  cyan: palette.cyan,
};

export function AnimatedMoney({
  value,
  style,
  hero = false,
  tone = 'green',
  duration = animation.normal,
  accessibilityLabel,
}: AnimatedMoneyProps) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    const listenerId = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    anim.setValue(from);
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listenerId);
  }, [value, anim, duration]);

  return (
    <Text
      style={[
        styles.base,
        { color: toneColors[tone] },
        hero && styles.hero,
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      accessibilityLabel={accessibilityLabel ?? `Amount ${formatMoney(display)}`}
      accessibilityRole="text"
    >
      {formatMoney(display)}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: typography.money,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  hero: {
    fontSize: typography.moneyHero,
  },
});
