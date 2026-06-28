import { PRODUCT_MAP } from '../data/products';
import { ProductEffects } from '../data/productEffects';
import { GameState } from '../types/game';
import { ProductId, ProductCategory } from '../types/products';
import { StoreInventory } from '../types/store';
import { addDirtyMoney } from './money';
import { withMessage } from './messages';
import { clamp } from '../utils/random';
import {
  getStoreInventory,
  withStoreInventory,
  boostSafehousesInCity,
} from './storeInventory';

export type StorePurchaseError = { ok: false; error: string; code?: 'already_used' | 'unknown' };

export type StorePurchaseSuccess = { ok: true; state: GameState; summary: string };

export function validateStorePurchase(
  state: GameState,
  productId: ProductId
): StorePurchaseError | { ok: true } {
  const def = PRODUCT_MAP[productId];
  if (!def) {
    return { ok: false, error: 'Unknown product.', code: 'unknown' };
  }

  const inv = getStoreInventory(state);
  if (def.effects.oncePerRun && inv.starterBoostUsedThisRun.includes(productId)) {
    return {
      ok: false,
      error: 'This starter boost tier was already used this run.',
      code: 'already_used',
    };
  }

  return { ok: true };
}

export function formatPurchaseSummary(parts: string[]): string {
  if (parts.length === 0) return 'Purchase applied.';
  return `Purchase applied: ${parts.join(', ')}.`;
}

function applyEffectsToInventory(
  inv: StoreInventory,
  effects: ProductEffects,
  day: number,
  productId: ProductId
): StoreInventory {
  let next = { ...inv };

  if (effects.lawyerTokens) {
    next.lawyerTokens += effects.lawyerTokens;
  }
  if (effects.intelTips) {
    next.intelTips += effects.intelTips;
  }
  if (effects.robberyProtectionTokens) {
    next.robberyProtectionTokens += effects.robberyProtectionTokens;
  }
  if (effects.temporaryStorage) {
    next.temporaryStorageBoosts = [
      ...next.temporaryStorageBoosts,
      {
        capacity: effects.temporaryStorage.capacity,
        expiresDay: day + effects.temporaryStorage.days,
      },
    ];
  }
  if (effects.policeReductionDays) {
    next.temporaryPoliceReductionUntilDay = Math.max(
      next.temporaryPoliceReductionUntilDay,
      day + effects.policeReductionDays
    );
  }
  if (effects.businessRaidProtectionDays) {
    next.businessRaidProtectionUntilDay = Math.max(
      next.businessRaidProtectionUntilDay,
      day + effects.businessRaidProtectionDays
    );
  }
  if (effects.payrollDays) {
    next.payrollCredits += effects.payrollDays;
  }
  if (effects.businessUpkeepDays) {
    next.businessUpkeepCredits += effects.businessUpkeepDays;
  }
  if (effects.oncePerRun) {
    next.starterBoostUsedThisRun = [...next.starterBoostUsedThisRun, productId];
  }

  return next;
}

function buildSummaryParts(effects: ProductEffects): string[] {
  const parts: string[] = [];
  if (effects.dirtyCash) parts.push(`+$${effects.dirtyCash.toLocaleString()} cash`);
  if (effects.debtReduction) parts.push(`−$${effects.debtReduction.toLocaleString()} debt`);
  if (effects.intelTips) {
    parts.push(`+${effects.intelTips} reveal token${effects.intelTips === 1 ? '' : 's'}`);
  }
  if (effects.lawyerTokens) {
    parts.push(
      `+${effects.lawyerTokens} Lawyer token${effects.lawyerTokens === 1 ? '' : 's'}`
    );
  }
  if (effects.heatReduction) parts.push(`−${effects.heatReduction} heat`);
  if (effects.localHeatReduction) {
    parts.push(`−${effects.localHeatReduction} local city heat`);
  }
  if (effects.temporaryStorage) {
    parts.push(
      `+${effects.temporaryStorage.capacity} storage for ${effects.temporaryStorage.days} days`
    );
  }
  if (effects.propertyCondition) {
    parts.push(`+${effects.propertyCondition} property condition (current city)`);
  }
  if (effects.robberyProtectionTokens) {
    parts.push(`+${effects.robberyProtectionTokens} robbery protection token`);
  }
  if (effects.policeReductionDays) {
    parts.push(`${effects.policeReductionDays}-day police encounter reduction`);
  }
  if (effects.crewLoyalty) parts.push(`+${effects.crewLoyalty} crew loyalty`);
  if (effects.payrollDays) {
    parts.push(`${effects.payrollDays} day${effects.payrollDays === 1 ? '' : 's'} payroll covered`);
  }
  if (effects.clearCrewPenalty) parts.push('cleared one crew penalty');
  if (effects.businessCondition) {
    parts.push(`+${effects.businessCondition} business condition`);
  }
  if (effects.businessUpkeepDays) {
    parts.push(
      `${effects.businessUpkeepDays} day${effects.businessUpkeepDays === 1 ? '' : 's'} upkeep covered`
    );
  }
  if (effects.businessRaidProtectionDays) {
    parts.push(`${effects.businessRaidProtectionDays}-day business raid protection`);
  }
  return parts;
}

