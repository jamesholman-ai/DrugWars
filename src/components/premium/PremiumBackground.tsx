import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, palette } from '../../theme/theme';

interface PremiumBackgroundProps {
  children: ReactNode;
  variant?: 'default' | 'hero' | 'hub';
}

export function PremiumBackground({ children, variant = 'default' }: PremiumBackgroundProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.cinematicBg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={[styles.orb, styles.orbPurple, variant === 'hero' && styles.orbHeroPurple]} />
      <View style={[styles.orb, styles.orbGreen, variant === 'hub' && styles.orbHubGreen]} />
      <View style={styles.orbCyan} />
      <View style={styles.vignette} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  orbPurple: {
    width: 280,
    height: 280,
    top: -80,
    right: -60,
    backgroundColor: 'rgba(155, 92, 255, 0.15)',
  },
  orbHeroPurple: {
    width: 340,
    height: 340,
    top: -100,
    opacity: 0.5,
  },
  orbGreen: {
    width: 200,
    height: 200,
    bottom: 120,
    left: -70,
    backgroundColor: 'rgba(53, 255, 136, 0.08)',
  },
  orbHubGreen: {
    width: 260,
    height: 260,
    bottom: 40,
    opacity: 0.45,
  },
  orbCyan: {
    position: 'absolute',
    width: 160,
    height: 160,
    top: '35%',
    left: -40,
    borderRadius: 999,
    backgroundColor: 'rgba(57, 200, 255, 0.06)',
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
});
