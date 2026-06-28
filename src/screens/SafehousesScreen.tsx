import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, EventBanner, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { EmptyState, EmpirePropertyCard } from '../components/premium';
import { useGame } from '../game/GameContext';
import { SAFEHOUSE_MAP, SAFEHOUSE_TIER_LABELS } from '../data/safehouses';
import {
  getDailySafehouseUpkeep,
  getSafehousesAtLocation,
  getStoredUsed,
  isSafehouseOwned,
} from '../game/safehouseSystem';
import { getPropertyPortfolioSummary } from '../game/propertyManagementSystem';
import { getAreaLabel } from '../data/locations';
import { getCurrentRank } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { palette, spacing, typography } from '../theme/theme';

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
  const portfolio = getPropertyPortfolioSummary(gameState);

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Properties"
          subtitle="Storage · security · guards"
          day={player.day}
          location={getAreaLabel(player.currentCityId, player.currentAreaId)}
          rank={rank.name}
          rankProgress={computeRankProgressPercent(gameState)}
        />
      }
      bottomNav={<GameNavFooter navigation={navigation} active="Empire" />}
    >
      <View style={styles.moneyRow}>
        <MoneyCard label="Properties" amount={String(portfolio.count)} tone="purple" icon="🏠" />
        <MoneyCard label="Storage" amount={String(portfolio.storage)} tone="green" icon="📦" />
        <MoneyCard label="Upkeep" amount={formatMoney(portfolio.upkeep)} tone="amber" icon="💸" />
      </View>

      <ActionMessage message={lastMessage} />

      <EventBanner
        label="Empire Properties"
        message="Upgrade security and assign guards. Hidden compartments protect stored product from seizures."
        tone="green"
      />

      {(ownedSafehouses ?? []).length > 0 ? (
        <SectionCard title="Your Empire" subtitle="Tap for upgrades and guards">
          {(ownedSafehouses ?? []).map((record) => (
            <EmpirePropertyCard
              key={record.safehouseId}
              state={gameState}
              record={record}
              onPress={() => navigation.navigate('PropertyDetail', { safehouseId: record.safehouseId })}
            />
          ))}
        </SectionCard>
      ) : (
        <SectionCard title="Your Empire">
          <EmptyState
            icon="🏠"
            title="No properties yet"
            message="Buy a safehouse on-site to store product off the street. Upgrades expand capacity and reduce raid risk."
          />
        </SectionCard>
      )}

      <SectionCard title="This Area" subtitle={`${local.length} listing(s)`}>
        {local.length === 0 ? (
          <EmptyState icon="📍" title="No listings here" message="Check other districts for available properties." />
        ) : (
          local.map((def) => {
            const owned = isSafehouseOwned(gameState, def.id);
            const stored = getStoredUsed(gameState, def.id);

            return (
              <View key={def.id} style={styles.card}>
                <Text style={styles.name}>{def.name}</Text>
                <Text style={styles.tier}>{SAFEHOUSE_TIER_LABELS[def.tier]}</Text>
                <Text style={styles.desc}>{def.description}</Text>
                <Text style={styles.meta}>
                  Storage {def.storageCapacity} · Heat −{def.heatReductionPerDay}/day
                </Text>
                {owned ? (
                  <>
                    <Text style={styles.owned}>OWNED · {stored} stored · see empire above</Text>
                    <GameButton
                      label="MANAGE PROPERTY"
                      size="sm"
                      variant="secondary"
                      onPress={() => navigation.navigate('PropertyDetail', { safehouseId: def.id })}
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
    </AppShell>
  );
}

const styles = StyleSheet.create({
  moneyRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  card: {
    backgroundColor: palette.bgCard,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  name: { color: palette.text, fontSize: typography.subtitle, fontWeight: '800' },
  tier: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginTop: 2 },
  desc: { color: palette.textSecondary, fontSize: typography.caption, marginTop: 6, lineHeight: 18 },
  meta: { color: palette.textMuted, fontSize: typography.caption, marginTop: 4 },
  owned: { color: palette.neon, fontSize: typography.caption, fontWeight: '700', marginTop: 8 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
