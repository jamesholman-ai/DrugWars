import { ProductId } from './products';

/** Persistent consumable balances — survive new games and app restarts. */
export interface ConsumableBalances {
  emergencyLawyerTokens: number;
  intelRevealTokens: number;
  robberyProtectionTokens: number;
  heatCleanupCreditsSmall: number;
  heatCleanupCreditsMedium: number;
  heatCleanupCreditsLarge: number;
  safehouseDropCreditsSmall: number;
  safehouseDropCreditsMedium: number;
  safehouseDropCreditsLarge: number;
  crewLoyaltyCreditsSmall: number;
  crewLoyaltyCreditsMedium: number;
  crewLoyaltyCreditsLarge: number;
  businessRecoveryCreditsSmall: number;
  businessRecoveryCreditsMedium: number;
  businessRecoveryCreditsLarge: number;
  starterBoostCreditsSmall: number;
  starterBoostCreditsMedium: number;
  starterBoostCreditsLarge: number;
}

export type PurchaseTransactionStatus =
  | 'pending'
  | 'granted'
  | 'failed'
  | 'refunded'
  | 'restored';

export type PurchasePlatform = 'apple' | 'google' | 'local_dev';

export interface PurchaseTransaction {
  transactionId: string;
  productId: ProductId;
  platform: PurchasePlatform;
  purchasedAt: string;
  grantedAt?: string;
  status: PurchaseTransactionStatus;
  quantityGranted: number;
}

export interface PlayerProfile {
  consumables: ConsumableBalances;
  processedTransactionIds: string[];
  pendingTransactionIds: string[];
  purchaseHistory: PurchaseTransaction[];
  totalPurchasesByProduct: Partial<Record<ProductId, number>>;
}

export function createDefaultConsumableBalances(): ConsumableBalances {
  return {
    emergencyLawyerTokens: 0,
    intelRevealTokens: 0,
    robberyProtectionTokens: 0,
    heatCleanupCreditsSmall: 0,
    heatCleanupCreditsMedium: 0,
    heatCleanupCreditsLarge: 0,
    safehouseDropCreditsSmall: 0,
    safehouseDropCreditsMedium: 0,
    safehouseDropCreditsLarge: 0,
    crewLoyaltyCreditsSmall: 0,
    crewLoyaltyCreditsMedium: 0,
    crewLoyaltyCreditsLarge: 0,
    businessRecoveryCreditsSmall: 0,
    businessRecoveryCreditsMedium: 0,
    businessRecoveryCreditsLarge: 0,
    starterBoostCreditsSmall: 0,
    starterBoostCreditsMedium: 0,
    starterBoostCreditsLarge: 0,
  };
}

export function createDefaultPlayerProfile(): PlayerProfile {
  return {
    consumables: createDefaultConsumableBalances(),
    processedTransactionIds: [],
    pendingTransactionIds: [],
    purchaseHistory: [],
    totalPurchasesByProduct: {},
  };
}

export type CreditTier = 'small' | 'medium' | 'large';

export type ConsumableCreditKey = keyof ConsumableBalances;
