import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCT_MAP } from '../data/products';
import { EntitlementState, ProductId, PurchaseRecord } from '../types/products';

export const ENTITLEMENTS_STORAGE_KEY = '@neon_underworld/entitlements';
export const ENTITLEMENTS_VERSION = 2;

interface EntitlementsEnvelope {
  version: number;
  state: EntitlementState;
}

export function createDefaultEntitlementState(): EntitlementState {
  return {
    purchaseHistory: [],
    lastRestoreAt: null,
  };
}

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && value in PRODUCT_MAP;
}

function migrateEntitlementState(raw: unknown): EntitlementState {
  if (!raw || typeof raw !== 'object') {
    return createDefaultEntitlementState();
  }

  const state = raw as Partial<EntitlementState>;
  const purchaseHistory: PurchaseRecord[] = Array.isArray(state.purchaseHistory)
    ? state.purchaseHistory
        .filter(
          (entry): entry is PurchaseRecord =>
            !!entry &&
            typeof entry === 'object' &&
            isProductId((entry as PurchaseRecord).productId) &&
            typeof (entry as PurchaseRecord).purchasedAt === 'string'
        )
        .slice(0, 100)
    : [];

  return {
    purchaseHistory,
    lastRestoreAt: typeof state.lastRestoreAt === 'string' ? state.lastRestoreAt : null,
  };
}

export async function loadEntitlementState(): Promise<EntitlementState> {
  try {
    const raw = await AsyncStorage.getItem(ENTITLEMENTS_STORAGE_KEY);
    if (!raw) return createDefaultEntitlementState();

    const parsed = JSON.parse(raw) as EntitlementsEnvelope;
    if (!parsed || typeof parsed !== 'object' || !parsed.state) {
      return createDefaultEntitlementState();
    }

    return migrateEntitlementState(parsed.state);
  } catch {
    return createDefaultEntitlementState();
  }
}

export async function saveEntitlementState(state: EntitlementState): Promise<void> {
  const envelope: EntitlementsEnvelope = {
    version: ENTITLEMENTS_VERSION,
    state,
  };
  await AsyncStorage.setItem(ENTITLEMENTS_STORAGE_KEY, JSON.stringify(envelope));
}

export function recordPurchase(
  state: EntitlementState,
  record: PurchaseRecord
): EntitlementState {
  return {
    ...state,
    purchaseHistory: [record, ...state.purchaseHistory].slice(0, 100),
  };
}

export function markRestoreComplete(state: EntitlementState): EntitlementState {
  return {
    ...state,
    lastRestoreAt: new Date().toISOString(),
  };
}

export function mergeRestoredPurchases(
  state: EntitlementState,
  records: PurchaseRecord[]
): EntitlementState {
  let next = markRestoreComplete(state);
  for (const record of records) {
    if (!isProductId(record.productId)) continue;
    next = recordPurchase(next, record);
  }
  return next;
}
