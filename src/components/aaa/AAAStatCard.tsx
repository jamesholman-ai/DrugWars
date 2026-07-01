import React, { memo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, IconName } from '../../theme/icons';
import { AnimatedMoney } from '../premium/AnimatedMoney';
import { AccentTone, accentMap, animation, palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface AAAStatCardProps {
  label: string;
  icon: IconName;
  tone?: AccentTone;
  value?: number;
  displayValue?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

function AAAStatCardInner({
  label,
  icon,
  tone = 'neutral',
  value,
  displayValue,
  subtitle,
  onPress,
  style,
}: AAAStatCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const accent = accentMap[tone];

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: animation.pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        { borderColor: accent.border, transform: [{ scale }] },
        style,
      ]}
    >
      <LinearGradient
        colors={[accent.glow, 'transparent']}
        style={styles.glow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.top}>
        <AppIcon name={icon} size={16} color={accent.text} />
        <Text style={[styles.label, { color: accent.text }]}>{label}</Text>
      </View>
      {value != null ? (
        <AnimatedMoney
          value={value}
          tone={tone === 'green' ? 'green' : tone === 'red' ? 'red' : tone === 'purple' ? 'purple' : 'green'}
          style={styles.value}
        />
      ) : (
        <Text style={[styles.valueText, { color: palette.text }]}>{displayValue}</Text>
      )}
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </Animated.View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${displayValue ?? value}`}
    >
      {content}
    </Pressable>
  );
}

export const AAAStatCard = memo(AAAStatCardInner);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(16, 19, 26, 0.88)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: typography.title,
    fontWeight: '900',
  },
  valueText: {
    fontSize: typography.title,
    fontWeight: '900',
  },
  sub: {
    color: palette.gold,
    fontSize: typography.tiny,
    fontWeight: '700',
    marginTop: 4,
  },
});
