import { ProductEffects } from '../data/productEffects';

/** Internal store product identifiers — match App Store / Play Console SKUs suffix. */
export type ProductId =
  | 'starter_boost_small'
  | 'starter_boost_medium'
  | 'starter_boost_large'
  | 'emergency_lawyer_1'
  | 'emergency_lawyer_3'
  | 'emergency_lawyer_7'
  | 'intel_pack_3'
  | 'intel_pack_10'
  | 'intel_pack_25'
  | 'safehouse_drop_small'
  | 'safehouse_drop_medium'
  | 'safehouse_drop_large'
  | 'heat_cleanup_small'
  | 'heat_cleanup_medium'
  | 'heat_cleanup_large'
  | 'crew_loyalty_small'
  | 'crew_loyalty_medium'
  | 'crew_loyalty_large'
  | 'business_recovery_small'
  | 'business_recovery_medium'
  | 'business_recovery_large';

export type ProductCategory =
  | 'starter'
  | 'legal'
  | 'intel'
  | 'heat'
  | 'storage'
  | 'crew'
  | 'business';

export type PackSize = 'small' | 'medium' | 'large';

export interface ProductDefinition {
  id: ProductId;
  category: ProductCategory;
  packSize: PackSize;
  title: string;
  subtitle: string;
  description: string;
  priceLabel: string;
  benefits: string[];
  effects: ProductEffects;
  bestValue?: boolean;
  appleProductId: string;
  googleProductId: string;
}

export interface PurchaseRecord {
  productId: ProductId;
  purchasedAt: string;
  source: 'purchase' | 'restore';
  transactionId?: string;
}

export interface EntitlementState {
  purchaseHistory: PurchaseRecord[];
  lastRestoreAt: string | null;
}

export type PurchaseResult =
  | {
      ok: true;
      productId?: ProductId;
      localDev?: boolean;
      restoredIds?: ProductId[];
      transactionId?: string;
      platform?: 'apple' | 'google' | 'local_dev';
    }
  | { ok: false; error: string; code?: 'billing_unavailable' | 'cancelled' | 'already_used' | 'unknown' };
