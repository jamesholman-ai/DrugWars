import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameNavFooter } from '../components/GameNavFooter';
import { TradeQuantityModal } from '../components/TradeQuantityModal';
import {
  AAAMarketRow,
  AAAFinanceRow,
  AAACommandShell,
  BackgroundImageCard,
} from '../components/aaa';
import { SkeletonShimmer } from '../components/premium';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import { COMMODITIES } from '../data/commodities';
import { getAreaLabel, getPlayerAreaKey } from '../data/locations';
import { CommodityId, RootStackParamList } from '../types/game';
import { getCommodityWorldEventBadge, getMarketPriceChange } from '../utils/marketPriceDisplay';
import { getCityMaster } from '../assets/imageRegistry';
import {
  getAreaMarketEventTag,
  getPlayerDailyAvailability,
  hasLocalBuyers,
  isDrugAvailableToBuy,
} from '../game/marketAvailabilitySystem';
import { EmptyState } from '../components/premium';
import { palette, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Market'>;

interface PendingTrade {
  mode: 'buy' | 'sell';
  commodityId: CommodityId;
  commodityName: string;
  maxQty: number;
  unitPrice: number;
}

export function MarketScreen({ navigation }: Props) {
  const { gameState, buy, sell } = useGame();
  const [pendingTrade, setPendingTrade] = useState<PendingTrade | null>(null);

  useEffect(() => {
    if (!gameState) {
      navigation.replace('Home');
    }
  }, [gameState, navigation]);

  const openTrade = useCallback(
    (mode: 'buy' | 'sell', commodityId: CommodityId, commodityName: string, owned: number, price: number, disabled: boolean) => {
      if (disabled) return;
      const maxQty =
        mode === 'buy'
          ? Math.max(1, Math.floor(gameState!.player.cash / Math.max(price, 1)))
          : owned;
      if (maxQty <= 0) return;
      setPendingTrade({ mode, commodityId, commodityName, maxQty, unitPrice: price });
    },
    [gameState]
  );

  const rows = useMemo(() => {
    if (!gameState) return { rows: [], areaLabel: '', availableCount: 0 };
    const { player, priceHistory, activeWorldEvents } = gameState;
    const areaKey = getPlayerAreaKey(player);
    const prices = gameState.marketPrices[areaKey] ?? {};
    const history = priceHistory[areaKey] ?? {};
    const events = activeWorldEvents ?? [];
    const availableToday = getPlayerDailyAvailability(gameState);
    const areaLabel = getAreaLabel(player.currentCityId, player.currentAreaId);

    const rows = COMMODITIES.map((commodity) => {
      const inv = player.inventory.find((i) => i.commodityId === commodity.id);
      const price = prices[commodity.id] ?? 0;
      const owned = inv?.quantity ?? 0;
      const disabled = player.isGameOver;
      const buyable = isDrugAvailableToBuy(gameState, commodity.id);
      const canAfford = player.cash >= price;
      const hasStock = owned > 0;
      const localBuyers = hasLocalBuyers(gameState, commodity.id);
      const priceChange = getMarketPriceChange(price, history[commodity.id]);
      const localTag = getAreaMarketEventTag(gameState, commodity.id);
      const eventBadge =
        localTag ?? getCommodityWorldEventBadge(events, areaKey, commodity.id);

      return {
        commodity,
        price,
        priceChange,
        eventBadge: eventBadge ?? undefined,
        owned,
        buyable,
        localBuyers,
        showRow: buyable || hasStock,
        canBuy: !disabled && buyable && canAfford && price > 0,
        canSell: !disabled && hasStock && localBuyers && price > 0,
        sellBlocked: hasStock && !localBuyers,
        onBuy: () =>
          openTrade('buy', commodity.id, commodity.name, owned, price, disabled || !buyable || !canAfford),
        onSell: () =>
          openTrade('sell', commodity.id, commodity.name, owned, price, disabled || !hasStock || !localBuyers),
      };
    }).filter((row) => row.showRow);

    return { rows, areaLabel, availableCount: availableToday.length };
  }, [gameState, openTrade]);

  if (!gameState) {
    return (
      <AAACommandShell scroll={false}>
        <SkeletonShimmer lines={3} height={120} />
      </AAACommandShell>
    );
  }

  const { player } = gameState;
  const headerArt = getCityMaster(player.currentCityId);
  const netWorth = getNetWorth(player, gameState.marketPrices);
  const marketRows = rows.rows;
  const areaLabel = rows.areaLabel;
  const availableCount = rows.availableCount;

  return (
    <>
      <AAACommandShell footer={<GameNavFooter navigation={navigation} active="Market" />}>
        <BackgroundImageCard
          art={headerArt}
          focalPoint="center"
          overlayStrength={0.35}
          height={100}
        >
          <Text style={styles.heroLabel}>MARKET</Text>
          <Text style={styles.heroSub}>{areaLabel.toUpperCase()}</Text>
          <Text style={styles.availLine}>
            Available today in {areaLabel}: {availableCount} drugs
          </Text>
        </BackgroundImageCard>

        <AAAFinanceRow
          cash={player.cash}
          debt={player.debt}
          netWorth={netWorth}
        />

        <ActionMessage message={gameState.lastMessage} />

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.thIcon]} />
          <Text style={[styles.th, styles.thName]}>DRUG</Text>
          <Text style={styles.th}>PRICE / TREND</Text>
          <Text style={styles.th}>QTY</Text>
          <Text style={styles.th}>YOU OWN</Text>
          <Text style={[styles.th, styles.thAction]}>ACTION</Text>
        </View>
        <Text style={styles.trendHelp}>
          Trend compares today&apos;s price to the last known price in this area.
        </Text>

        {marketRows.length === 0 ? (
          <EmptyState
            title="Supply is dry"
            message="Supply is dry in this area today. Travel to another district or wait for the next day."
          />
        ) : (
          marketRows.map((row) => (
            <View key={row.commodity.id}>
              <AAAMarketRow
                commodityId={row.commodity.id}
                name={row.commodity.name}
                price={row.price}
                trend={row.priceChange.trend}
                hasTrendHistory={row.priceChange.hasHistory}
                isNewListing={row.buyable && !row.priceChange.hasHistory}
                owned={row.owned}
                canBuy={row.canBuy}
                canSell={row.canSell}
                eventBadge={row.eventBadge ?? undefined}
                onBuy={row.onBuy}
                onSell={row.onSell}
              />
              {row.sellBlocked ? (
                <Text style={styles.noBuyer}>No local buyer today</Text>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.hint}>Tap Buy or Sell to choose quantity.</Text>
      </AAACommandShell>

      <TradeQuantityModal
        visible={pendingTrade != null}
        mode={pendingTrade?.mode ?? 'buy'}
        commodityName={pendingTrade?.commodityName}
        maxQty={pendingTrade?.maxQty ?? 0}
        unitPrice={pendingTrade?.unitPrice}
        onClose={() => setPendingTrade(null)}
        onConfirm={(qty) => {
          if (!pendingTrade) return;
          if (pendingTrade.mode === 'buy') buy(pendingTrade.commodityId, qty);
          else sell(pendingTrade.commodityId, qty);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heroLabel: {
    color: palette.neon,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 2,
  },
  heroSub: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  availLine: {
    color: palette.gold,
    fontSize: typography.caption,
    marginTop: 4,
  },
  noBuyer: {
    color: palette.amber,
    fontSize: typography.caption,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderBright,
    marginBottom: spacing.xs,
  },
  th: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    flex: 1,
    textAlign: 'center',
  },
  thIcon: { flex: 0, width: 32 },
  thName: { flex: 1.2, textAlign: 'left' },
  thAction: { flex: 1.1, textAlign: 'right' },
  trendHelp: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  hint: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
});
