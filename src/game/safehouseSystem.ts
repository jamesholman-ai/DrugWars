import { GameState, CommodityId, InventoryItem } from '../types/game';
import { OwnedSafehouse, StoredInventoryBySafehouse } from '../types/safehouses';
import { RankId } from '../types/progression';
import { SAFEHOUSES, SAFEHOUSE_MAP } from '../data/safehouses';
import { RANKS } from '../data/progression';
import { COMMODITY_MAP } from '../data/commodities';
import { getPlayerAreaKey } from '../data/locations';
import { isCityUnlocked } from './progression';
import { withMessage, withMessages } from './messages';
import { applyProgressionAfterAction } from './progression';
import { spendMoney } from './money';
import { trackMissionEvent } from './missionSystem';
import { clamp } from '../utils/random';
import { getTemporaryStorageBonus } from './storeInventory';

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function meetsSafehouseUnlock(state: GameState, def: typeof SAFEHOUSES[0]): boolean {
  if (!isCityUnlocked(state, def.cityId)) return false;
  if (def.minRank && rankIndex(state.progression.rankId) < rankIndex(def.minRank)) return false;
  if (def.minReputation != null && state.player.reputation < def.minReputation) return false;
  return true;
}

export function getOwnedSafehouseIds(state: GameState): string[] {
  return (state.ownedSafehouses ?? []).map((o) => o.safehouseId);
}

export function isSafehouseOwned(state: GameState, safehouseId: string): boolean {
  return getOwnedSafehouseIds(state).includes(safehouseId);
}

export function getSafehousesAtLocation(
  state: GameState,
  cityId: string,
  areaId: string
) {
  return SAFEHOUSES.filter((s) => s.cityId === cityId && s.areaId === areaId);
}

export function getLocalOwnedSafehouse(state: GameState) {
  const { currentCityId, currentAreaId } = state.player;
  const owned = state.ownedSafehouses ?? [];
  for (const o of owned) {
    const def = SAFEHOUSE_MAP[o.safehouseId];
    if (def?.cityId === currentCityId && def.areaId === currentAreaId) {
      return { owned: o, def };
    }
  }
  return null;
}

export function getStoredInventory(
  state: GameState,
  safehouseId: string
): InventoryItem[] {
  return [...(state.storedInventoryBySafehouse?.[safehouseId] ?? [])];
}

export function getStoredUsed(state: GameState, safehouseId: string): number {
  return getStoredInventory(state, safehouseId).reduce((s, i) => s + i.quantity, 0);
}

export function getTotalStorageCapacity(state: GameState): number {
  let total = 0;
  for (const o of state.ownedSafehouses ?? []) {
    total += SAFEHOUSE_MAP[o.safehouseId]?.storageCapacity ?? 0;
  }
  return total + getTemporaryStorageBonus(state);
}

export function getSafehouseHeatDecayBonus(state: GameState): number {
  const local = getLocalOwnedSafehouse(state);
  if (!local) return 0;
  const condition = local.owned.condition / 100;
  return Math.round(local.def.heatReductionPerDay * condition);
}

export function getSafehouseRobberyProtection(state: GameState): number {
  const local = getLocalOwnedSafehouse(state);
  if (!local) return 0;
  const condition = local.owned.condition / 100;
  return local.def.robberyProtection * condition;
}

export function getSafehousePoliceModifier(state: GameState): number {
  const local = getLocalOwnedSafehouse(state);
  if (!local) return 1;
  const missed = local.owned.upkeepMissedDays;
  const penalty = 1 + missed * 0.05;
  return Math.min(1.2, local.def.policeRiskModifier * penalty);
}

function mergeItem(
  items: InventoryItem[],
  commodityId: CommodityId,
  quantity: number,
  avgCost: number
): InventoryItem[] {
  const existing = items.find((i) => i.commodityId === commodityId);
  if (!existing) {
    return [...items, { commodityId, quantity, avgCost }];
  }
  const totalQty = existing.quantity + quantity;
  return items.map((i) =>
    i.commodityId === commodityId
      ? {
          ...i,
          quantity: totalQty,
          avgCost: Math.round(
            (i.avgCost * i.quantity + avgCost * quantity) / totalQty
          ),
        }
      : i
  );
}

