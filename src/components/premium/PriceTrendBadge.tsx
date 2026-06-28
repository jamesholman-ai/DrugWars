import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  MarketPriceChange,
  formatPercentChange,
  formatPriceDelta,
  getMarketTrendTone,
  trendArrow,
} from '../../utils/marketPriceDisplay';
import { palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface PriceTrendBadgeProps {
  priceChange: MarketPriceChange;
  large?: boolean;
}

export function PriceTrendBadge({ priceChange, large = false }: PriceTrendBadgeProps) {
  const tone = getMarketTrendTone(priceChange);
  const arrow = trendArrow(priceChange.trend, priceChange.hasHistory);

  const colors = (() => {
    switch (tone) {
      case 'rising':
        return { accent: palette.neon, border: palette.neonDim, bg: palette.neonSoft, glow: shadows.glowGreen };
      case 'falling':
        return { accent: palette.danger, border: palette.dangerDim, bg: palette.dangerGlow, glow: shadows.glowRed };
      case 'major':
        return { accent: palette.gold, border: palette.amberDim, bg: palette.amberGlow, glow: shadows.glowGold };
      default:
        return { accent: palette.textSecondary, border: palette.border, bg: palette.bgElevated, glow: {} };
    }
  })();

  return (
    <View style={[styles.wrap, large && styles.wrapLarge, priceChange.isMajorSwing && colors.glow]}>
      <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={[styles.arrow, large && styles.arrowLarge, { color: colors.accent }]}>{arrow}</Text>
      </View>
      {priceChange.hasHistory &&
      priceChange.delta != null &&
      priceChange.percentChange != null ? (
        <View style={styles.deltaCol}>
          <Text style={[styles.delta, { color: colors.accent }]}>
            {formatPriceDelta(priceChange.delta)}
          </Text>
          <Text style={[styles.pct, { color: colors.accent }]}>
            {formatPercentChange(priceChange.percentChange)}
          </Text>
        </View>
      ) : (
        <Text style={styles.newData}>New data</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wrapLarge: {
    gap: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '800',
  },
  arrowLarge: {
    fontSize: 28,
  },
  deltaCol: {
    gap: 2,
  },
  delta: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  pct: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  newData: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontStyle: 'italic',
  },
});
