import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AccentTone, accentMap, palette, radius, shadows, spacing, typography } from '../../theme/theme';
import { PressableCard } from './PressableCard';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  tone?: AccentTone;
  onPress?: () => void;
  style?: ViewStyle;
}

function DashboardCardInner({
  title,
  value,
  subtitle,
  icon,
  tone = 'cyan',
  onPress,
  style,
}: DashboardCardProps) {
  const accent = accentMap[tone];

  const body = (
    <View style={[styles.card, { borderColor: accent.border }, style]}>
      <LinearGradient
        colors={[accent.glow, 'transparent']}
        style={styles.glow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={[styles.title, { color: accent.text }]}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <PressableCard onPress={onPress} style={styles.pressWrap} accessibilityLabel={`${title} ${value}`}>
      {body}
    </PressableCard>
  );
}

export const DashboardCard = memo(DashboardCardInner);

const styles = StyleSheet.create({
  pressWrap: { flex: 1, minWidth: '46%' },
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  value: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
    lineHeight: 15,
  },
});