export function applyStorePurchase(
  state: GameState,
  productId: ProductId
): StorePurchaseSuccess | StorePurchaseError {
  const validation = validateStorePurchase(state, productId);
  if (!validation.ok) return validation;

  const def = PRODUCT_MAP[productId];
  const effects = def.effects;
  const summary = formatPurchaseSummary(buildSummaryParts(effects));

  let updated: GameState = { ...state };
  let player = updated.player;

  if (effects.dirtyCash && effects.dirtyCash > 0) {
    player = addDirtyMoney(player, effects.dirtyCash);
  }
  if (effects.debtReduction && effects.debtReduction > 0) {
    player = {
      ...player,
      debt: Math.max(0, player.debt - effects.debtReduction),
    };
  }
  if (effects.heatReduction && effects.heatReduction > 0) {
    player = {
      ...player,
      heat: clamp(player.heat - effects.heatReduction, 0, 100),
    };
  }

  updated = { ...updated, player };

  if (effects.localHeatReduction && effects.localHeatReduction > 0) {
    const cityId = updated.player.currentCityId;
    const currentLocal = updated.localHeatByCity[cityId] ?? updated.player.heat;
    updated = {
      ...updated,
      localHeatByCity: {
        ...updated.localHeatByCity,
        [cityId]: clamp(currentLocal - effects.localHeatReduction, 0, 100),
      },
    };
  }

  if (effects.propertyCondition && effects.propertyCondition > 0) {
    updated = boostSafehousesInCity(
      updated,
      updated.player.currentCityId,
      effects.propertyCondition
    );
  }

  if (effects.crewLoyalty && effects.crewLoyalty > 0) {
    updated = {
      ...updated,
      hiredCrew: (updated.hiredCrew ?? []).map((member) =>
        member.status === 'hired'
          ? { ...member, loyalty: clamp(member.loyalty + effects.crewLoyalty!, 0, 100) }
          : member
      ),
    };
  }

  if (effects.clearCrewPenalty) {
    const crew = [...(updated.hiredCrew ?? [])];
    const penaltyIdx = crew.findIndex(
      (m) => m.status === 'injured' || m.status === 'arrested'
    );
    if (penaltyIdx >= 0) {
      crew[penaltyIdx] = { ...crew[penaltyIdx], status: 'hired', daysUnpaid: 0 };
      updated = { ...updated, hiredCrew: crew };
    }
  }

  if (effects.businessCondition && effects.businessCondition > 0) {
    updated = {
      ...updated,
      ownedBusinesses: (updated.ownedBusinesses ?? []).map((b) => ({
        ...b,
        condition: clamp(b.condition + effects.businessCondition!, 0, 100),
      })),
    };
  }

  const inv = applyEffectsToInventory(
    getStoreInventory(updated),
    effects,
    updated.player.day,
    productId
  );
  updated = withStoreInventory(updated, inv);

  return {
    ok: true,
    state: withMessage(updated, summary),
    summary,
  };
}

export function getCategoryInventorySummary(
  state: GameState,
  category: ProductCategory
): string | null {
  const inv = getStoreInventory(state);
  switch (category) {
    case 'legal':
      return inv.lawyerTokens > 0 ? `${inv.lawyerTokens} token(s) ready` : null;
    case 'intel':
      return inv.intelTips > 0 ? `${inv.intelTips} reveal token(s)` : null;
    case 'storage':
      return inv.robberyProtectionTokens > 0
        ? `${inv.robberyProtectionTokens} raid token(s)`
        : null;
    case 'crew':
      return inv.payrollCredits > 0 ? `${inv.payrollCredits} payroll day(s) banked` : null;
    case 'business':
      return inv.businessUpkeepCredits > 0
        ? `${inv.businessUpkeepCredits} upkeep day(s) banked`
        : null;
    default:
      return null;
  }
}
