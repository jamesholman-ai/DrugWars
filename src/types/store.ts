import { ProductId } from './products';

export interface TemporaryStorageBoost {
  capacity: number;
  expiresDay: number;
}

/** Consumable inventory and timed boosts persisted with the active run. */
export interface StoreInventory {
  lawyerTokens: number;
  intelTips: number;
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