function removeQty(
  items: InventoryItem[],
  commodityId: CommodityId,
  quantity: number
): { items: InventoryItem[]; removed: number; avgCost: number } {
  const existing = items.find((i) => i.commodityId === commodityId);
  if (!existing || existing.quantity <= 0) {
    return { items, removed: 0, avgCost: 0 };
  }
  const removed = Math.min(quantity, existing.quantity);
  const avgCost = existing.avgCost;
  const next = items
    .map((i) =>
      i.commodityId === commodityId
        ? { ...i, quantity: i.quantity - removed }
        : i
    )
    .filter((i) => i.quantity > 0);
  return { items: next, removed, avgCost };
}

function getCarriedCount(inventory: InventoryItem[]): number {
  return inventory.reduce((s, i) => s + i.quantity, 0);
}

export function purchaseSafehouse(state: GameState, safehouseId: string): GameState {
  const def = SAFEHOUSE_MAP[safehouseId];
  if (!def) return withMessage(state, 'Unknown property.');

  if (isSafehouseOwned(state, safehouseId)) {
    return withMessage(state, 'You already own this property.');
  }

  if (!meetsSafehouseUnlock(state, def)) {
    return withMessage(state, 'Requirements not met for this property.');
  }

  const { player } = state;
  if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
    return withMessage(state, 'You must be on-site to purchase this property.');
  }

  const afterSpend = spendMoney(player, def.purchaseCost, true);
  if (!afterSpend) {
    return withMessage(
      state,
      `Need $${def.purchaseCost} for ${def.name} (clean preferred). You have $${player.cash}.`
    );
  }

  const owned: OwnedSafehouse = {
    safehouseId,
    purchasedDay: player.day,
    upkeepMissedDays: 0,
    condition: 100,
  };

  return applyProgressionAfterAction(
    trackMissionEvent(
      withMessage(
        {
          ...state,
          player: afterSpend,
          ownedSafehouses: [...(state.ownedSafehouses ?? []), owned],
          storedInventoryBySafehouse: {
            ...(state.storedInventoryBySafehouse ?? {}),
            [safehouseId]: [],
          },
        },
        `Purchased ${def.name} for $${def.purchaseCost}. Storage +${def.storageCapacity}. Upkeep $${def.upkeepPerDay}/day.`
      ),
      { kind: 'purchase_safehouse' }
    )
  );
}

export function depositToSafehouse(
  state: GameState,
  safehouseId: string,
  commodityId: CommodityId,
  quantity: number
): GameState {
  if (quantity <= 0) return state;

  const def = SAFEHOUSE_MAP[safehouseId];
  if (!def || !isSafehouseOwned(state, safehouseId)) {
    return withMessage(state, 'You do not own this property.');
  }

  const { player } = state;
  if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
    return withMessage(state, 'Must be at the property to deposit.');
  }

  const { items: carried, removed, avgCost } = removeQty(
    player.inventory,
    commodityId,
    quantity
  );
  if (removed <= 0) {
    return withMessage(state, 'Not enough product to deposit.');
  }

  const stored = getStoredInventory(state, safehouseId);
  const used = stored.reduce((s, i) => s + i.quantity, 0);
  if (used + removed > def.storageCapacity) {
    return withMessage(
      state,
      `Property full (${used}/${def.storageCapacity}). Withdraw or upgrade elsewhere.`
    );
  }

  const nextStored = mergeItem(stored, commodityId, removed, avgCost);
  const name = COMMODITY_MAP[commodityId]?.name ?? commodityId;

  return trackMissionEvent(
    withMessage(
      {
        ...state,
        player: { ...player, inventory: carried },
        storedInventoryBySafehouse: {
          ...(state.storedInventoryBySafehouse ?? {}),
          [safehouseId]: nextStored,
        },
      },
      `Deposited ${removed} ${name} into ${def.name}.`
    ),
    { kind: 'deposit_safehouse', quantity: removed }
  );
}

