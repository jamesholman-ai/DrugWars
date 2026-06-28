import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  day?: number;
  city?: string;
  district?: string;
  location?: string;
  rank?: string;
  rankProgress?: number;
  onLocationPress?: () => void;
  rightSlot?: ReactNode;
}

export function HeroHeader({
  title,
  subtitle,
  day,
  city,
  district,
  location,
  rank,
  rankProgress = 0,
  onLocationPress,
  rightSlot,
}: HeroHeaderProps) {
  const locationLabel = location ?? [city, district].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(53,255,136,0.12)', 'rgba(16,19,26,0.98)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowBar} />
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.eyebrow}>Command Center</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {day != null ? (
            <View style={styles.metaRow}>
              <View style={styles.dayPill}>
                <Text style={styles.dayLabel}>Day</Text>
                <Text style={styles.dayValue}>{day}</Text>
              </View>
              {locationLabel ? (
                <Pressable onPress={onLocationPress} disabled={!onLocationPress} style={styles.locationWrap}>
                  <Text style={styles.location} numberOfLines={2}>
                    {locationLabel}
                    {onLocationPress ? '  ›' : ''}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
        {rightSlot ??
          (rank ? (
            <View style={styles.rankBlock}>
              <Text style={styles.rankLabel}>Rank</Text>
              <Text style={styles.rankValue} numberOfLines={1}>
                {rank}
              </Text>
              <View style={styles.rankTrack}>
                <View style={[styles.rankFill, { width: `${Math.min(100, rankProgress)}%` }]} />
              </View>
            </View>
          ) : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    overflow: 'hidden',
  },
  glowBar: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: palette.neon,
    opacity: 0.7,
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: palette.cyan,
    fontSize: typography.caption,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dayLabel: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  dayValue: {
    color: palette.neon,
    fontSize: typography.body,
    fontWeight: '800',
  },
  locationWrap: {
    flex: 1,
    minWidth: 0,
  },
  location: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  rankBlock: {
    width: 108,
    backgroundColor: palette.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
  },
  rankLabel: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  rankValue: {
    color: palette.purpleBright,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: 2,
  },
  rankTrack: {
    height: 5,
    backgroundColor: palette.bg,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  rankFill: {
    height: '100%',
    backgroundColor: palette.purple,
    borderRadius: radius.pill,
  },
});
