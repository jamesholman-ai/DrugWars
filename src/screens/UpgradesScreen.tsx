import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActionMessage } from '../components/ActionMessage';
import { GameButton } from '../components/GameButton';
import { GameNavFooter } from '../components/GameNavFooter';
import { AppShell, MoneyCard, ScreenHeader, SectionCard } from '../components/ui';
import { useGame } from '../game/GameContext';
import { getCurrentRank, getNextInventoryUpgrade, isCityUnlocked } from '../game/progression';
import { INVENTORY_UPGRADES, STASH_HOUSES } from '../data/progression';
import { EQUIPMENT } from '../data/equipment';
import { EquipmentType } from '../types/equipment';
import { computeAttackScore, computeDefenseScore } from '../game/combat';
import { CITY_MAP } from '../data/locations';
import { RootStackParamList } from '../types/game';
import { formatMoney } from '../utils/format';
import { computeRankProgressPercent } from '../utils/rankProgress';
import { getAreaLabel } from '../data/locations';
import { fonts, palette, radius, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Upgrades'>;
type UpgradeTab = 'stash' | 'hideout' | 'weapons' | 'armor' | 'gear';

export function UpgradesScreen({ navigation }: Props) {
  const { gameState, purchaseInventoryUpgrade, purchaseStashHouse, purchaseEquipment } = useGame();
  const [tab, setTab] = useState<UpgradeTab>('stash');

  useEffect(() => {
    if (!gameState) {
      navigation.replace('Home');
    }
  }, [gameState, navigation]);

  if (!gameState) return null;

  const { player, progression, lastMessage } = gameState;
  const nextUpgrade = getNextInventoryUpgrade(progression);
  const purchased = new Set(progression.purchasedInventoryUpgrades);
  const ownedStash = new Set(progression.ownedStashHouses);
  const rank = getCurrentRank(gameState);
  const attack = computeAttackScore(gameState);
  const defense = computeDefenseScore(gameState);
  const equipmentCounts = (gameState.equipment ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.equipmentId] = (acc[e.equipmentId] ?? 0) + 1;
    return acc;
  }, {});

  const tabLabels: Record<UpgradeTab, string> = {
    stash: 'CAPACITY',
    hideout: 'HIDEOUT',
    weapons: 'WEAPONS',
    armor: 'ARMOR',
    gear: 'GEAR',
  };

  const filterType = (type: EquipmentType): UpgradeTab | null => {
    if (type === 'weapon') return 'weapons';
    if (type === 'armor') return 'armor';
    return 'gear';
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Upgrades"
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
        <MoneyCard label="ATK/DEF" amount={`${attack}/${defense}`} tone="purple" icon="⚔" />
      </View>

      <ActionMessage message={lastMessage} />

      <View style={styles.tabs}>
        {(['stash', 'hideout', 'weapons', 'armor', 'gear'] as UpgradeTab[]).map((key) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]} numberOfLines={1}>
              {tabLabels[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'stash' ? (
        <SectionCard title="Inventory Upgrades" subtitle="Buy in order">
          {INVENTORY_UPGRADES.map((upgrade) => {
            const owned = purchased.has(upgrade.id);
            const isNext = nextUpgrade?.id === upgrade.id;
            const locked = !owned && !isNext;
            const canBuy = isNext && player.cash >= upgrade.cost;

            return (
              <UpgradeRow
                key={upgrade.id}
                icon="▣"
                title={upgrade.name}
                description={upgrade.description}
                meta={`+${upgrade.capacityBonus} capacity · ${formatMoney(upgrade.cost)}`}
                price={formatMoney(upgrade.cost)}
                locked={locked}
                owned={owned}
                canBuy={canBuy}
                onBuy={purchaseInventoryUpgrade}
                buyLabel={isNext ? 'BUY' : 'LOCKED'}
              />
            );
          })}
        </SectionCard>
      ) : tab === 'hideout' ? (
        <SectionCard title="Hideouts" subtitle="Per city · reduces robbery risk">
          {STASH_HOUSES.map((stash) => {
            const owned = ownedStash.has(stash.id);
            const cityUnlocked = isCityUnlocked(gameState, stash.cityId);
            const cityName = CITY_MAP[stash.cityId]?.name ?? stash.cityId;
            const canBuy = cityUnlocked && player.cash >= stash.cost;

            return (
              <UpgradeRow
                key={stash.id}
                icon="🏠"
                title={stash.name}
                description={stash.description}
                meta={`${cityName} · +${stash.capacityBonus} cap · −${Math.round(stash.robberyReduction * 100)}% robbery`}
                price={formatMoney(stash.cost)}
                locked={!cityUnlocked && !owned}
                owned={owned}
                canBuy={canBuy}
                onBuy={() => purchaseStashHouse(stash.id)}
                buyLabel={!cityUnlocked ? 'CITY LOCKED' : 'BUY'}
              />
            );
          })}
        </SectionCard>
      ) : (
        <SectionCard
          title={tab === 'weapons' ? 'Weapons' : tab === 'armor' ? 'Armor' : 'Protection Gear'}
          subtitle="Combat & survival modifiers"
        >
          {EQUIPMENT.filter((item) => filterType(item.type) === tab).map((item) => {
            const owned = equipmentCounts[item.id] ?? 0;
            const canBuy = player.cash >= item.cost;

            return (
              <UpgradeRow
                key={item.id}
                icon={item.type === 'weapon' ? '🔫' : item.type === 'armor' ? '🛡' : '📋'}
                title={item.name}
                description={item.description}
                meta={`${item.effectText}${item.maxUses ? ` · ${item.maxUses} uses` : ''}${owned ? ` · Owned ×${owned}` : ''}`}
                price={formatMoney(item.cost)}
                locked={false}
                owned={false}
                canBuy={canBuy}
                onBuy={() => purchaseEquipment(item.id)}
                buyLabel={owned > 0 ? 'BUY +' : 'BUY'}
              />
            );
          })}
        </SectionCard>
      )}
    </AppShell>
  );
}