export function withdrawFromSafehouse(
  state: GameState,
  safehouseId: string,
  commodityId: CommodityId,
  quantity: number
): GameState {
  if (quantity <= 0) return state;

  const def = SAFEHOUSE_MAP[safehouseId];
  if (!def || !isSafehouseOwned(state, safehouseId)) {
    return withMessage(state, 'You do not own this property.');
  }

  const { player } = state;
  if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
    return withMessage(state, 'Must be at the property to withdraw.');
  }

  const stored = getStoredInventory(state, safehouseId);
  const { items: nextStored, removed, avgCost } = removeQty(stored, commodityId, quantity);
  if (removed <= 0) {
    return withMessage(state, 'Not enough product in property storage.');
  }

  const carriedUsed = getCarriedCount(player.inventory);
  if (carriedUsed + removed > player.inventoryCapacity) {
    const space = player.inventoryCapacity - carriedUsed;
    return withMessage(state, `Carried storage full. Only ${space} slots free.`);
  }

  const nextCarried = mergeItem(player.inventory, commodityId, removed, avgCost);
  const name = COMMODITY_MAP[commodityId]?.name ?? commodityId;

  return withMessage(
    {
      ...state,
      player: { ...player, inventory: nextCarried },
      storedInventoryBySafehouse: {
        ...(state.storedInventoryBySafehouse ?? {}),
        [safehouseId]: nextStored,
      },
    },
    `Withdrew ${removed} ${name} from ${def.name}.`
  );
}

export function tickSafehouseUpkeep(state: GameState): GameState {
  const owned = state.ownedSafehouses ?? [];
  if (owned.length === 0) return state;

  let totalUpkeep = 0;
  for (const o of owned) {
    totalUpkeep += SAFEHOUSE_MAP[o.safehouseId]?.upkeepPerDay ?? 0;
  }

  let cash = state.player.cash;
  const messages: string[] = [];
  let nextOwned: OwnedSafehouse[] = [];

  if (cash >= totalUpkeep) {
    cash -= totalUpkeep;
    nextOwned = owned.map((o) => ({
      ...o,
      upkeepMissedDays: 0,
      condition: clamp(o.condition + 1, 0, 100),
    }));
    messages.push(`Property upkeep -$${totalUpkeep}.`);
  } else {
    messages.push(`Could not pay full property upkeep ($${totalUpkeep}).`);
    cash = 0;
    nextOwned = owned.map((o) => ({
      ...o,
      upkeepMissedDays: o.upkeepMissedDays + 1,
      condition: clamp(o.condition - 8, 20, 100),
    }));
  }

  return withMessage(
    { ...state, player: { ...state.player, cash }, ownedSafehouses: nextOwned },
    messages[0]
  );
}

export function getDailySafehouseUpkeep(state: GameState): number {
  return (state.ownedSafehouses ?? []).reduce(
    (sum, o) => sum + (SAFEHOUSE_MAP[o.safehouseId]?.upkeepPerDay ?? 0),
    0
  );
}

export function createDefaultSafehouseState(): {
  ownedSafehouses: OwnedSafehouse[];
  storedInventoryBySafehouse: StoredInventoryBySafehouse;
} {
  return { ownedSafehouses: [], storedInventoryBySafehouse: {} };
}

export function migrateOwnedSafehouses(raw: unknown): OwnedSafehouse[] {
  if (!Array.isArray(raw)) return [];
  const result: OwnedSafehouse[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.safehouseId === 'string' ? e.safehouseId : '';
    if (!SAFEHOUSE_MAP[id]) continue;
    result.push({
      safehouseId: id,
      purchasedDay: typeof e.purchasedDay === 'number' ? e.purchasedDay : 1,
      upkeepMissedDays: typeof e.upkeepMissedDays === 'number' ? e.upkeepMissedDays : 0,
      condition: typeof e.condition === 'number' ? clamp(e.condition, 20, 100) : 100,
    });
  }
  return result;
}

export function migrateStoredInventory(raw: unknown): StoredInventoryBySafehouse {
  const result: StoredInventoryBySafehouse = {};
  if (typeof raw !== 'object' || raw === null) return result;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!SAFEHOUSE_MAP[key] || !Array.isArray(value)) continue;
    const items: InventoryItem[] = [];
    for (const entry of value) {
      if (typeof entry !== 'object' || entry === null) continue;
      const e = entry as Record<string, unknown>;
      const commodityId = typeof e.commodityId === 'string' ? e.commodityId : '';
      if (!COMMODITY_MAP[commodityId as CommodityId]) continue;
      const quantity = typeof e.quantity === 'number' ? Math.max(0, Math.floor(e.quantity)) : 0;
      if (quantity <= 0) continue;
      items.push({
        commodityId: commodityId as CommodityId,
        quantity,
        avgCost: typeof e.avgCost === 'number' ? Math.max(0, e.avgCost) : 0,
      });
    }
    result[key] = items;
  }
  return result;
}
