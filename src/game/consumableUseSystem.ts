import { PRODUCT_MAP } from '../data/products';
import { ProductEffects } from '../data/productEffects';
import { GameState } from '../types/game';
import { PlayerProfile } from '../types/playerProfile';
import { ProductId } from '../types/products';
import { addDirtyMoney } from './money';
import { withMessage } from './messages';
import { clamp } from '../utils/random';
import {
  getStoreInventory,
  withStoreInventory,
  boostSafehousesInCity,
} from './storeInventory';
import {
  getProductIdForTier,
  getTierCreditKey,
  tryConsumeCredit,
} from './consumableCredits';
import { applyProgressionAfterAction } from './progression';
import { appendFinanceLog } from './financeSystem';
import { checkGameOverState } from './engineHelpers';

export type ConsumableUseResult =
  | { ok: true; profile: PlayerProfile; state: GameState; summary: string }
  | { ok: false; error: string; profile: PlayerProfile; state: GameState };

function applyRunEffectsFromProduct(
  state: GameState,
  effects: ProductEffects,
  productId: ProductId
): GameState {
  let updated: GameState = { ...state };
  let player = updated.player;

  if (effects.dirtyCash && effects.dirtyCash > 0) {
    player = addDirtyMoney(player, effects.dirtyCash);
  }
  if (effects.debtReduction && effects.debtReduction > 0) {
    player = { ...player, debt: Math.max(0, player.debt - effects.debtReduction) };
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

  const inv = getStoreInventory(updated);
  let nextInv = { ...inv };

  if (effects.temporaryStorage) {
    nextInv.temporaryStorageBoosts = [
      ...nextInv.temporaryStorageBoosts,
      {
        capacity: effects.temporaryStorage.capacity,
        expiresDay: updated.player.day + effects.temporaryStorage.days,
      },
    ];
  }
  if (effects.policeReductionDays) {
    nextInv.temporaryPoliceReductionUntilDay = Math.max(
      nextInv.temporaryPoliceReductionUntilDay,
      updated.player.day + effects.policeReductionDays
    );
  }
  if (effects.businessRaidProtectionDays) {
    nextInv.businessRaidProtectionUntilDay = Math.max(
      nextInv.businessRaidProtectionUntilDay,
      updated.player.day + effects.businessRaidProtectionDays
    );
  }
  if (effects.payrollDays) {
    nextInv.payrollCredits += effects.payrollDays;
  }
  if (effects.businessUpkeepDays) {
    nextInv.businessUpkeepCredits += effects.businessUpkeepDays;
  }
  if (effects.oncePerRun) {
    nextInv.starterBoostUsedThisRun = [...nextInv.starterBoostUsedThisRun, productId];
  }

  updated = withStoreInventory(updated, nextInv);

  if (effects.dirtyCash && effects.dirtyCash > 0) {
    updated = appendFinanceLog(
      updated,
      'store_effect',
      effects.dirtyCash,
      `Store consumable +$${effects.dirtyCash.toLocaleString()} cash.`
    );
  }
  if (effects.debtReduction && effects.debtReduction > 0) {
    updated = appendFinanceLog(
      updated,
      'store_effect',
      effects.debtReduction,
      `Store consumable −$${effects.debtReduction.toLocaleString()} debt.`
    );
  }

  return updated;
}

function buildUseSummary(effects: ProductEffects): string {
  const parts: string[] = [];
  if (effects.dirtyCash) parts.push(`+$${effects.dirtyCash.toLocaleString()} cash`);
  if (effects.debtReduction) parts.push(`−$${effects.debtReduction.toLocaleString()} debt`);
  if (effects.heatReduction) parts.push(`−${effects.heatReduction} heat`);
  if (effects.localHeatReduction) parts.push(`−${effects.localHeatReduction} local heat`);
  if (effects.crewLoyalty) parts.push(`+${effects.crewLoyalty} crew loyalty`);
  if (effects.businessCondition) parts.push(`+${effects.businessCondition} business condition`);
  if (effects.temporaryStorage) {
    parts.push(`+${effects.temporaryStorage.capacity} storage for ${effects.temporaryStorage.days}d`);
  }
  if (effects.intelTips) parts.push(`+${effects.intelTips} reveal token(s) added to wallet`);
  if (effects.lawyerTokens) parts.push(`+${effects.lawyerTokens} lawyer token(s) added to wallet`);
  return parts.length ? parts.join(', ') : 'Consumable applied.';
}

function useTierCredit(
  profile: PlayerProfile,
  state: GameState,
  category: 'starter' | 'heat' | 'storage' | 'crew' | 'business',
  tier: 'small' | 'medium' | 'large',
  extraCheck?: (s: GameState) => string | null
): ConsumableUseResult {
  const prefixMap = {
    starter: 'starterBoostCredits',
    heat: 'heatCleanupCredits',
    storage: 'safehouseDropCredits',
    crew: 'crewLoyaltyCredits',
    business: 'businessRecoveryCredits',
  } as const;
  const creditKey = getTierCreditKey(prefixMap[category], tier);
  const productId = getProductIdForTier(category, tier);
  const def = PRODUCT_MAP[productId];

  if (category === 'starter') {
    const inv = getStoreInventory(state);
    if (inv.starterBoostUsedThisRun.includes(productId)) {
      return {
        ok: false,
        error: 'Starter boost already used this run.',
        profile,
        state,
      };
    }
    if (inv.starterBoostUsedThisRun.length > 0) {
      return {
        ok: false,
        error: 'Only one starter boost can be applied per run.',
        profile,
        state,
      };
    }
  }

  if (extraCheck) {
    const block = extraCheck(state);
    if (block) {
      return { ok: false, error: block, profile, state };
    }
  }

  const consumed = tryConsumeCredit(profile, creditKey);
  if (!consumed.ok) {
    return { ok: false, error: 'No credits available.', profile, state };
  }

  let updated = applyRunEffectsFromProduct(state, def.effects, productId);

  if (def.effects.intelTips) {
    consumed.profile = {
      ...consumed.profile,
      consumables: {
        ...consumed.profile.consumables,
        intelRevealTokens:
          consumed.profile.consumables.intelRevealTokens + def.effects.intelTips,
      },
    };
  }
  if (def.effects.lawyerTokens) {
    consumed.profile = {
      ...consumed.profile,
      consumables: {
        ...consumed.profile.consumables,
        emergencyLawyerTokens:
          consumed.profile.consumables.emergencyLawyerTokens + def.effects.lawyerTokens,
      },
    };
  }
  if (def.effects.robberyProtectionTokens) {
    consumed.profile = {
      ...consumed.profile,
      consumables: {
        ...consumed.profile.consumables,
        robberyProtectionTokens:
          consumed.profile.consumables.robberyProtectionTokens +
          def.effects.robberyProtectionTokens,
      },
    };
  }

  const summary = buildUseSummary(def.effects);
  updated = withMessage(updated, `Applied: ${summary}`);
  updated = applyProgressionAfterAction(checkGameOverState(updated));

  return { ok: true, profile: consumed.profile, state: updated, summary };
}

export function useStarterBoostCredit(
  profile: PlayerProfile,
  state: GameState,
  tier: 'small' | 'medium' | 'large'
): ConsumableUseResult {
  return useTierCredit(profile, state, 'starter', tier);
}

export function useHeatCleanupCredit(
  profile: PlayerProfile,
  state: GameState,
  tier: 'small' | 'medium' | 'large'
): ConsumableUseResult {
  return useTierCredit(profile, state, 'heat', tier);
}

export function useSafehouseDropCredit(
  profile: PlayerProfile,
  state: GameState,
  tier: 'small' | 'medium' | 'large'
): ConsumableUseResult {
  return useTierCredit(profile, state, 'storage', tier);
}

export function useCrewLoyaltyCredit(
  profile: PlayerProfile,
  state: GameState,
  tier: 'small' | 'medium' | 'large'
): ConsumableUseResult {
  return useTierCredit(profile, state, 'crew', tier, (s) => {
    const hired = (s.hiredCrew ?? []).filter((c) => c.status === 'hired');
    if (hired.length === 0) {
      return 'No hired crew — hire crew before using a loyalty pack.';
    }
    return null;
  });
}

export function useBusinessRecoveryCredit(
  profile: PlayerProfile,
  state: GameState,
  tier: 'small' | 'medium' | 'large'
): ConsumableUseResult {
  return useTierCredit(profile, state, 'business', tier, (s) => {
    if ((s.ownedBusinesses ?? []).length === 0) {
      return 'No owned businesses — buy a front before using recovery.';
    }
    return null;
  });
}

export function useLawyerToken(
  profile: PlayerProfile,
  state: GameState
): ConsumableUseResult {
  const consumed = tryConsumeCredit(profile, 'emergencyLawyerTokens');
  if (!consumed.ok) {
    return { ok: false, error: 'No lawyer tokens available.', profile, state };
  }

  let updated: GameState = {
    ...state,
    player: {
      ...state.player,
      federalCaseSeverity: clamp(state.player.federalCaseSeverity - 15, 0, 100),
      heat: clamp(state.player.heat - 6, 0, 100),
    },
  };

  if (updated.player.legalStatus === 'federal_case' && updated.player.federalCaseSeverity < 25) {
    updated.player.legalStatus = 'arrested';
  } else if (updated.player.legalStatus === 'jailed') {
    updated.player.daysInJail = Math.max(0, updated.player.daysInJail - 2);
  }

  updated = withMessage(
    updated,
    'Emergency Lawyer token used. Federal severity −15. Legal heat cooling.'
  );
  updated = applyProgressionAfterAction(checkGameOverState(updated));

  return {
    ok: true,
    profile: consumed.profile,
    state: updated,
    summary: 'Lawyer token applied — legal pressure reduced.',
  };
}

export function useRobberyProtectionToken(
  profile: PlayerProfile,
  state: GameState
): ConsumableUseResult {
  const consumed = tryConsumeCredit(profile, 'robberyProtectionTokens');
  if (!consumed.ok) {
    return { ok: false, error: 'No raid protection tokens available.', profile, state };
  }

  const inv = getStoreInventory(state);
  const updated = withStoreInventory(state, {
    ...inv,
    businessRaidProtectionUntilDay: Math.max(
      inv.businessRaidProtectionUntilDay,
      state.player.day + 3
    ),
  });

  return {
    ok: true,
    profile: consumed.profile,
    state: withMessage(updated, 'Raid protection token used — 3 days of elevated protection.'),
    summary: '3-day raid protection active.',
  };
}

export function useProductCredit(
  profile: PlayerProfile,
  state: GameState,
  productId: ProductId
): ConsumableUseResult {
  const def = PRODUCT_MAP[productId];
  if (!def) {
    return { ok: false, error: 'Unknown product.', profile, state };
  }

  switch (def.category) {
    case 'starter':
      return useStarterBoostCredit(profile, state, def.packSize);
    case 'heat':
      return useHeatCleanupCredit(profile, state, def.packSize);
    case 'storage':
      return useSafehouseDropCredit(profile, state, def.packSize);
    case 'crew':
      return useCrewLoyaltyCredit(profile, state, def.packSize);
    case 'business':
      return useBusinessRecoveryCredit(profile, state, def.packSize);
    case 'legal':
      return useLawyerToken(profile, state);
    case 'intel':
      return {
        ok: false,
        error: 'Use Reveal Intel on the Intel screen to spend reveal tokens.',
        profile,
        state,
      };
    default:
      return { ok: false, error: 'Cannot use this product directly.', profile, state };
  }
}

export function buildPurchaseGrantSummary(productId: ProductId): string {
  const def = PRODUCT_MAP[productId];
  if (!def) return 'Purchase applied.';
  const parts: string[] = [];
  const amount =
    productId === 'emergency_lawyer_1'
      ? 1
      : productId === 'emergency_lawyer_3'
        ? 3
        : productId === 'emergency_lawyer_7'
          ? 7
          : productId === 'intel_pack_3'
            ? 3
            : productId === 'intel_pack_10'
              ? 10
              : productId === 'intel_pack_25'
                ? 25
                : 1;
  if (def.category === 'legal') {
    parts.push(`+${amount} lawyer token${amount === 1 ? '' : 's'} added to wallet`);
  } else if (def.category === 'intel') {
    parts.push(`+${amount} reveal token${amount === 1 ? '' : 's'} added to wallet`);
  } else {
    parts.push(`+1 ${def.title} credit added to wallet`);
  }
  if (def.effects.robberyProtectionTokens) {
    parts.push(`+${def.effects.robberyProtectionTokens} raid protection token`);
  }
  return `Purchase applied: ${parts.join(', ')}. Use from Store when ready.`;
}
