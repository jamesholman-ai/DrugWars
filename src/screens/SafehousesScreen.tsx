import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameNavFooter } from '../components/GameNavFooter';
import {
  AAACommandShell,
  BackgroundImageCard,
} from '../components/aaa';
import { EventBanner, FilterChips, SectionCard } from '../components/ui';
import {
  EmptyState,
  EmpirePropertyCard,
  PropertyListingCard,
  getPropertyLockReason,
  SectionHeader,
} from '../components/premium';
import { useGame } from '../game/GameContext';
import {
  getSafehousesAtLocation,
  isSafehouseOwned,
} from '../game/safehouseSystem';
import { getPropertyPortfolioSummary } from '../game/propertyManagementSystem';
import { getPropertyDef } from '../game/propertyPoolSystem';
import { getAreaLabel } from '../data/locations';
import { isCityUnlocked } from '../game/progression';
import { RootStackParamList } from '../types/game';
import { SafehouseDefinition } from '../types/safehouses';
import { formatMoney } from '../utils/format';
import { getCityMaster } from '../assets/imageRegistry';
import { AppIcon, AppIcons } from '../theme/icons';
import { palette, spacing, typography } from '../theme/theme';
import { RANKS } from '../data/progression';
import { RankId } from '../types/progression';

type Props = NativeStackScreenProps<RootStackParamList, 'Safehouses'>;
type PropertyTab = 'rentals' | 'sale' | 'owned' | 'storage';

const TAB_OPTIONS: { id: PropertyTab; label: string }[] = [
  { id: 'rentals', label: 'Rentals' },
  { id: 'sale', label: 'For Sale' },
  { id: 'owned', label: 'Owned / Rented' },
  { id: 'storage', label: 'Storage' },
];

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function meetsUnlock(state: Parameters<typeof getPropertyLockReason>[0], def: SafehouseDefinition): boolean {
  if (!isCityUnlocked(state, def.cityId)) return false;
  if (def.minRank && rankIndex(state.progression.rankId) < rankIndex(def.minRank)) return false;
  if (def.minReputation != null && state.player.reputation < def.minReputation) return false;
  return true;
}

export function SafehousesScreen({ navigation }: Props) {
  const { gameState, purchaseSafehouse, rentSafehouse } = useGame();
  const [tab, setTab] = useState<PropertyTab>('rentals');

  useEffect(() => {
    if (!gameState) navigation.replace('Home');
  }, [gameState, navigation]);

  const listings = useMemo(() => {
    if (!gameState) return [];
    const { player } = gameState;
    return getSafehousesAtLocation(gameState, player.currentCityId, player.currentAreaId);
  }, [gameState]);

  const filtered = useMemo(() => {
    if (!gameState) return [];
    const ownedIds = new Set((gameState.ownedSafehouses ?? []).map((o) => o.safehouseId));

    if (tab === 'owned') {
      return (gameState.ownedSafehouses ?? [])
        .map((o) => getPropertyDef(gameState, o.safehouseId))
        .filter((d): d is SafehouseDefinition => d != null);
    }
    if (tab === 'rentals') {
      return listings.filter((d) => d.listingMode === 'rent' && !ownedIds.has(d.id));
    }
    if (tab === 'sale') {
      return listings.filter((d) => d.listingMode === 'sale' && !ownedIds.has(d.id));
    }
    return listings.filter((d) => d.category === 'storage_sites' && !ownedIds.has(d.id));
  }, [gameState, listings, tab]);

  if (!gameState) return null;

  const { player, lastMessage, ownedSafehouses } = gameState;
  const portfolio = getPropertyPortfolioSummary(gameState);
  const heroArt = getCityMaster(player.currentCityId);
  const locationLabel = getAreaLabel(player.currentCityId, player.currentAreaId);

  return (
    <AAACommandShell footer={<GameNavFooter navigation={navigation} active="Empire" />}>
      <BackgroundImageCard
        art={heroArt}
        focalPoint="center"
        overlayStrength={0.35}
        height={120}
      >
        <Text style={styles.heroLabel}>PROPERTIES</Text>
        <Text style={styles.heroDistrict}>{locationLabel.toUpperCase()}</Text>
      </BackgroundImageCard>

      <View style={styles.statRow}>
        <View style={styles.statChip}>
          <AppIcon name="property" size={16} color={palette.purpleBright} />
          <Text style={styles.statValue}>{portfolio.count}</Text>
          <Text style={styles.statLabel}>Owned</Text>
        </View>
        <View style={styles.statChip}>
          <AppIcon name="storage" size={16} color={palette.neon} />
          <Text style={styles.statValue}>{portfolio.storage}</Text>
          <Text style={styles.statLabel}>Storage</Text>
        </View>
        <View style={styles.statChip}>
          <AppIcon name="cash" size={16} color={palette.amber} />
          <Text style={styles.statValue}>{formatMoney(portfolio.dailyCost)}</Text>
          <Text style={styles.statLabel}>Daily</Text>
        </View>
      </View>

      <ActionMessage message={lastMessage} />

      <FilterChips options={TAB_OPTIONS} value={tab} onChange={setTab} />

      <EventBanner
        label="Find Place"
        message="Rent cheap early. Buy homes for upkeep instead of rent. Storage sites hold bulk off the street."
        tone="green"
      />

      {tab === 'owned' && (ownedSafehouses ?? []).length > 0 ? (
        <SectionCard title="Your Portfolio" subtitle="Tap for upgrades, guards, storage">
          {(ownedSafehouses ?? []).map((record) => (
            <EmpirePropertyCard
              key={record.safehouseId}
              state={gameState}
              record={record}
              onPress={() => navigation.navigate('PropertyDetail', { safehouseId: record.safehouseId })}
            />
          ))}
        </SectionCard>
      ) : null}

      <SectionHeader
        title={tab === 'owned' ? 'All Holdings' : 'District Listings'}
        subtitle={`${filtered.length} in ${locationLabel}`}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'storage' ? AppIcons.storage : AppIcons.property}
          title={tab === 'owned' ? 'No properties yet' : 'No listings here'}
          message={
            tab === 'owned'
              ? 'Use Find Place tabs to rent a room or buy a safehouse in this district.'
              : 'Travel to another district or advance the day for fresh listings.'
          }
        />
      ) : (
        <View>
          {filtered.map((def) => {
            const owned = isSafehouseOwned(gameState, def.id);
            const unlockOk = meetsUnlock(gameState, def);
            const cashLock = getPropertyLockReason(gameState, def);
            const locked = !unlockOk || (!owned && cashLock != null);
            const lockReason = !unlockOk
              ? def.minRank
                ? `Requires ${RANKS.find((r) => r.id === def.minRank)?.name ?? def.minRank}`
                : `Requires ${def.minReputation} reputation`
              : cashLock ?? undefined;

            return (
              <PropertyListingCard
                key={def.id}
                state={gameState}
                def={def}
                owned={owned}
                locked={locked || player.isGameOver}
                lockReason={lockReason}
                onRent={() => rentSafehouse(def.id)}
                onBuy={() => purchaseSafehouse(def.id)}
                onManage={() => navigation.navigate('PropertyDetail', { safehouseId: def.id })}
              />
            );
          })}
        </View>
      )}
    </AAACommandShell>
  );
}

const styles = StyleSheet.create({
  heroLabel: {
    color: palette.purpleBright,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroDistrict: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    flex: 1,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
});
