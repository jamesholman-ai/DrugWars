import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameNavFooter } from '../components/GameNavFooter';
import { TradeQuantityModal } from '../components/TradeQuantityModal';
import { AppShell, ScreenHeader, SectionCard, StatBar } from '../components/ui';
import { useGame } from '../game/GameContext';
import { getInventoryUsed } from '../game/economy';
import { getCurrentRank } from '../game/progression';
import { COMMODITY_MAP } from '../data/commodities';
import { getAreaLabel, getPlayerAreaKey } from '../data/locations';
import { getEffectivePropertyStats, getEffectiveStorageCapacity } from '../game/propertyManagementSystem';
import {
  getLocalOwnedSafehouse,
  getStoredInventory,
  getStoredUsed,
} from '../game/safehouseSystem';
import { RootStackParamList, CommodityId } from '../types/game';
import { commodityIcon } from '../utils/commodityIcons';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

interface PendingTransfer {
  mode: 'deposit' | 'withdraw';
  commodityId: CommodityId;
  commodityName: string;
  maxQty: number;
  propertyId: string;
}

export function InventoryScreen({ navigation }: Props) {
  const { gameState, depositToSafehouse, withdrawFromSafehouse } = useGame();
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage } = gameState;
  const used = getInventoryUsed(player);
  const prices = gameState.marketPrices[getPlayerAreaKey(player)] ?? {};
  const rank = getCurrentRank(gameState);
  const localSh = getLocalOwnedSafehouse(gameState);
  const stored = localSh ? getStoredInventory(gameState, localSh.def.id) : [];
  const storedUsed = localSh ? getStoredUsed(gameState, localSh.def.id) : 0;
  const propertyStats = localSh?.owned
    ? getEffectivePropertyStats(gameState, localSh.owned)
    : null;
  const propertyCapacity = localSh
    ? getEffectiveStorageCapacity(gameState, localSh.def.id)
    : 0;

  return (
    <>
    <AppShell
      header={
        <ScreenHeader
          title="Storage"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Empire" />}
    >
      <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Safehouses')}>
        <Text style={styles.linkText}>Properties & off-street storage →</Text>
      </Pressable>

      <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Upgrades')}>
        <Text style={styles.linkText}>Upgrades · capacity · gear →</Text>
      </Pressable>

      <ActionMessage message={lastMessage} />

      <SectionCard title="Carried" subtitle={`${used} / ${player.inventoryCapacity} units on you`}>
        <StatBar label="Load" value={used} max={player.inventoryCapacity} color={palette.neon} />
        {player.inventory.length === 0 ? (
          <Text style={styles.empty}>Nothing carried. Buy from Market.</Text>
        ) : (
          player.inventory.map((item) => {
            const def = COMMODITY_MAP[item.commodityId];
            const value = (prices[item.commodityId] ?? 0) * item.quantity;
            return (
              <View key={item.commodityId} style={styles.row}>
                <Text style={styles.icon}>{commodityIcon(item.commodityId)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.name}>{def?.name ?? item.commodityId}</Text>
                  <Text style={styles.meta}>
                    {item.quantity} units · ~{formatMoney(value)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </SectionCard>

      {localSh ? (
        <SectionCard
          title="Property Storage"
          subtitle={`${localSh.def.name} · ${storedUsed}/${propertyCapacity} stored${propertyStats ? ` · Security L${propertyStats.securityLevel}` : ''}`}
        >
          {stored.length === 0 ? (
            <Text style={styles.empty}>Nothing stored here yet.</Text>
          ) : (
            stored.map((item) => (
              <View key={item.commodityId} style={styles.row}>
                <Text style={styles.icon}>{commodityIcon(item.commodityId)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.name}>
                    {COMMODITY_MAP[item.commodityId]?.name ?? item.commodityId}
                  </Text>
                  <Text style={styles.meta}>{item.quantity} units stored</Text>
                </View>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                    setPendingTransfer({
                      mode: 'withdraw',
                      commodityId: item.commodityId,
                      commodityName: COMMODITY_MAP[item.commodityId]?.name ?? item.commodityId,
                      maxQty: item.quantity,
                      propertyId: localSh.def.id,
                    })
                  }
                >
                  <Text style={styles.actionText}>WITHDRAW</Text>
                </Pressable>
              </View>
            ))
          )}

          {player.inventory.map((item) => (
            <View key={`dep-${item.commodityId}`} style={styles.row}>
              <Text style={styles.icon}>{commodityIcon(item.commodityId)}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.name}>
                  Deposit {COMMODITY_MAP[item.commodityId]?.name ?? item.commodityId}
                </Text>
                <Text style={styles.meta}>{item.quantity} carried</Text>
              </View>
              <Pressable
                style={styles.actionBtn}
                onPress={() =>
                  setPendingTransfer({
                    mode: 'deposit',
                    commodityId: item.commodityId,
                    commodityName: COMMODITY_MAP[item.commodityId]?.name ?? item.commodityId,
                    maxQty: item.quantity,
                    propertyId: localSh.def.id,
                  })
                }
              >
                <Text style={styles.actionText}>DEPOSIT</Text>
              </Pressable>
            </View>
          ))}
        </SectionCard>
      ) : (
        <SectionCard title="Property Storage" subtitle="No property in this area">
          <Text style={styles.empty}>
            Buy a property here to store product off the street.
          </Text>
        </SectionCard>
      )}
    </AppShell>

    <TradeQuantityModal
      visible={pendingTransfer != null}
      mode={pendingTransfer?.mode ?? 'deposit'}
      commodityName={pendingTransfer?.commodityName}
      maxQty={pendingTransfer?.maxQty ?? 0}
      onClose={() => setPendingTransfer(null)}
      onConfirm={(qty) => {
        if (!pendingTransfer) return;
        if (pendingTransfer.mode === 'deposit') {
          depositToSafehouse(pendingTransfer.propertyId, pendingTransfer.commodityId, qty);
        } else {
          withdrawFromSafehouse(pendingTransfer.propertyId, pendingTransfer.commodityId, qty);
        }
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  linkRow: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  linkText: {
    color: palette.neon,
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    color: palette.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  icon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: palette.neonDim,
    backgroundColor: palette.neonSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  actionText: {
    color: palette.neon,
    fontSize: 8,
    fontWeight: '800',
  },
});
