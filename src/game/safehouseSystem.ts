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
import { appendFinanceLog } from './financeSystem';
import { trackMissionEvent } from './missionSystem';
import { clamp } from '../utils/random';
import { createDefaultOwnedSafehouseFields, normalizeOwnedSafehouse, migratePropertyUpgrades } from './empireDefaults';
import { ACTION_FEEDBACK } from './empireFlavorText';
import { getEffectivePropertyStats, getEffectiveStorageCapacity } from './propertyManagementSystem';
import { getTemporaryStorageBonus } from './storeInventory';
import { getPropertyDef, getPropertiesAtLocationFromPool, resolvePropertyDefinition } from './propertyPoolSystem';
import { getRunSeed } from './businessPoolSystem';
import { SafehouseDefinition } from '../types/safehouses';

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function meetsSafehouseUnlock(state: GameState, def: SafehouseDefinition): boolean {
  if (!isCityUnlocked(state, def.cityId)) return false;
  if (def.minRank && rankIndex(state.progression.rankId) < rankIndex(def.minRank)) return false;
  if (def.minReputation != null && state.player.reputation < def.minReputation) return false;
  return true;
}

function resolveDef(state: GameState, propertyId: string): SafehouseDefinition | undefined {
  return getPropertyDef(state, propertyId);
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
  return getPropertiesAtLocationFromPool(state, cityId, areaId);
}

