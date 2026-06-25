import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatPercentChange,
  formatPriceDelta,
  getMarketTrendTone,
  MarketPriceChange,
  trendArrow,
} from '../../utils/marketPriceDisplay';
import { formatMoney } from '../../utils/format';
import { fonts, palette, radius, spacing } from '../../theme/theme';

interface MarketCardProps {
  name: string;
  icon: string;
  price: number;
  priceChange: MarketPriceChange;
  eventBadge: string | null;
  ownedQty: number;
  canBuy: boolean;
  canSell: boolean;
  onBuy: () => void;
  onSell: () => void;
}

function toneColors(tone: ReturnType<typeof getMarketTrendTone>) {
  switch (tone) {
    case 'rising':
      return { accent: palette.neon, border: palette.neonDim, bg: palette.neonSoft };
    case 'falling':
      return { accent: palette.danger, border: palette.dangerDim, bg: palette.dangerGlow };
    case 'major':
      return { accent: palette.amber, border: palette.amberDim, bg: palette.amberGlow };
    case 'new':
    case 'flat':
    default:
      return { accent: palette.textMuted, border: palette.border, bg: palette.bgElevated };
  }
}

export function MarketCard({
  name,
  icon,
  price,
  priceChange,
  eventBadge,
  ownedQty,
  canBuy,
  canSell,
  onBuy,
  onSell,
}: MarketCardProps) {
  const tone = getMarketTrendTone(priceChange);
  const colors = toneColors(tone);
  const arrow = trendArrow(priceChange.trend, priceChange.hasHistory);

  return (
    <View
      style={[
        styles.card,
        priceChange.isMajorSwing && styles.cardMajor,
        { borderColor: priceChange.isMajorSwing ? palette.amber : palette.border },
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {eventBadge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{eventBadge}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.accent }]}>{formatMoney(price)}</Text>
          <View style={[styles.trendChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={[styles.trendArrow, { color: colors.accent }]}>{arrow}</Text>
          </View>
        </View>

        {priceChange.hasHistory &&
        priceChange.previousPrice != null &&
        priceChange.delta != null &&
        priceChange.percentChange != null ? (
          <Text style={styles.changeLine}>
            <Text style={styles.changeMuted}>was {formatMoney(priceChange.previousPrice)} · </Text>
            <Text style={[styles.changeValue, { color: colors.accent }]}>
              {formatPriceDelta(priceChange.delta)} ({formatPercentChange(priceChange.percentChange)})
            </Text>
          </Text>
        ) : (
          <Text style={styles.newData}>New market data</Text>
        )}
      </View>

      <View style={styles.sideCol}>
        <Text style={styles.qtyLabel}>YOU</Text>
        <Text style={[styles.qtyValue, ownedQty > 0 && styles.ownedHighlight]}>{ownedQty}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.buyBtn, !canBuy && styles.btnDisabled]}
          onPress={onBuy}
          disabled={!canBuy}
        >
          <Text style={[styles.btnText, styles.buyText]}>BUY</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.sellBtn, !canSell && styles.btnDisabled]}
          onPress={onSell}
          disabled={!canSell}
        >
          <Text style={[styles.btnText, styles.sellText]}>SELL</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardMajor: {
    borderWidth: 2,
    shadowColor: palette.amber,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  name: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    backgroundColor: palette.amberGlow,
    borderWidth: 1,
    borderColor: palette.amberDim,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: palette.amber,
    fontFamily: fonts.body,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
  },
  price: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '800',
  },
  trendChip: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  trendArrow: {
    fontSize: 10,
    fontWeight: '800',
  },
  changeLine: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
  },
  changeMuted: {
    color: palette.textMuted,
  },
  changeValue: {
    fontWeight: '700',
  },
  newData: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 3,
  },
  sideCol: {
    alignItems: 'center',
    minWidth: 32,
  },
  qtyLabel: {
    color: palette.textMuted,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  qtyValue: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  ownedHighlight: {
    color: palette.neon,
  },
  actions: {
    gap: 4,
  },
  btn: {
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 44,
    alignItems: 'center',
  },
  buyBtn: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
  },
  sellBtn: {
    backgroundColor: palette.dangerGlow,
    borderWidth: 1,
    borderColor: palette.danger,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyText: {
    color: palette.neon,
  },
  sellText: {
    color: palette.danger,
  },
});
