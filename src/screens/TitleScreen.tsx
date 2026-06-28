import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeonButton } from '../components/premium';
import { PremiumBackground } from '../components/premium/PremiumBackground';
import {
  APP_VERSION,
  COPYRIGHT_LINE,
  DEVELOPER_LINE,
} from '../constants/appInfo';
import { RootStackParamList } from '../types/game';
import { palette, radius, shadows, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Title'>;

export function TitleScreen({ navigation }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  const enterMenu = () => {
    navigation.replace('Home');
  };

  return (
    <PremiumBackground variant="hero">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fade,
              transform: [{ translateY: rise }],
            },
          ]}
        >
          <View style={styles.centerBlock}>
            <LinearGradient
              colors={['rgba(53,255,136,0.1)', 'transparent', 'rgba(155,92,255,0.08)']}
              style={styles.titleGlow}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />

            <View style={styles.skyline}>
              <View style={[styles.building, styles.b1]} />
              <View style={[styles.building, styles.b2]} />
              <View style={[styles.building, styles.b3]} />
              <View style={[styles.building, styles.b4]} />
              <View style={[styles.building, styles.b5]} />
            </View>

            <Text style={styles.eyebrow}>Neon Underworld</Text>
            <Text style={styles.title}>Drug Wars</Text>
            <Text style={styles.titleAccent}>Reloaded</Text>
            <Text style={styles.subtitle}>Build your empire. Survive the heat.</Text>

            <View style={styles.divider} />
          </View>

          <View style={styles.actions}>
            <NeonButton label="Enter" size="lg" icon="▶" onPress={enterMenu} />
            <NeonButton
              label="About"
              size="md"
              variant="secondary"
              onPress={() => navigation.navigate('About')}
            />
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => navigation.navigate('About')}
              hitSlop={8}
              style={styles.privacyLink}
            >
              <Text style={styles.privacyText}>Privacy & Disclaimer</Text>
            </Pressable>
            <Text style={styles.version}>v{APP_VERSION}</Text>
            <Text style={styles.developer}>{DEVELOPER_LINE}</Text>
            <Text style={styles.copyright}>{COPYRIGHT_LINE}</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  titleGlow: {
    ...StyleSheet.absoluteFill,
    opacity: 0.9,
  },
  skyline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    opacity: 0.28,
  },
  building: {
    flex: 1,
    backgroundColor: palette.bgCardHover,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  b1: { height: 56 },
  b2: { flex: 1.3, height: 92 },
  b3: { height: 44 },
  b4: { flex: 1.1, height: 118 },
  b5: { height: 72 },
  eyebrow: {
    color: palette.cyan,
    fontSize: typography.body,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.text,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1,
    lineHeight: 52,
    textAlign: 'center',
    ...shadows.glowGreen,
  },
  titleAccent: {
    color: palette.neon,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 52,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    color: palette.textSecondary,
    fontSize: typography.subtitle,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  divider: {
    width: 64,
    height: 2,
    backgroundColor: palette.neon,
    opacity: 0.5,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
    gap: 6,
  },
  privacyLink: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  privacyText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  version: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  developer: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  copyright: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 300,
  },
});
