import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../theme/icons';
import { formatDailyNet } from '../../game/dailyExpenses';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface AAAEmpireFooterProps {
  crewCount: number;
  businessCount: number;
  propertyCount: number;
  dailyNet: number;
  onPress: () => void;
}

function AAAEmpireFooterInner({
  crewCount,
  businessCount,
  propertyCount,
  dailyNet,
  onPress,
}: AAAEmpireFooterProps) {
  return (
    <Pressable style={styles.wrap} onPress={onPress} accessibilityRole="button">
      <View style={styles.stat}>
        <AppIcon name="crew" size={14} color={palette.cyan} />
        <Text style={styles.val}>{crewCount}</Text>
        <Text style={styles.lbl}>CREW</Text>
      </View>
      <View style={styles.stat}>
        <AppIcon name="business" size={14} color={palette.purpleBright} />
        <Text style={styles.val}>{businessCount}</Text>
        <Text style={styles.lbl}>FRONTS</Text>
      </View>
      <View style={styles.stat}>
        <AppIcon name="property" size={14} color={palette.gold} />
        <Text style={styles.val}>{propertyCount}</Text>
        <Text style={styles.lbl}>PROPS</Text>
      </View>
      <View style={styles.net}>
        <Text style={[styles.netVal, dailyNet >= 0 ? styles.pos : styles.neg]}>
          {formatDailyNet(dailyNet)}
        </Text>
      </View>
    </Pressable>
  );
}

export const AAAEmpireFooter = memo(AAAEmpireFooterInner);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 19, 26, 0.88)',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center' },
  val: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
    marginTop: 2,
  },
  lbl: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  net: { flex: 1.2, alignItems: 'flex-end' },
  netVal: {
    fontSize: typography.caption,
    fontWeight: '800',
  },
  pos: { color: palette.neon },
  neg: { color: palette.danger },
});
