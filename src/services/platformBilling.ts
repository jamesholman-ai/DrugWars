/**
 * Platform billing adapter — placeholder until App Store / Google Play products are configured.
 *
 * Integration path (when ready):
 * 1. Add `expo-in-app-purchases` or `react-native-iap`.
 * 2. Create products in App Store Connect / Play Console using SKUs from src/data/products.ts.
 * 3. Set BILLING_CONFIGURED = true after sandbox testing passes.
 * 4. Replace stub implementations with real purchase / restore / finishTransaction flows.
 * 5. Only call applyStorePurchase() after the platform confirms success.
 *
 * Until then, LOCAL_STORE_ENABLED allows QA purchases that apply fixed in-game effects locally
 * without charging real money.
 */

import { ProductId, PurchaseResult } from '../types/products';
import { PRODUCT_MAP } from '../data/products';

/** Flip to true after store products exist and IAP library is wired. */
export const BILLING_CONFIGURED = false;

/** Local dev/QA purchases apply in-game effects without platform billing. */
export const LOCAL_STORE_ENABLED = true;

export function isStorePurchaseEnabled(): boolean {
  return BILLING_CONFIGURED || LOCAL_STORE_ENABLED;
}

export function isPlatformBillingLive(): boolean {
  return BILLING_CONFIGURED;
}

export function getBillingStatusMessage(): string {
  if (BILLING_CONFIGURED) {
    return 'Purchases are processed securely by Apple or Google.';
  }
  if (LOCAL_STORE_ENABLED) {
    return 'Local store active for testing. Platform billing pending — no real charges yet.';
  }
  return 'In-app purchases are coming soon. Store billing is not configured yet.';
}

export async function purchaseProduct(productId: ProductId): Promise<PurchaseResult> {
  if (!PRODUCT_MAP[productId]) {
    return { ok: false, error: 'Unknown product.', code: 'unknown' };
  }

  if (BILLING_CONFIGURED) {
    // TODO: expo-iap / react-native-iap purchase flow
    return {
      ok: false,
      error: 'Billing adapter not implemented.',
      code: 'unknown',
    };
  }

  if (LOCAL_STORE_ENABLED) {
    return { ok: true, productId, localDev: true };
  }

  return {
    ok: false,
    error: 'Purchases are not available yet. Billing setup is pending.',
    code: 'billing_unavailable',
  };
}

export async function restorePurchases(): Promise<
  PurchaseResult & { restoredIds?: ProductId[] }
> {
  if (BILLING_CONFIGURED) {
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
    };
  }

  return {
    ok: false,
    error: 'Restore is not available yet. Billing setup is pending.',
    code: 'billing_unavailable',
  };
}

export async function getOwnedEntitlements(): Promise<ProductId[]> {
  if (!BILLING_CONFIGURED) return [];
  // TODO: map platform purchases to ProductId[]
  return [];
}
