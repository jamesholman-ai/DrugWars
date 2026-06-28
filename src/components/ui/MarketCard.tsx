import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  formatPercentChange,
  formatPriceDelta,
  getMarketTrendTone,
  getPriceHistoryStats,
  MarketPriceChange,
  trendArrow,
} from '../../utils/marketPriceDisplay';
import { formatMoney } from '../../utils/format';
import { NeonButton } from '../premium/NeonButton';
import { Sparkline } from '../premium/Sparkline';
import { palette, radius, shadows, spacing, typography } from '../../theme/theme';

interface MarketCardProps {
  name: string;
  icon: string;
  price: number;
  priceChange: MarketPriceChange;
  priceHistory?: number[];
  eventBadge: string | null;
  ownedQty: number;
  availableQty?: number;
  canBuy: boolean;
  canSell: boolean;
  onBuy: () => void;
  onSell: () => void;
}

function trendStyle(tone: ReturnType<typeof getMarketTrendTone>, isMajor: boolean) {
  switch (tone) {
    case 'rising':
      return { accent: palette.neon, border: palette.neonDim, bg: palette.neonSoft, glow: isMajor ? shadows.glowGreen : {} };
    case 'falling':
      return { accent: palette.danger, border: palette.dangerDim, bg: palette.dangerGlow, glow: isMajor ? shadows.glowRed : {} };
    case 'major':
      return { accent: palette.gold, border: palette.amberDim, bg: palette.amberGlow, glow: shadows.glowGold };
    default:
      return { accent: palette.textSecondary, border: palette.border, bg: palette.bgElevated, glow: {} };
  }
}

function MarketCardInner({
  name,
  icon,
  price,
  priceChange,
  priceHistory,
  eventBadge,
  ownedQty,
  availableQty,
  canBuy,
  canSell,
  onBuy,
  onSell,
}: MarketCardProps) {
  const tone = getMarketTrendTone(priceChange);
  const colors = trendStyle(tone, priceChange.isMajorSwing);
  const arrow = trendArrow(priceChange.trend, priceChange.hasHistory);
  const glow = useRef(new Animated.Value(priceChange.isMajorSwing ? 0.6 : 0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const stats = getPriceHistoryStats(price, priceHistory);
  const sparkValues = priceHistory?.length ? [...priceHistory.slice(-12), price] : [price];

  useEffect(() => {
    if (priceChange.isMajorSwing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0.5, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [priceChange.isMajorSwing, glow]);

  useEffect(() => {
    if (!priceChange.hasHistory) return;
    const flashColor =
      priceChange.trend === 'up' ? 1 : priceChange.trend === 'down' ? -1 : 0;
    if (flashColor === 0) return;
    flash.setValue(flashColor);
    Animated.timing(flash, { toValue: 0, duration: 480, useNativeDriver: false }).start();
  }, [price, priceChange.hasHistory, priceChange.trend, flash]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.accent],
  });

  const flashBg = flash.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [palette.dangerGlow, 'transparent', palette.neonSoft],
  });

  return (
    <Animated.View
      style={[styles.card, colors.glow, { borderColor, backgroundColor: flashBg }]}
      accessibilityLabel={`${name} trading at ${formatMoney(price)}`}
    >
      <LinearGradient
        colors={[colors.bg, 'transparent']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{name}</Text>
            {eventBadge ? (
              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>{eventBadge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.price, { color: colors.accent }]}>{formatMoney(price)}</Text>
        </View>
        <View style={[styles.trendBlock, { borderColor: colors.border, backgroundColor: colors.bg }]}>
          <Text style={[styles.trendArrow, { color: colors.accent }]}>{arrow}</Text>
          {priceChange.hasHistory && priceChange.delta != null && priceChange.percentChange != null ? (
            <>
              <Text style={[styles.delta, { color: colors.accent }]}>
                {formatPriceDelta(priceChange.delta)}
              </Text>
              <Text style={[styles.pct, { color: colors.accent }]}>
                {formatPercentChange(priceChange.percentChange)}
              </Text>
            </>
          ) : (
            <Text style={styles.newData}>New</Text>
          )}
        </View>
      </View>

      {priceChange.hasHistory && priceChange.previousPrice != null ? (
        <View style={styles.analyticsRow}>
          <Sparkline values={sparkValues} color={colors.accent} />
          <View style={styles.rangeBlock}>
            {stats ? (
              <>
                <Text style={styles.rangeLine}>H {formatMoney(stats.high)}</Text>
                <Text style={styles.rangeLine}>L {formatMoney(stats.low)}</Text>
                <Text style={styles.confidence}>Conf. {stats.confidence}</Text>
              </>
            ) : (
              <Text style={styles.prevLine}>Previous {formatMoney(priceChange.previousPrice)}</Text>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.qtyRow}>
        <View style={styles.qtyChip}>
          <Text style={styles.qtyLabel}>Owned</Text>
          <Text style={[styles.qtyValue, ownedQty > 0 && styles.qtyOwned]}>{ownedQty}</Text>
        </View>
        {availableQty != null ? (
          <View style={styles.qtyChip}>
            <Text style={styles.qtyLabel}>Available</Text>
            <Text style={styles.qtyValue}>{availableQty}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <NeonButton label="Buy" size="sm" disabled={!canBuy} onPress={onBuy} />
        </View>
        <View style={styles.actionBtn}>
          <NeonButton label="Sell" variant="danger" size="sm" disabled={!canSell} onPress={onSell} />
        </View>
      </View>
    </Animated.View>
  );
}

export const MarketCard = memo(MarketCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardGradient: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.borderBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  name: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  eventBadge: {
    backgroundColor: palette.amberGlow,
    borderWidth: 1,
    borderColor: palette.amberDim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  eventBadgeText: {
    color: palette.gold,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  price: {
    fontSize: typography.hero,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  trendBlock: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 72,
  },
  trendArrow: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  delta: {
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: 2,
  },
  pct: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  newData: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    marginTop: 4,
  },
  prevLine: {
    color: palette.textSecondary,
    fontSize: typography.caption,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rangeBlock: {
    flex: 1,
  },
  rangeLine: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  confidence: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  qtyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  qtyChip: {
    flex: 1,
    backgroundColor: palette.bgCardHover,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  qtyLabel: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  qtyValue: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    marginTop: 2,
  },
  qtyOwned: {
    color: palette.neon,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
});
