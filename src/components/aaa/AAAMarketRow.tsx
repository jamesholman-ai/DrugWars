import React, { memo } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getDrugIconAsset } from '../../assets/uiAssetRegistry';
import { getMarketTrendArrowSymbol, getMarketTrendColor, MarketTrendDirection } from '../../game/marketTrend';
import { CommodityId } from '../../types/game';
import { commodityIcon } from '../../utils/commodityIcons';
import { formatMoney } from '../../utils/format';
import { palette, radius, spacing, typography } from '../../theme/theme';

interface DrugIconProps {
  commodityId: CommodityId;
  size?: number;
}

function DrugIconInner({ commodityId, size = 28 }: DrugIconProps) {
  const asset = getDrugIconAsset(commodityId);
  if (asset.source) {
    return <Image source={asset.source} style={{ width: size, height: size }} contentFit="contain" />;
  }
  return <Text style={{ fontSize: size * 0.75 }}>{commodityIcon(commodityId)}</Text>;
}

export const DrugIcon = memo(DrugIconInner);

interface AAAMarketRowProps {
  commodityId: CommodityId;
  name: string;
  price: number;
  trend: MarketTrendDirection;
  hasTrendHistory: boolean;
  isNewListing?: boolean;
  owned: number;
  canBuy: boolean;
  canSell: boolean;
  onBuy: () => void;
  onSell: () => void;
  eventBadge?: string;
}

function trendPaletteColor(direction: MarketTrendDirection, hasHistory: boolean): string {
  if (!hasHistory) return palette.textMuted;
  const token = getMarketTrendColor(direction);
  if (token === 'green') return palette.neon;
  if (token === 'red') return palette.danger;
  return palette.textMuted;
}

function AAAMarketRowInner({
  commodityId,
  name,
  price,
  trend,
  hasTrendHistory,
  isNewListing = false,
  owned,
  canBuy,
  canSell,
  onBuy,
  onSell,
  eventBadge,
}: AAAMarketRowProps) {
  const trendColor = trendPaletteColor(trend, hasTrendHistory);
  const trendArrow = hasTrendHistory
    ? getMarketTrendArrowSymbol(trend)
    : isNewListing
      ? 'NEW'
      : '—';

  return (
    <View style={styles.row}>
      <View style={styles.iconCol}>
        <DrugIcon commodityId={commodityId} size={26} />
      </View>
      <View style={styles.nameCol}>
        <Text style={styles.name}>{name.toUpperCase()}</Text>
        {eventBadge ? <Text style={styles.badge}>{eventBadge}</Text> : null}
      </View>
      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatMoney(price)}</Text>
        <Text style={[styles.trend, { color: trendColor }]}>{trendArrow}</Text>
      </View>
      <Text style={styles.qty}>—</Text>
      <Text style={styles.owned}>{owned}</Text>
      <View style={styles.actions}>
        <Pressable
          style={[styles.miniBtn, styles.buyBtn, !canBuy && styles.disabled]}
          onPress={onBuy}
          disabled={!canBuy}
        >
          <Text style={[styles.miniLabel, styles.buyLabel]}>BUY</Text>
        </Pressable>
        <Pressable
          style={[styles.miniBtn, styles.sellBtn, !canSell && styles.disabled]}
          onPress={onSell}
          disabled={!canSell}
        >
          <Text style={[styles.miniLabel, styles.sellLabel]}>SELL</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const AAAMarketRow = memo(AAAMarketRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    gap: 4,
  },
  iconCol: { width: 32, alignItems: 'center' },
  nameCol: { flex: 1, minWidth: 0 },
  name: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badge: {
    color: palette.purpleBright,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
  },
  priceCol: {
    width: 64,
    alignItems: 'flex-end',
  },
  price: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  trend: {
    fontSize: 9,
    fontWeight: '800',
  },
  qty: {
    width: 20,
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
  },
  owned: {
    color: palette.textMuted,
    fontSize: typography.caption,
    width: 28,
    textAlign: 'center',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
    width: 88,
    justifyContent: 'flex-end',
  },
  miniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  buyBtn: {
    borderColor: palette.neon,
    backgroundColor: 'rgba(53, 255, 136, 0.08)',
  },
  sellBtn: {
    borderColor: palette.danger,
    backgroundColor: 'rgba(255, 59, 79, 0.08)',
  },
  disabled: { opacity: 0.35 },
  miniLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  buyLabel: { color: palette.neon },
  sellLabel: { color: palette.danger },
});