interface UpgradeRowProps {
  icon: string;
  title: string;
  description: string;
  meta: string;
  price: string;
  locked: boolean;
  owned: boolean;
  canBuy: boolean;
  onBuy: () => void;
  buyLabel: string;
}

function UpgradeRow({
  icon,
  title,
  description,
  meta,
  price,
  locked,
  owned,
  canBuy,
  onBuy,
  buyLabel,
}: UpgradeRowProps) {
  return (
    <View style={[styles.row, owned && styles.rowOwned]}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
      <View style={styles.rowAction}>
        {owned ? (
          <Text style={styles.ownedMark}>✓</Text>
        ) : locked ? (
          <Text style={styles.lockMark}>🔒</Text>
        ) : (
          <>
            <Text style={styles.price}>{price}</Text>
            <GameButton
              label={buyLabel}
              size="sm"
              disabled={!canBuy}
              onPress={onBuy}
              style={styles.buyBtn}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: palette.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radius.pill,
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: palette.neonSoft,
    borderWidth: 1,
    borderColor: palette.neonDim,
  },
  tabText: {
    color: palette.textMuted,
    fontFamily: fonts.body,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: palette.neon,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  rowOwned: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: palette.text,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  rowDesc: {
    color: palette.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  rowMeta: {
    color: palette.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  rowAction: {
    alignItems: 'flex-end',
    minWidth: 72,
  },
  price: {
    color: palette.neon,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  buyBtn: {
    marginVertical: 0,
    minWidth: 64,
  },
  ownedMark: {
    color: palette.neon,
    fontSize: 18,
    fontWeight: '800',
  },
  lockMark: {
    fontSize: 16,
    opacity: 0.6,
  },
});
