import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCityMaster, getTimeOfDayLabel, getWeatherLabel } from '../../assets/imageRegistry';
import { getCityAmbient } from '../../data/cityAmbient';
import { CITY_MAP } from '../../data/locations';
import { AREA_MAP } from '../../data/areas';
import { palette, spacing, typography } from '../../theme/theme';
import { SmartImageBackground } from './SmartImageBackground';
import { FIT_PRESETS } from './imageFit';

export interface CinematicIntroProps {
  cityId: string;
  areaId: string;
  day: number;
  onContinue: () => void;
}

function CinematicLocationIntroInner({
  cityId,
  areaId,
  day,
  onContinue,
}: CinematicIntroProps) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(32)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  const city = CITY_MAP[cityId];
  const area = AREA_MAP[areaId];
  const ambient = getCityAmbient(cityId);
  const art = getCityMaster(cityId);
  const timeLabel = getTimeOfDayLabel(day);
  const weather = getWeatherLabel(cityId);
  const preset = FIT_PRESETS.cinematicIntro;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: 800,
        delay: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 1400, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [fade, textSlide, pulse]);

  return (
    <Pressable style={styles.root} onPress={onContinue} accessibilityRole="button">
      <SmartImageBackground
        source={art.source}
        resizeMode="cover"
        focalPoint={preset.focalPoint}
        sourceAspectRatio={art.aspectRatio}
        sourceNativeWidth={art.nativeWidth}
        overlay
        overlayStrength={preset.overlayStrength}
        fill
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.lg,
            opacity: fade,
            transform: [{ translateY: textSlide }],
          },
        ]}
      >
        <View style={styles.center}>
          <Text style={styles.time}>{timeLabel.toUpperCase()}</Text>
          <View style={styles.dayRow}>
            <View style={styles.diamond} />
            <Text style={styles.day}>DAY {day}</Text>
            <View style={styles.diamond} />
          </View>
          <Text style={styles.city}>{(city?.name ?? cityId).toUpperCase()}</Text>
          <Text style={styles.district}>{(area?.name ?? areaId).toUpperCase()}</Text>
          <Text style={styles.tagline}>{ambient.tagline.toUpperCase()}</Text>
          <Text style={styles.status}>
            WEATHER: {weather.toUpperCase()} · OPS NOMINAL
          </Text>
        </View>

        <Animated.Text style={[styles.cta, { opacity: pulse }]}>
          TAP ANYWHERE TO CONTINUE
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export const CinematicLocationIntro = memo(CinematicLocationIntroInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  time: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  diamond: {
    width: 7,
    height: 7,
    backgroundColor: palette.gold,
    transform: [{ rotate: '45deg' }],
  },
  day: {
    color: palette.gold,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  city: {
    color: palette.text,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  district: {
    color: palette.gold,
    fontSize: typography.title,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  tagline: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  status: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  cta: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
