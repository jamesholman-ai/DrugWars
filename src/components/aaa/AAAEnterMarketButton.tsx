import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../theme/icons';
import { palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface AAAEnterMarketButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

function AAAEnterMarketButtonInner({ onPress, disabled }: AAAEnterMarketButtonProps) {
  return (
    <Pressable
      style={[styles.wrap, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Enter Market"
    >
      <LinearGradient
        colors={['rgba(53,255,136,0.12)', 'rgba(5,6,10,0.92)', 'rgba(5,6,10,0.98)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <AppIcon name="market" size={22} color={palette.neon} />
        <Text style={styles.label}>ENTER MARKET</Text>
      </View>
    </Pressable>
  );
}

export const AAAEnterMarketButton = memo(AAAEnterMarketButtonInner);

const styles = StyleSheet.create({
  wrap: {
    height: 72,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.neonDim,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: palette.bgCard,
    ...shadows.glowGreen,
  },
  disabled: { opacity: 0.45 },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    color: palette.neon,
    fontSize: typography.subtitle,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
