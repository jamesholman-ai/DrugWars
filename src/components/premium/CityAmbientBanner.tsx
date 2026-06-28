import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCityAmbient, formatAmbientLevel } from '../../data/cityAmbient';
import { CITY_MAP } from '../../data/locations';
import { accentMap, palette, spacing, typography } from '../../theme/theme';

interface CityAmbientBannerProps {
  cityId: string;
}

export function CityAmbientBanner({ cityId }: CityAmbientBannerProps) {
  const city = CITY_MAP[cityId];
  const ambient = getCityAmbient(cityId);
  const accent = accentMap[ambient.accent];

  return (
    <View style={[styles.wrap, { borderColor: accent.border, backgroundColor: accent.bg }]}>
      <View style={styles.top}>
        <Text style={styles.skyline}>{ambient.skyline}</Text>
        <View style={styles.meta}>
          <Text style={[styles.city, { color: accent.text }]}>{city?.name ?? cityId}</Text>
          <Text style={styles.tagline}>{ambient.tagline}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <Text style={styles.stat}>{formatAmbientLevel('Crime', ambient.crimeLevel)}</Text>
        <Text style={styles.stat}>{formatAmbientLevel('Wealth', ambient.wealthLevel)}</Text>
        <Text style={styles.stat}>{formatAmbientLevel('Police', ambient.policePresence)}</Text>
        <Text style={styles.stat}>{formatAmbientLevel('Cartel', ambient.cartelInfluence)}</Text>
        <Text style={styles.stat}>{formatAmbientLevel('Economy', ambient.economyRating)}</Text>
        <Text style={styles.stat}>{formatAmbientLevel('Nightlife', ambient.nightlifeRating)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  skyline: { fontSize: 28 },
  meta: { flex: 1 },
  city: {
    fontSize: typography.subtitle,
    fontWeight: '900',
  },
  tagline: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  stat: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
    width: '48%',
  },
});
