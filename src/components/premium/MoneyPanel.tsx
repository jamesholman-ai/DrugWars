import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedMoney } from './AnimatedMoney';
import { AccentTone, accentMap, palette, radius, shadows, spacing, typography } from '../../theme/theme';
import { AppIcon, IconName, isIconName } from '../../theme/icons';

interface MoneyPanelProps {
  label: string;
  amount: string;
  amountValue?: number;
  tone?: AccentTone;
  icon?: IconName | string;
  style?: ViewStyle;
  hero?: boolean;
}

const toneToAnimated: Record<AccentTone, 'green' | 'red' | 'purple' | 'amber' | 'cyan'> = {
  green: 'green',
  red: 'red',
  purple: 'purple',
  amber: 'amber',
  cyan: 'cyan',
  neutral: 'green',
};

export function MoneyPanel({
  label,
  amount,
  amountValue,
  tone = 'green',
  icon,
  style,
  hero = false,
}: MoneyPanelProps) {
  const accent = accentMap[tone];

  return (
    <View
      style={[
        styles.card,
        hero && styles.hero,
        { borderColor: accent.border },
        hero && shadows.glowGreen,
        style,
      ]}
      accessibilityRole="summary"
    >
      <LinearGradient
        colors={[accent.glow, 'transparent']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {icon ? (
        isIconName(icon) ? (
          <AppIcon name={icon} size={20} color={accent.text} style={styles.iconSpacing} />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )
      ) : null}
      <Text style={styles.label}>{label}</Text>
      {amountValue != null ? (
        <AnimatedMoney
          value={amountValue}
          hero={hero}
          tone={toneToAnimated[tone]}
          accessibilityLabel={`${label} ${amount}`}
        />
      ) : (
        <Text
          style={[styles.amount, { color: accent.text }, hero && styles.amountHero]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {amount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: palette.bgCard,
    ...shadows.card,
  },
  hero: {
    paddingVertical: spacing.lg,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
    opacity: 0.6,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  iconSpacing: {
    marginBottom: 4,
  },
  label: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  amount: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  amountHero: {
    fontSize: typography.money,
  },
});
