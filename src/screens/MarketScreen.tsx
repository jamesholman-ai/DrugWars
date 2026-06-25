import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { EventModal } from '../components/EventModal';
import { GameNavFooter } from '../components/GameNavFooter';
import { TradeQuantityModal } from '../components/TradeQuantityModal';
import { AppShell, MarketCard, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import { getNetWorth } from '../game/economy';
import { getCurrentRank } from '../game/progression';
import { COMMODITIES } from '../data/commodities';
import { getAreaLabel, getPlayerAreaKey } from '../data/locations';
import { CommodityId, RootStackParamList } from '../types/game';
import { commodityIcon } from '../utils/commodityIcons';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { getCommodityWorldEventBadge, getMarketPriceChange } from '../utils/marketPriceDisplay';
import { fonts, palette, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Market'>;

interface PendingTrade {
  mode: 'buy' | 'sell';
  commodityId: CommodityId;
  commodityName: string;
  maxQty: number;
  unitPrice: number;
}

export function MarketScreen({ navigation }: Props) {
  const { gameState, buy, sell, resolveEventChoice } = useGame();
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

  const headerData = useMemo(() => {
    if (!gameState) return null;
    const { player } = gameState;
    return {
      day: player.day,
      location: getAreaLabel(player.currentCityId, player.currentAreaId),
      rank: getCurrentRank(gameState).name,
      rankProgress: computeRankProgressPercent(gameState),
      cash: formatMoney(player.cash),
      debt: formatMoney(player.debt),
      netWorth: formatMoney(getNetWorth(player, gameState.marketPrices)),
    };
  }, [gameState]);

  const rows = useMemo(() => {
    if (!gameState) return [];
    const { player, priceHistory, activeWorldEvents } = gameState;
    const areaKey = getPlayerAreaKey(player);
    const prices = gameState.marketPrices[areaKey] ?? {};
    const history = priceHistory[areaKey] ?? {};
    const events = activeWorldEvents ?? [];

    return COMMODITIES.map((commodity) => {
      const inv = player.inventory.find((i) => i.commodityId === commodity.id);
      const price = prices[commodity.id] ?? 0;
      const owned = inv?.quantity ?? 0;
      const disabled = player.isGameOver;
      const canAfford = player.cash >= price;
      const hasStock = owned > 0;
      const priceChange = getMarketPriceChange(price, history[commodity.id]);

      return {
        commodity,
        price,
        priceChange,
        eventBadge: getCommodityWorldEventBadge(events, areaKey, commodity.id),
        owned,
        canBuy: !disabled && canAfford,
        canSell: !disabled && hasStock,
        onBuy: () =>
          openTrade('buy', commodity.id, commodity.name, owned, price, disabled || !canAfford),
        onSell: () =>
          openTrade('sell', commodity.id, commodity.name, owned, price, disabled || !hasStock),
      };
    });
  }, [gameState, openTrade]);

  if (!gameState || !headerData) {
    return null;
  }

  return (
    <>
    <AppShell
      header={
        <ScreenHeader
          title="Market"
          day={headerData.day}
          location={headerData.location}
          rank={headerData.rank}
          rankProgress={headerData.rankProgress}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Market" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Available Cash" amount={headerData.cash} tone="green" icon="💵" />
        <MoneyCard label="Debt" amount={headerData.debt} tone="red" icon="🔒" />
        <MoneyCard label="Net" amount={headerData.netWorth} tone="purple" icon="🏦" />
      </View>

      <ActionMessage message={gameState.lastMessage} />

      <SectionCard
        title="Price Board"
        subtitle="▲ rising · ▼ falling · ◆ flat · vs last update"
      >
        {rows.map((row) => (
          <MarketCard
            key={row.commodity.id}
            name={row.commodity.name}
            icon={commodityIcon(row.commodity.id)}
            price={row.price}
            priceChange={row.priceChange}
            eventBadge={row.eventBadge}
            ownedQty={row.owned}
            canBuy={row.canBuy}
            canSell={row.canSell}
            onBuy={row.onBuy}
            onSell={row.onSell}
          />
        ))}
      </SectionCard>

      <Text style={styles.hint}>Tap BUY or SELL to choose quantity.</Text>
    </AppShell>

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

    <EventModal
      event={gameState.pendingEvent}
      onChoice={(choiceId) => resolveEventChoice(choiceId)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hint: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
