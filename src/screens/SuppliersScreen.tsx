import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameNavFooter } from '../components/GameNavFooter';
import {
  AppShell,
  EventBanner,
  MoneyCard,
  ScreenHeader,
  SectionCard,
  SupplierOfferCard,
} from '../components/ui';
import { useGame } from '../game/GameContext';
import { SUPPLIER_MAP } from '../data/suppliers';
import { getAreaLabel, getPlayerAreaKey } from '../data/locations';
import {
  getEffectiveDiscount,
  getRelationship,
  getSupplierUnitPrice,
  getSuppliersAtLocation,
} from '../game/supplierSystem';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Suppliers'>;

export function SuppliersScreen({ navigation }: Props) {
  const { gameState, buyFromSupplier } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, supplierOffers } = gameState;
  const suppliers = getSuppliersAtLocation(
    gameState,
    player.currentCityId,
    player.currentAreaId
  );
  const areaKey = getPlayerAreaKey(player);
  const prices = gameState.marketPrices[areaKey] ?? {};
  const rank = getCurrentRank(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Suppliers"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Suppliers" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Cash" amount={formatMoney(player.cash)} tone="green" icon="💵" />
        <MoneyCard label="Heat" amount={`${player.heat}%`} tone="amber" icon="🔥" />
      </View>

      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Supplier Deals"
        message="Higher trust = better prices. Cartel & airport contacts carry extra risk. Stay or travel to refresh offers."
        tone="purple"
      />

      {suppliers.length === 0 ? (
        <SectionCard title="No Suppliers Here" subtitle="Move to another area or rank up">
          <Text style={styles.empty}>
            No supplier contacts in this area yet. Try downtown, port, or club districts in unlocked cities.
          </Text>
        </SectionCard>
      ) : (
        <SectionCard title="Local Suppliers" subtitle={`${suppliers.length} contact(s) in area`}>
          {suppliers.map((supplier) => {
            const rel = getRelationship(gameState, supplier.id);
            const discount = getEffectiveDiscount(gameState, supplier, rel);
            const offer = (supplierOffers ?? []).find((o) => o.supplierId === supplier.id);
            const drug = offer?.commodityId ?? supplier.specialtyDrugs[0];
            const marketPrice = prices[drug];
            const qty = offer?.quantity ?? 6;
            const unitPrice =
              offer?.unitPrice ??
              (marketPrice
                ? getSupplierUnitPrice(gameState, supplier, drug, marketPrice)
                : 0);
            const totalCost = unitPrice * qty;
            const canAfford = player.cash >= totalCost;

            return (
              <SupplierOfferCard
                key={supplier.id}
                supplier={supplier}
                offer={offer}
                trust={rel.trust}
                discountPct={discount}
                marketPrice={marketPrice}
                disabled={player.isGameOver || !canAfford}
                onBuy={() => buyFromSupplier(supplier.id, drug, qty)}
              />
            );
          })}
        </SectionCard>
      )}

      {(supplierOffers ?? []).length > 0 ? (
        <SectionCard title="Incoming Messages" tone="green">
          {(supplierOffers ?? []).map((offer) => {
            const supplier = SUPPLIER_MAP[offer.supplierId];
            if (!supplier) return null;
            return (
              <Text key={offer.id} style={styles.message}>
                {offer.message}
              </Text>
            );
          })}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  empty: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  message: {
    color: palette.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
});
