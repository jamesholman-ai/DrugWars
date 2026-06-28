import { PRODUCT_MAP } from '../data/products';
import {
  ConsumableCreditKey,
  createDefaultConsumableBalances,
  PlayerProfile,
} from '../types/playerProfile';
import { ProductId, ProductCategory } from '../types/products';

const PRODUCT_CREDIT_MAP: Record<ProductId, ConsumableCreditKey> = {
  starter_boost_small: 'starterBoostCreditsSmall',
  starter_boost_medium: 'starterBoostCreditsMedium',
  starter_boost_large: 'starterBoostCreditsLarge',
  emergency_lawyer_1: 'emergencyLawyerTokens',
  emergency_lawyer_3: 'emergencyLawyerTokens',
  emergency_lawyer_7: 'emergencyLawyerTokens',
  intel_pack_3: 'intelRevealTokens',
  intel_pack_10: 'intelRevealTokens',
  intel_pack_25: 'intelRevealTokens',
  safehouse_drop_small: 'safehouseDropCreditsSmall',
  safehouse_drop_medium: 'safehouseDropCreditsMedium',
  safehouse_drop_large: 'safehouseDropCreditsLarge',
  heat_cleanup_small: 'heatCleanupCreditsSmall',
  heat_cleanup_medium: 'heatCleanupCreditsMedium',
  heat_cleanup_large: 'heatCleanupCreditsLarge',
  crew_loyalty_small: 'crewLoyaltyCreditsSmall',
  crew_loyalty_medium: 'crewLoyaltyCreditsMedium',
  crew_loyalty_large: 'crewLoyaltyCreditsLarge',
  business_recovery_small: 'businessRecoveryCreditsSmall',
  business_recovery_medium: 'businessRecoveryCreditsMedium',
  business_recovery_large: 'businessRecoveryCreditsLarge',
};

const PRODUCT_GRANT_AMOUNT: Partial<Record<ProductId, number>> = {
  emergency_lawyer_1: 1,
  emergency_lawyer_3: 3,
  emergency_lawyer_7: 7,
  intel_pack_3: 3,
  intel_pack_10: 10,
  intel_pack_25: 25,
};

function addCredit(
  profile: PlayerProfile,
  key: ConsumableCreditKey,
  amount: number
): PlayerProfile {
  if (amount <= 0) return profile;
  return {
    ...profile,
    consumables: {
      ...profile.consumables,
      [key]: profile.consumables[key] + amount,
    },
  };
}

export function getCreditKeyForProduct(productId: ProductId): ConsumableCreditKey {
  return PRODUCT_CREDIT_MAP[productId];
}

export function getGrantAmountForProduct(productId: ProductId): number {
  return PRODUCT_GRANT_AMOUNT[productId] ?? 1;
}

export function grantProductCredits(
  profile: PlayerProfile,
  productId: ProductId
): PlayerProfile {
  const def = PRODUCT_MAP[productId];
  if (!def) return profile;

  let next = profile;
  const creditKey = PRODUCT_CREDIT_MAP[productId];
  const amount = getGrantAmountForProduct(productId);
  next = addCredit(next, creditKey, amount);

  const { effects } = def;
  if (effects.robberyProtectionTokens) {
    next = addCredit(next, 'robberyProtectionTokens', effects.robberyProtectionTokens);
  }

  return next;
}

export function getCreditBalance(profile: PlayerProfile, key: ConsumableCreditKey): number {
  return profile.consumables[key] ?? 0;
}

export function tryConsumeCredit(
  profile: PlayerProfile,
  key: ConsumableCreditKey,
  amount = 1
): { profile: PlayerProfile; ok: boolean } {
  const current = profile.consumables[key];
  if (current < amount) return { profile, ok: false };
  return {
    profile: {
      ...profile,
      consumables: {
        ...profile.consumables,
        [key]: current - amount,
      },
    },
    ok: true,
  };
}

