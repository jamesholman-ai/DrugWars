import { ProductId } from './products';

export interface TemporaryStorageBoost {
  capacity: number;
  expiresDay: number;
}

/** Run-scoped timed boosts and per-run flags (wallet credits live in PlayerProfile). */
export interface StoreInventory {
  /** @deprecated Migrated to PlayerProfile — kept for save migration only */
  lawyerTokens: number;
  /** @deprecated Migrated to PlayerProfile */
  intelTips: number;
  /** @deprecated Migrated to PlayerProfile */
  robberyProtectionTokens: number;
  temporaryStorageBoosts: TemporaryStorageBoost[];
  temporaryPoliceReductionUntilDay: number;
  businessRaidProtectionUntilDay: number;
  starterBoostUsedThisRun: ProductId[];
  payrollCredits: number;
  businessUpkeepCredits: number;
}

export function createDefaultStoreInventory(): StoreInventory {
  return {
    lawyerTokens: 0,
    intelTips: 0,
    robberyProtectionTokens: 0,
    temporaryStorageBoosts: [],
    temporaryPoliceReductionUntilDay: 0,
    businessRaidProtectionUntilDay: 0,
    starterBoostUsedThisRun: [],
    payrollCredits: 0,
    businessUpkeepCredits: 0,
  };
}
