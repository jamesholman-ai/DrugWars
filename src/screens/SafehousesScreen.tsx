import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import { SAFEHOUSE_MAP, SAFEHOUSE_TIER_LABELS } from '../data/safehouses';
import {
  getDailySafehouseUpkeep,
  getSafehousesAtLocation,
  getStoredUsed,
  isSafehouseOwned,
} from '../game/safehouseSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Safehouses'>;

export function SafehousesScreen({ navigation }: Props) {
  const { gameState, purchaseSafehouse } = useGame();

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, lastMessage, ownedSafehouses } = gameState;
  const rank = getCurrentRank(gameState);
  const local = getSafehousesAtLocation(gameState, player.currentCityId, player.currentAreaId);
  const upkeep = getDailySafehouseUpkeep(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Properties"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Progress" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Cash" amount={formatMoney(player.cash)} tone="green" icon="💵" />
        <MoneyCard label="Upkeep" amount={formatMoney(upkeep)} tone="amber" icon="🏠" />
      </View>

      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Empire Properties"
        message="Buy on-site. Store product via the Storage tab. Use Property action on Status to cool heat."
        tone="green"
      />

      <SectionCard title="This Area" subtitle={`${local.length} listing(s)`}>
        {local.length === 0 ? (
          <Text style={styles.empty}>No properties listed in this district.</Text>
        ) : (
          local.map((def) => {
            const owned = isSafehouseOwned(gameState, def.id);
            const stored = getStoredUsed(gameState, def.id);
            const record = (ownedSafehouses ?? []).find((o) => o.safehouseId === def.id);

            return (
              <View key={def.id} style={styles.card}>
                <Text style={styles.name}>{def.name}</Text>
                <Text style={styles.tier}>{SAFEHOUSE_TIER_LABELS[def.tier]}</Text>
                <Text style={styles.desc}>{def.description}</Text>
                <Text style={styles.meta}>
                  Storage {def.storageCapacity} · Heat −{def.heatReductionPerDay}/day · Robbery −
                  {Math.round(def.robberyProtection * 100)}%
                </Text>
                {owned ? (
                  <>
                    <Text style={styles.owned}>
                      OWNED · {stored}/{def.storageCapacity} stored · Condition{' '}
                      {record?.condition ?? 100}%
                    </Text>
                    <GameButton
                      label="MANAGE STORAGE"
                      size="sm"
                      variant="secondary"
                      onPress={() => navigation.navigate('Inventory')}
                      style={styles.btn}
                    />
                  </>
                ) : (
                  <GameButton
                    label={`BUY ${formatMoney(def.purchaseCost)}`}
                    size="sm"
                    disabled={player.isGameOver || player.cash < def.purchaseCost}
                    onPress={() => purchaseSafehouse(def.id)}
                    style={styles.btn}
                  />
                )}
              </View>
            );
          })
        )}
      </SectionCard>

      {(ownedSafehouses ?? []).length > 0 ? (
        <SectionCard title="Your Empire" subtitle={`${ownedSafehouses!.length} properties`}>
          {(ownedSafehouses ?? []).map((o) => {
            const def = SAFEHOUSE_MAP[o.safehouseId];
            const name = def?.name ?? o.safehouseId;
            const stored = getStoredUsed(gameState, o.safehouseId);
            return (
              <Text key={o.safehouseId} style={styles.ownedLine}>
                {name} · {stored}/{def?.storageCapacity ?? '?'} stored · condition {o.condition}%
              </Text>
            );
          })}
        </SectionCard>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  empty: { color: palette.textMuted, fontSize: 12 },
  card: {
    backgroundColor: palette.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  name: {
    color: palette.text,
    fontFamily: fonts.display,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tier: { color: palette.neon, fontSize: 9, fontWeight: '800', marginTop: 2 },
  desc: { color: palette.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 },
  meta: { color: palette.textMuted, fontSize: 10, marginTop: 4 },
  owned: { color: palette.neon, fontSize: 10, fontWeight: '700', marginTop: 6 },
  ownedLine: { color: palette.textSecondary, fontSize: 11, marginBottom: 4 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