export function getProfileInventorySummary(profile: PlayerProfile): {
  lawyer: number;
  intel: number;
  robbery: number;
  starter: number;
  heat: number;
  storage: number;
  crew: number;
  business: number;
} {
  const c = profile.consumables;
  return {
    lawyer: c.emergencyLawyerTokens,
    intel: c.intelRevealTokens,
    robbery: c.robberyProtectionTokens,
    starter:
      c.starterBoostCreditsSmall +
      c.starterBoostCreditsMedium +
      c.starterBoostCreditsLarge,
    heat:
      c.heatCleanupCreditsSmall +
      c.heatCleanupCreditsMedium +
      c.heatCleanupCreditsLarge,
    storage:
      c.safehouseDropCreditsSmall +
      c.safehouseDropCreditsMedium +
      c.safehouseDropCreditsLarge,
    crew:
      c.crewLoyaltyCreditsSmall +
      c.crewLoyaltyCreditsMedium +
      c.crewLoyaltyCreditsLarge,
    business:
      c.businessRecoveryCreditsSmall +
      c.businessRecoveryCreditsMedium +
      c.businessRecoveryCreditsLarge,
  };
}

export function getCategoryOwnedBalance(
  profile: PlayerProfile,
  category: ProductCategory
): number {
  const c = profile.consumables;
  switch (category) {
    case 'starter':
      return c.starterBoostCreditsSmall + c.starterBoostCreditsMedium + c.starterBoostCreditsLarge;
    case 'legal':
      return c.emergencyLawyerTokens;
    case 'intel':
      return c.intelRevealTokens;
    case 'heat':
      return c.heatCleanupCreditsSmall + c.heatCleanupCreditsMedium + c.heatCleanupCreditsLarge;
    case 'storage':
      return (
        c.safehouseDropCreditsSmall +
        c.safehouseDropCreditsMedium +
        c.safehouseDropCreditsLarge +
        c.robberyProtectionTokens
      );
    case 'crew':
      return c.crewLoyaltyCreditsSmall + c.crewLoyaltyCreditsMedium + c.crewLoyaltyCreditsLarge;
    case 'business':
      return (
        c.businessRecoveryCreditsSmall +
        c.businessRecoveryCreditsMedium +
        c.businessRecoveryCreditsLarge
      );
    default:
      return 0;
  }
}

export function getTierCreditKey(
  prefix:
    | 'starterBoostCredits'
    | 'heatCleanupCredits'
    | 'safehouseDropCredits'
    | 'crewLoyaltyCredits'
    | 'businessRecoveryCredits',
  tier: 'small' | 'medium' | 'large'
): ConsumableCreditKey {
  const suffix = tier.charAt(0).toUpperCase() + tier.slice(1);
  return `${prefix}${suffix}` as ConsumableCreditKey;
}

export function getProductIdForTier(
  category: 'starter' | 'heat' | 'storage' | 'crew' | 'business',
  tier: 'small' | 'medium' | 'large'
): ProductId {
  const map: Record<string, ProductId> = {
    starter_small: 'starter_boost_small',
    starter_medium: 'starter_boost_medium',
    starter_large: 'starter_boost_large',
    heat_small: 'heat_cleanup_small',
    heat_medium: 'heat_cleanup_medium',
    heat_large: 'heat_cleanup_large',
    storage_small: 'safehouse_drop_small',
    storage_medium: 'safehouse_drop_medium',
    storage_large: 'safehouse_drop_large',
    crew_small: 'crew_loyalty_small',
    crew_medium: 'crew_loyalty_medium',
    crew_large: 'crew_loyalty_large',
    business_small: 'business_recovery_small',
    business_medium: 'business_recovery_medium',
    business_large: 'business_recovery_large',
  };
  return map[`${category}_${tier}`]!;
}

export function getOwnedBalanceForProduct(
  profile: PlayerProfile,
  productId: ProductId
): number {
  const key = PRODUCT_CREDIT_MAP[productId];
  if (key === 'emergencyLawyerTokens' || key === 'intelRevealTokens') {
    return profile.consumables[key];
  }
  return profile.consumables[key];
}

export { createDefaultConsumableBalances };
