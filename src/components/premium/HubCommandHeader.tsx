import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCityAmbient } from '../../data/cityAmbient';
import { CITY_MAP } from '../../data/locations';
import { AREA_MAP } from '../../data/areas';
import { accentMap, palette, radius, spacing, textStyles, typography } from '../../theme/theme';
import { AppIcon, AppIcons } from '../../theme/icons';

interface HubCommandHeaderProps {
  cityId: string;
  areaId: string;
  day: number;
  rankName: string;
}

function HubCommandHeaderInner({ cityId, areaId, day, rankName }: HubCommandHeaderProps) {
  const city = CITY_MAP[cityId];
  const area = AREA_MAP[areaId];
  const ambient = getCityAmbient(cityId);
  const accent = accentMap[ambient.accent];
  const hour = (day * 7 + 14) % 24;
  const timeLabel = hour >= 18 || hour < 6 ? 'Night' : hour >= 12 ? 'Afternoon' : 'Morning';

  return (
    <View style={[styles.wrap, { borderColor: accent.border }]}>
      <LinearGradient
        colors={[accent.glow, 'transparent', palette.charcoal]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.skylineRow}>
        <Text style={styles.skyline}>{ambient.skyline}</Text>
        <View style={styles.meta}>
          <Text style={[styles.city, { color: accent.text }]}>{city?.name ?? cityId}</Text>
          <Text style={styles.district}>{area?.name ?? areaId}</Text>
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{timeLabel}</Text>
          <Text style={styles.day}>Day {day}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.tagline}>{ambient.tagline}</Text>
        <View style={styles.rankRow}>
          <AppIcon name={AppIcons.rank} size={14} color={palette.gold} />
          <Text style={styles.rank}>{rankName}</Text>
        </View>
      </View>
      <Text style={styles.weather}>Weather: clear · ops nominal</Text>
    </View>
  );
}

export const HubCommandHeader = memo(HubCommandHeaderInner);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: palette.charcoal,
  },
  skylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  skyline: {
    fontSize: 40,
  },
  meta: {
    flex: 1,
  },
  city: {
    fontSize: typography.title,
    fontWeight: '900',
  },
  district: {
    ...textStyles.caption,
    marginTop: 2,
  },
  timeBlock: {
    alignItems: 'flex-end',
  },
  time: {
    ...textStyles.label,
    color: palette.textSecondary,
  },
  day: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  tagline: {
    ...textStyles.caption,
    flex: 1,
    marginRight: spacing.sm,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rank: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  weather: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
