import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Commodity, CommodityId, PriceTrend } from '../types/game';
import { GameButton } from './GameButton';
import { Badge } from './Badge';
import { formatMoney } from '../utils/format';
import { computePriceTrend, trendArrow as trendArrowSymbol } from '../utils/random';
import { colors, fonts, radius, spacing } from '../utils/theme';

interface MarketRowData {
  commodity: Commodity;
  price: number;
  trend: PriceTrend;
  availableQty: number;
  owned: number;
  avgCost: number;
  disabled: boolean;
  onBuy: (qty: number) => void;
  onSell: (qty: number) => void;
}

interface MarketTableProps {
  rows: MarketRowData[];
}

function priceTone(
  price: number,
  commodity: Commodity
): 'cheap' | 'high' | 'fair' {
  const mid = (commodity.minPrice + commodity.maxPrice) / 2;
  if (price <= mid * 0.55) return 'cheap';
  if (price >= mid * 1.8) return 'high';
  return 'fair';
}

function priceToneLabel(tone: 'cheap' | 'high' | 'fair'): string {
  if (tone === 'cheap') return 'BUY LOW';
  if (tone === 'high') return 'SELL HIGH';
  return 'FAIR';
}

function trendColor(trend: PriceTrend): string {
  if (trend === 'up') return colors.accent;
  if (trend === 'down') return colors.danger;
  return colors.textDim;
}

export function MarketTable({ rows }: MarketTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.colItem]}>DRUG</Text>
        <Text style={[styles.headerCell, styles.colPrice]}>PRICE</Text>
        <Text style={[styles.headerCell, styles.colHold]}>YOU</Text>
      </View>

      {rows.map(
        ({
          commodity,
          price,
          trend,
          availableQty,
          owned,
          avgCost,
          disabled,
          onBuy,
          onSell,
        }) => {
          const tone = priceTone(price, commodity);
          return (
            <View key={commodity.id} style={styles.row}>
              <View style={styles.rowTop}>
                <View style={styles.colItem}>
                  <Text style={styles.itemName}>{commodity.name}</Text>
                  <Text style={styles.meta}>
                    Avail {availableQty} · {'▲'.repeat(commodity.riskLevel)}
                    {'▽'.repeat(5 - commodity.riskLevel)}
                  </Text>
                </View>
                <View style={styles.colPrice}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.trend, { color: trendColor(trend) }]}>
                      {trendArrowSymbol(trend)}
                    </Text>
                    <Text style={styles.price}>{formatMoney(price)}</Text>
                  </View>
                  <Badge label={priceToneLabel(tone)} tone={tone} />
                </View>
                <View style={styles.colHold}>
                  <Text style={styles.holdQty}>{owned}</Text>
                  {owned > 0 ? (
                    <Text style={styles.avgCost}>@{formatMoney(avgCost)}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actions}>
                <GameButton label="BUY 1" size="sm" onPress={() => onBuy(1)} disabled={disabled} style={styles.btn} />
                <GameButton label="BUY 5" size="sm" onPress={() => onBuy(5)} disabled={disabled} style={styles.btn} />
                <GameButton label="BUY 10" size="sm" onPress={() => onBuy(10)} disabled={disabled} style={styles.btn} />
                <GameButton label="SELL 1" size="sm" variant="secondary" onPress={() => onSell(1)} disabled={disabled || owned < 1} style={styles.btn} />
                <GameButton label="SELL ALL" size="sm" variant="secondary" onPress={() => onSell(owned)} disabled={disabled || owned < 1} style={styles.btn} />
              </View>
            </View>
          );
        }
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    color: colors.accentDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  colItem: { flex: 2.2 },
  colPrice: { flex: 1.6, alignItems: 'flex-end' },
  colHold: { flex: 0.9, alignItems: 'flex-end' },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemName: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    marginTop: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trend: {
    fontFamily: fonts.mono,
    fontSize: 14,
    fontWeight: '700',
  },
  price: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  holdQty: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 15,
    fontWeight: '700',
  },
  avgCost: {
    color: colors.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    textAlign: 'right',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  btn: {
    flexGrow: 1,
    minWidth: '18%',
    marginVertical: 0,
  },
});

export function buildMarketRowTrend(
  commodityId: CommodityId,
  price: number,
  priceHistory: number[] | undefined
) {
  return computePriceTrend(price, priceHistory);
}
