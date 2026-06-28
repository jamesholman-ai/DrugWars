/**
 * Platform billing adapter — placeholder until App Store / Google Play products are configured.
 *
 * Integration path (when ready):
 * 1. Add `expo-in-app-purchases` or `react-native-iap`.
 * 2. Create products in App Store Connect / Play Console using SKUs from src/data/products.ts.
 * 3. Set ENABLE_REAL_IAP = true after sandbox testing passes.
 * 4. Replace stub implementations with real purchase / restore / finishTransaction flows.
 * 5. Only grant profile credits after the platform confirms success.
 */

import { ProductId, PurchaseResult } from '../types/products';
import { PRODUCT_MAP } from '../data/products';

/** Flip to true after store products exist and IAP library is wired. */
export const ENABLE_REAL_IAP = false;

/** @deprecated Use ENABLE_REAL_IAP */
export const BILLING_CONFIGURED = ENABLE_REAL_IAP;

/** Dev mock purchases — never enabled in production builds. */
export const LOCAL_STORE_ENABLED = __DEV__ && !ENABLE_REAL_IAP;

let devTransactionCounter = 0;

export function createDevTransactionId(productId: ProductId): string {
  devTransactionCounter += 1;
  return `dev_${productId}_${Date.now()}_${devTransactionCounter}`;
}

export function isStorePurchaseEnabled(): boolean {
  return ENABLE_REAL_IAP || LOCAL_STORE_ENABLED;
}

export function isPlatformBillingLive(): boolean {
  return ENABLE_REAL_IAP;
}

export function isDevMockStoreEnabled(): boolean {
  return LOCAL_STORE_ENABLED;
}

export function getBillingStatusMessage(): string {
  if (ENABLE_REAL_IAP) {
    return 'Live purchases — processed securely by Apple or Google.';
  }
  if (LOCAL_STORE_ENABLED) {
    return 'Testing mode — mock purchases grant wallet credits locally. No real charges.';
  }
  return 'In-app purchases are not available in this release.';
}

/** Load store product metadata from the platform. */
export async function loadProducts(): Promise<{ ok: boolean; error?: string }> {
  if (!ENABLE_REAL_IAP) {
    return { ok: true };
  }
  // TODO: expo-iap / react-native-iap loadProducts
  return { ok: false, error: 'Billing adapter not implemented.' };
}

export async function purchaseProduct(productId: ProductId): Promise<PurchaseResult> {
  if (!PRODUCT_MAP[productId]) {
    return { ok: false, error: 'Unknown product.', code: 'unknown' };
  }

  if (ENABLE_REAL_IAP) {
    // TODO: expo-iap / react-native-iap purchase flow
    return {
      ok: false,
      error: 'Billing adapter not implemented.',
      code: 'unknown',
    };
  }

  if (LOCAL_STORE_ENABLED) {
    return {
      ok: true,
      productId,
      localDev: true,
      transactionId: createDevTransactionId(productId),
      platform: 'local_dev',
    };
  }

  return {
    ok: false,
    error: 'In-app purchases are not available in this release.',
    code: 'billing_unavailable',
  };
}

export async function finishTransaction(_transactionId: string): Promise<{ ok: boolean }> {
  if (!ENABLE_REAL_IAP) {
    return { ok: true };
  }
  // TODO: platform finishTransaction
  return { ok: false };
}

export async function restorePurchases(): Promise<
  PurchaseResult & { restoredIds?: ProductId[]; restoredTransactions?: Array<{ productId: ProductId; transactionId: string }> }
> {
  if (ENABLE_REAL_IAP) {
    // TODO: platform restore
    return {
      ok: false,
      error: 'Billing adapter not implemented.',
      code: 'unknown',
    };
  }

  if (LOCAL_STORE_ENABLED) {
    return {
      ok: true,
      localDev: true,
      restoredIds: [],
      restoredTransactions: [],
    };
  }

  return {
    ok: false,
    error: 'Restore unavailable in this build.',
    code: 'billing_unavailable',
  };
}

export async function getOwnedEntitlements(): Promise<ProductId[]> {
  if (!ENABLE_REAL_IAP) return [];
  // TODO: map platform purchases to ProductId[]
  return [];
}
