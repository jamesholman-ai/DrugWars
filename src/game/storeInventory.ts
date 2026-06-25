import { GameState } from '../types/game';
import { ProductId } from '../types/products';
import { createDefaultStoreInventory, StoreInventory } from '../types/store';
import { SAFEHOUSE_MAP } from '../data/safehouses';
import { clamp } from '../utils/random';

export function getStoreInventory(state: GameState): StoreInventory {
  return state.storeInventory ?? createDefaultStoreInventory();
}

export function withStoreInventory(
  state: GameState,
  inventory: StoreInventory
): GameState {
  return { ...state, storeInventory: inventory };
}

export function migrateStoreInventory(raw: unknown): StoreInventory {
  const defaults = createDefaultStoreInventory();
  if (!raw || typeof raw !== 'object') return defaults;

  const data = raw as Partial<StoreInventory>;
  const boosts = Array.isArray(data.temporaryStorageBoosts)
    ? data.temporaryStorageBoosts
        .filter(
          (b): b is { capacity: number; expiresDay: number } =>
            !!b &&
            typeof b === 'object' &&
            typeof (b as { capacity: number }).capacity === 'number' &&
            typeof (b as { expiresDay: number }).expiresDay === 'number'
        )
        .map((b) => ({
          capacity: Math.max(0, Math.floor(b.capacity)),
          expiresDay: Math.max(0, Math.floor(b.expiresDay)),
        }))
    : [];

  const starterBoostUsedThisRun = Array.isArray(data.starterBoostUsedThisRun)
    ? (data.starterBoostUsedThisRun.filter((id) => typeof id === 'string') as ProductId[])
    : [];

  return {
    lawyerTokens: Math.max(0, Math.floor(data.lawyerTokens ?? defaults.lawyerTokens)),
    intelTips: Math.max(0, Math.floor(data.intelTips ?? defaults.intelTips)),
    robberyProtectionTokens: Math.max(
      0,
      Math.floor(data.robberyProtectionTokens ?? defaults.robberyProtectionTokens)
    ),
    temporaryStorageBoosts: boosts,
    temporaryPoliceReductionUntilDay: Math.max(
      0,
      Math.floor(data.temporaryPoliceReductionUntilDay ?? defaults.temporaryPoliceReductionUntilDay)
    ),
    businessRaidProtectionUntilDay: Math.max(
      0,
      Math.floor(data.businessRaidProtectionUntilDay ?? defaults.businessRaidProtectionUntilDay)
    ),
    starterBoostUsedThisRun: starterBoostUsedThisRun,
    payrollCredits: Math.max(0, Math.floor(data.payrollCredits ?? defaults.payrollCredits)),
    businessUpkeepCredits: Math.max(
      0,
      Math.floor(data.businessUpkeepCredits ?? defaults.businessUpkeepCredits)
    ),
  };
}

export function purgeExpiredStoreBoosts(state: GameState): GameState {
  const inv = getStoreInventory(state);
  const day = state.player.day;
  const activeBoosts = inv.temporaryStorageBoosts.filter((b) => b.expiresDay >= day);
  if (activeBoosts.length === inv.temporaryStorageBoosts.length) return state;

  return withStoreInventory(state, {
    ...inv,
    temporaryStorageBoosts: activeBoosts,
  });
}

export function getTemporaryStorageBonus(state: GameState): number {
  const inv = getStoreInventory(state);
  const day = state.player.day;
  return inv.temporaryStorageBoosts
    .filter((b) => b.expiresDay >= day)
    .reduce((sum, b) => sum + b.capacity, 0);
}

export function hasBusinessRaidProtection(state: GameState): boolean {
  const inv = getStoreInventory(state);
  return inv.businessRaidProtectionUntilDay >= state.player.day;
}

export function hasPoliceEncounterReduction(state: GameState): boolean {
  const inv = getStoreInventory(state);
  return inv.temporaryPoliceReductionUntilDay >= state.player.day;
}

export function boostSafehousesInCity(
  state: GameState,
  cityId: string,
  amount: number
): GameState {
  if (amount <= 0 || (state.ownedSafehouses ?? []).length === 0) return state;

  const ownedSafehouses = (state.ownedSafehouses ?? []).map((owned) => {
    const def = SAFEHOUSE_MAP[owned.safehouseId];
    if (!def || def.cityId !== cityId) return owned;
    return {
      ...owned,
      condition: clamp(owned.condition + amount, 0, 100),
    };
  });

  return { ...state, ownedSafehouses };
}

export function mergeStoreInventories(
  base: StoreInventory,
  extra: StoreInventory
): StoreInventory {
  return {
    lawyerTokens: base.lawyerTokens + extra.lawyerTokens,
    intelTips: base.intelTips + extra.intelTips,
    robberyProtectionTokens: base.robberyProtectionTokens + extra.robberyProtectionTokens,
    temporaryStorageBoosts: [...base.temporaryStorageBoosts, ...extra.temporaryStorageBoosts],
    temporaryPoliceReductionUntilDay: Math.max(
      base.temporaryPoliceReductionUntilDay,
      extra.temporaryPoliceReductionUntilDay
    ),
    businessRaidProtectionUntilDay: Math.max(
      base.businessRaidProtectionUntilDay,
      extra.businessRaidProtectionUntilDay
    ),
    starterBoostUsedThisRun: [
      ...new Set([...base.starterBoostUsedThisRun, ...extra.starterBoostUsedThisRun]),
    ],
    payrollCredits: base.payrollCredits + extra.payrollCredits,
    businessUpkeepCredits: base.businessUpkeepCredits + extra.businessUpkeepCredits,
  };
}