export function getLocalOwnedSafehouse(state: GameState) {
  const { currentCityId, currentAreaId, homeBaseId } = state.player;
  const owned = state.ownedSafehouses ?? [];

  if (homeBaseId) {
    const baseRecord = owned.find((o) => o.safehouseId === homeBaseId);
    const baseDef = baseRecord ? resolveDef(state, homeBaseId) : undefined;
    if (baseRecord && baseDef?.cityId === currentCityId && baseDef.areaId === currentAreaId) {
      return { owned: baseRecord, def: baseDef };
    }
  }

  for (const o of owned) {
    const def = resolveDef(state, o.safehouseId);
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
    total += getEffectiveStorageCapacity(state, o.safehouseId);
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

function acquireProperty(
  state: GameState,
  safehouseId: string,
  rentOrOwn: 'rent' | 'own',
  upfrontCost: number,
  message: string
): GameState {
  const def = resolveDef(state, safehouseId);
  if (!def) return withMessage(state, 'Unknown property.');

  if (isSafehouseOwned(state, safehouseId)) {
    return withMessage(state, 'You already have this property.');
  }

  if (!meetsSafehouseUnlock(state, def)) {
    return withMessage(state, 'Requirements not met for this property.');
  }

  const { player } = state;
  if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
    return withMessage(state, 'You must be on-site to secure this property.');
  }

  let nextPlayer = player;
  if (upfrontCost > 0) {
    const afterSpend = spendMoney(player, upfrontCost, true);
    if (!afterSpend) {
      return withMessage(
        state,
        `Need $${upfrontCost} for ${def.name} (clean preferred). You have $${player.cash}.`
      );
    }
    nextPlayer = afterSpend;
  }

  const owned = createDefaultOwnedSafehouseFields(safehouseId, player.day, rentOrOwn, def);
  const homeBaseId = player.homeBaseId ?? safehouseId;

  return applyProgressionAfterAction(
    trackMissionEvent(
      withMessage(
        {
          ...state,
          player: { ...nextPlayer, homeBaseId },
          ownedSafehouses: [...(state.ownedSafehouses ?? []), owned],
          storedInventoryBySafehouse: {
            ...(state.storedInventoryBySafehouse ?? {}),
            [safehouseId]: [],
          },
        },
        message
      ),
      { kind: 'purchase_safehouse' }
    )
  );
}

export function purchaseSafehouse(state: GameState, safehouseId: string): GameState {
  const def = resolveDef(state, safehouseId);
  if (!def) return withMessage(state, 'Unknown property.');
  if (def.listingMode === 'rent') {
    return withMessage(state, 'This listing is for rent — use Rent instead.');
  }

  return acquireProperty(
    state,
    safehouseId,
    'own',
    def.purchaseCost,
    `${ACTION_FEEDBACK.propertyPurchased(def.name)} Storage +${def.storageCapacity}. Upkeep $${def.upkeepPerDay}/day.`
  );
}

export function rentSafehouse(state: GameState, safehouseId: string): GameState {
  const def = resolveDef(state, safehouseId);
  if (!def) return withMessage(state, 'Unknown property.');
  const rent = def.rentPerDay > 0 ? def.rentPerDay : Math.max(35, Math.round(def.purchaseCost * 0.02));
  const deposit = Math.max(rent, Math.round(rent * 0.5));

  return acquireProperty(
    state,
    safehouseId,
    'rent',
    deposit,
    `Rented ${def.name}. Deposit $${deposit}. Rent $${rent}/day.`
  );
}

export function setHomeBase(state: GameState, safehouseId: string): GameState {
  if (!isSafehouseOwned(state, safehouseId)) {
    return withMessage(state, 'You do not control that property.');
  }
  const def = resolveDef(state, safehouseId);
  if (!def) return withMessage(state, 'Property not found.');

  return withMessage(
    { ...state, player: { ...state.player, homeBaseId: safehouseId } },
    `${def.name} is now your primary base.`
  );
}

export function depositToSafehouse(
  state: GameState,
  safehouseId: string,
  commodityId: CommodityId,
  quantity: number
): GameState {
  if (quantity <= 0) return state;

  const def = resolveDef(state, safehouseId);
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
  const record = (state.ownedSafehouses ?? []).find((o) => o.safehouseId === safehouseId);
  const capacity = record ? getEffectiveStorageCapacity(state, safehouseId) : def.storageCapacity;
  if (used + removed > capacity) {
    return withMessage(
      state,
      `Property full (${used}/${capacity}). Withdraw or upgrade storage.`
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

  const def = resolveDef(state, safehouseId);
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

  let totalRent = 0;
  let totalUpkeep = 0;

  for (const o of owned) {
    const def = resolveDef(state, o.safehouseId);
    if (!def) continue;
    if (o.rentOrOwn === 'rent') {
      const rent = def.rentPerDay > 0 ? def.rentPerDay : 45;
      totalRent += rent;
    } else {
      totalUpkeep += def.upkeepPerDay;
    }
  }

  const totalDue = totalRent + totalUpkeep;
  let cash = state.player.cash;
  const messages: string[] = [];
  let nextOwned: OwnedSafehouse[] = owned.map((o) => ({ ...o }));

  const applyPaid = () => {
    nextOwned = nextOwned.map((o) => ({
      ...o,
      upkeepMissedDays: 0,
      condition: clamp(o.condition + 1, 0, 100),
    }));
  };

  const applyUnpaid = () => {
    nextOwned = nextOwned.map((o) => ({
      ...o,
      upkeepMissedDays: o.upkeepMissedDays + 1,
      condition: clamp(o.condition - 8, 0, 100),
      comfortLevel: clamp((o.comfortLevel ?? 50) - 6, 0, 100),
      securityLevel: clamp((o.securityLevel ?? 50) - 5, 0, 100),
      secrecyLevel: clamp((o.secrecyLevel ?? 50) - 4, 0, 100),
    }));
  };

  let updated: GameState = state;

  if (totalDue <= 0) {
    return state;
  }

  if (cash >= totalDue) {
    cash -= totalDue;
    applyPaid();
    if (totalRent > 0) messages.push(`Property rent -$${totalRent}.`);
    if (totalUpkeep > 0) messages.push(`Property upkeep -$${totalUpkeep}.`);
    updated = {
      ...state,
      player: { ...state.player, cash },
      ownedSafehouses: nextOwned,
    };
    if (messages.length > 0) {
      updated = withMessage(updated, messages.join(' '));
    }
    if (totalRent > 0) {
      updated = appendFinanceLog(
        updated,
        'property_rent',
        totalRent,
        `Property rent −$${totalRent.toLocaleString()}.`
      );
    }
    if (totalUpkeep > 0) {
      updated = appendFinanceLog(
        updated,
        'property_upkeep',
        totalUpkeep,
        `Property upkeep −$${totalUpkeep.toLocaleString()}.`
      );
    }
    return updated;
  }

  messages.push(`Could not pay full property costs ($${totalDue}).`);
  cash = 0;
  applyUnpaid();
  updated = withMessage(
    { ...state, player: { ...state.player, cash }, ownedSafehouses: nextOwned },
    messages[0]
  );
  return updated;
}

export function getDailyPropertyRent(state: GameState): number {
  return (state.ownedSafehouses ?? []).reduce((sum, o) => {
    if (o.rentOrOwn !== 'rent') return sum;
    const def = resolveDef(state, o.safehouseId);
    return sum + (def?.rentPerDay ?? 45);
  }, 0);
}

export function getDailyPropertyUpkeep(state: GameState): number {
  return (state.ownedSafehouses ?? []).reduce((sum, o) => {
    if (o.rentOrOwn !== 'own') return sum;
    const def = resolveDef(state, o.safehouseId);
    return sum + (def?.upkeepPerDay ?? 0);
  }, 0);
}

export function getDailySafehouseUpkeep(state: GameState): number {
  return getDailyPropertyRent(state) + getDailyPropertyUpkeep(state);
}

export function createDefaultSafehouseState(): {
  ownedSafehouses: OwnedSafehouse[];
  storedInventoryBySafehouse: StoredInventoryBySafehouse;
} {
  return { ownedSafehouses: [], storedInventoryBySafehouse: {} };
}

export function migrateOwnedSafehouses(raw: unknown, runSeed?: number): OwnedSafehouse[] {
  if (!Array.isArray(raw)) return [];
  const result: OwnedSafehouse[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.safehouseId === 'string' ? e.safehouseId : '';
    if (!id) continue;

    const staticDef = SAFEHOUSE_MAP[id];
    const generatedDef =
      runSeed != null ? resolvePropertyDefinition(id, runSeed) : undefined;
    const def = staticDef ?? generatedDef;
    if (!def && !staticDef) {
      if (!id.startsWith('sh_') && !id.includes('_prop_')) continue;
    }

    const baseDef = def ?? staticDef;
    const rentOrOwn = e.rentOrOwn === 'rent' ? 'rent' : 'own';

    result.push(
      normalizeOwnedSafehouse({
        safehouseId: id,
        purchasedDay: typeof e.purchasedDay === 'number' ? e.purchasedDay : 1,
        rentOrOwn,
        upkeepMissedDays: typeof e.upkeepMissedDays === 'number' ? e.upkeepMissedDays : 0,
        condition: typeof e.condition === 'number' ? clamp(e.condition, 0, 100) : 100,
        comfortLevel:
          typeof e.comfortLevel === 'number'
            ? clamp(e.comfortLevel, 0, 100)
            : baseDef?.comfortLevel ?? 50,
        securityLevel:
          typeof e.securityLevel === 'number'
            ? clamp(e.securityLevel, 0, 100)
            : baseDef?.securityLevel ?? 50,
        secrecyLevel:
          typeof e.secrecyLevel === 'number'
            ? clamp(e.secrecyLevel, 0, 100)
            : baseDef?.secrecyLevel ?? 50,
        assignedGuardCrewId: typeof e.assignedGuardCrewId === 'string' ? e.assignedGuardCrewId : null,
        upgradeLevels: migratePropertyUpgrades(e.upgradeLevels),
        recentEvents: Array.isArray(e.recentEvents) ? e.recentEvents : undefined,
      })
    );
  }
  return result;
}

export function migrateStoredInventory(raw: unknown, ownedIds?: string[]): StoredInventoryBySafehouse {
  const result: StoredInventoryBySafehouse = {};
  const allowed = new Set([
    ...Object.keys(SAFEHOUSE_MAP),
    ...(ownedIds ?? []),
  ]);
  if (typeof raw !== 'object' || raw === null) return result;

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(key) && !key.includes('_prop_')) continue;
    if (!Array.isArray(value)) continue;
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
