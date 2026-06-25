import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radius, spacing, typography } from '../../theme/theme';

interface ScreenHeaderProps {
  title: string;
  day?: number;
  location?: string;
  rank?: string;
  rankProgress?: number;
  onLocationPress?: () => void;
  rightSlot?: ReactNode;
}

export function ScreenHeader({
  title,
  day,
  location,
  rank,
  rankProgress = 0,
  onLocationPress,
  rightSlot,
}: ScreenHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glowBar} />
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
          {day != null ? (
            <View style={styles.metaRow}>
              <View style={styles.dayPill}>
                <Text style={styles.dayLabel}>DAY</Text>
                <Text style={styles.dayValue}>{day}</Text>
              </View>
              {location ? (
                <Pressable onPress={onLocationPress} disabled={!onLocationPress}>
                  <Text style={styles.location} numberOfLines={2}>
                    {location}
                    {onLocationPress ? '  ›' : ''}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
        {rightSlot ?? (rank ? (
          <View style={styles.rankBlock}>
            <Text style={styles.rankLabel}>RANK</Text>
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
    backgroundColor: palette.bgElevated,
  },
  glowBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.neon,
    opacity: 0.6,
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
  title: {
    color: palette.neon,
    fontFamily: fonts.display,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    gap: 4,
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dayLabel: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dayValue: {
    color: palette.neon,
    fontSize: 14,
    fontWeight: '800',
  },
  location: {
    flex: 1,
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  rankBlock: {
    width: 100,
    backgroundColor: palette.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
  },
  rankLabel: {
    color: palette.textMuted,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
  },
  rankValue: {
    color: palette.purpleBright,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  rankTrack: {
    height: 4,
    backgroundColor: palette.bgElevated,
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
