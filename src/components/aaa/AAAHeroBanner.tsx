import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { getCityMaster, getTimeOfDayLabel, getWeatherLabel } from '../../assets/imageRegistry';
import { getCityAmbient } from '../../data/cityAmbient';
import { CITY_MAP } from '../../data/locations';
import { AREA_MAP } from '../../data/areas';
import { AppIcon } from '../../theme/icons';
import { accentMap, palette, radius, spacing, textStyles, typography } from '../../theme/theme';
import { SmartImageBackground } from './SmartImageBackground';
import { FIT_PRESETS } from './imageFit';

const HERO_HEIGHT_MOBILE = 190;
const HERO_HEIGHT_TABLET = 220;

interface AAAHeroBannerProps {
  cityId: string;
  areaId: string;
  day: number;
  rankName: string;
  rankProgress?: number;
  onLocationPress?: () => void;
}

function AAAHeroBannerInner({
  cityId,
  areaId,
  day,
  rankName,
  rankProgress = 0,
  onLocationPress,
}: AAAHeroBannerProps) {
  const { width } = useWindowDimensions();
  const heroHeight = width >= 768 ? HERO_HEIGHT_TABLET : HERO_HEIGHT_MOBILE;
  const city = CITY_MAP[cityId];
  const area = AREA_MAP[areaId];
  const ambient = getCityAmbient(cityId);
  const accent = accentMap[ambient.accent];
  const art = getCityMaster(cityId);
  const timeLabel = getTimeOfDayLabel(day);
  const weather = getWeatherLabel(cityId);
  const preset = FIT_PRESETS.commandHero;

  return (
    <View style={[styles.wrap, { borderColor: accent.border, height: heroHeight }]}>
      <SmartImageBackground
        source={art.source}
        resizeMode="cover"
        focalPoint={preset.focalPoint}
        sourceAspectRatio={art.aspectRatio}
        sourceNativeWidth={art.nativeWidth}
        overlay={preset.overlay}
        overlayStrength={preset.overlayStrength}
        fill
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.locBlock}>
            <View style={styles.locRow}>
              <AppIcon name="location" size={14} color={accent.text} />
              <Text style={[styles.cityName, { color: palette.text }]}>
                {(city?.name ?? cityId).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.district, { color: accent.text }]}>
              {(area?.name ?? areaId).toUpperCase()}
            </Text>
            {onLocationPress ? (
              <Pressable onPress={onLocationPress} style={styles.changeArea} hitSlop={8}>
                <Text style={styles.changeAreaText}>Change Area</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.rankBlock}>
            <AppIcon name="rank" size={14} color={palette.gold} />
            <Text style={styles.rankLabel}>RANK</Text>
            <Text style={styles.rankName}>{rankName.toUpperCase()}</Text>
            <View style={styles.rankBarTrack}>
              <View style={[styles.rankBarFill, { width: `${Math.min(100, rankProgress)}%` }]} />
            </View>
            <Text style={styles.rankPct}>{Math.round(rankProgress)}/100</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.time}>{timeLabel.toUpperCase()}</Text>
            <Text style={styles.day}>DAY {day}</Text>
          </View>
          <Text style={styles.tagline}>{ambient.tagline.toUpperCase()}</Text>
        </View>
        <Text style={styles.meta}>
          WEATHER: {weather.toUpperCase()} · OPS NOMINAL
        </Text>
      </View>
    </View>
  );
}

export const AAAHeroBanner = memo(AAAHeroBannerInner);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: palette.bgCard,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  locBlock: { flex: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cityName: {
    fontSize: typography.subtitle,
    fontWeight: '900',
    letterSpacing: 1,
  },
  district: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
    marginLeft: 20,
  },
  changeArea: { marginLeft: 20, marginTop: 4 },
  changeAreaText: {
    color: palette.neon,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  rankBlock: { alignItems: 'flex-end', minWidth: 90 },
  rankLabel: {
    ...textStyles.label,
    color: palette.textMuted,
    marginTop: 2,
  },
  rankName: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  rankBarTrack: {
    width: 72,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  rankBarFill: {
    height: '100%',
    backgroundColor: palette.gold,
    borderRadius: 2,
  },
  rankPct: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  time: {
    ...textStyles.label,
    color: palette.textSecondary,
  },
  day: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: 2,
  },
  tagline: {
    color: palette.textSecondary,
    fontSize: typography.tiny,
    fontWeight: '700',
    letterSpacing: 0.5,
    maxWidth: '55%',
    textAlign: 'right',
  },
  meta: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
});
