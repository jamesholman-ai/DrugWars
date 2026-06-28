import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCT_MAP } from '../data/products';
import {
  ConsumableBalances,
  createDefaultConsumableBalances,
  createDefaultPlayerProfile,
  PlayerProfile,
  PurchasePlatform,
  PurchaseTransaction,
  PurchaseTransactionStatus,
} from '../types/playerProfile';
import { ProductId, PurchaseRecord } from '../types/products';
import { createDefaultStoreInventory, StoreInventory } from '../types/store';

export const PROFILE_STORAGE_KEY = 'drugwarsreloaded.playerProfile.v1';
export const PROFILE_VERSION = 1;

interface ProfileEnvelope {
  version: number;
  savedAt: string;
  profile: PlayerProfile;
}

function isProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && value in PRODUCT_MAP;
}

function migrateConsumables(raw: unknown): ConsumableBalances {
  const defaults = createDefaultConsumableBalances();
  if (!raw || typeof raw !== 'object') return defaults;
  const data = raw as Partial<ConsumableBalances>;
  const next = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof ConsumableBalances)[]) {
    const value = data[key];
    next[key] = typeof value === 'number' && value >= 0 ? Math.floor(value) : defaults[key];
  }
  return next;
}

function migrateTransaction(raw: unknown): PurchaseTransaction | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Partial<PurchaseTransaction>;
  if (typeof t.transactionId !== 'string' || !isProductId(t.productId)) return null;
  const status = t.status;
  const validStatus: PurchaseTransactionStatus[] = [
    'pending',
    'granted',
    'failed',
    'refunded',
    'restored',
  ];
  return {
    transactionId: t.transactionId,
    productId: t.productId,
    platform:
      t.platform === 'apple' || t.platform === 'google' || t.platform === 'local_dev'
        ? t.platform
        : 'local_dev',
    purchasedAt: typeof t.purchasedAt === 'string' ? t.purchasedAt : new Date().toISOString(),
    grantedAt: typeof t.grantedAt === 'string' ? t.grantedAt : undefined,
    status: validStatus.includes(status as PurchaseTransactionStatus)
      ? (status as PurchaseTransactionStatus)
      : 'granted',
    quantityGranted: typeof t.quantityGranted === 'number' ? Math.max(0, t.quantityGranted) : 1,
  };
}

export function migratePlayerProfile(raw: unknown): PlayerProfile {
  if (!raw || typeof raw !== 'object') return createDefaultPlayerProfile();
  const data = raw as Partial<PlayerProfile>;

  const purchaseHistory = Array.isArray(data.purchaseHistory)
    ? data.purchaseHistory.map(migrateTransaction).filter((t): t is PurchaseTransaction => t != null)
    : [];

  const processedTransactionIds = Array.isArray(data.processedTransactionIds)
    ? data.processedTransactionIds.filter((id) => typeof id === 'string').slice(0, 500)
    : [];

  const pendingTransactionIds = Array.isArray(data.pendingTransactionIds)
    ? data.pendingTransactionIds.filter((id) => typeof id === 'string').slice(0, 50)
    : [];

  const totalPurchasesByProduct: Partial<Record<ProductId, number>> = {};
  if (data.totalPurchasesByProduct && typeof data.totalPurchasesByProduct === 'object') {
    for (const [key, value] of Object.entries(data.totalPurchasesByProduct)) {
      if (isProductId(key) && typeof value === 'number' && value > 0) {
        totalPurchasesByProduct[key] = Math.floor(value);
      }
    }
  }

  return {
    consumables: migrateConsumables(data.consumables),
    processedTransactionIds,
    pendingTransactionIds,
    purchaseHistory: purchaseHistory.slice(0, 200),
    totalPurchasesByProduct,
  };
}

export function mergeLegacyPurchaseHistory(
  profile: PlayerProfile,
  records: PurchaseRecord[]
): PlayerProfile {
  let next = profile;
  for (const record of records) {
    if (!isProductId(record.productId)) continue;
    const txId = record.transactionId ?? `legacy_${record.productId}_${record.purchasedAt}`;
    if (next.processedTransactionIds.includes(txId)) continue;
    const transaction: PurchaseTransaction = {
      transactionId: txId,
      productId: record.productId,
      platform: 'local_dev',
      purchasedAt: record.purchasedAt,
      grantedAt: record.purchasedAt,
      status: record.source === 'restore' ? 'restored' : 'granted',
      quantityGranted: 1,
    };
    next = {
      ...next,
      purchaseHistory: [transaction, ...next.purchaseHistory].slice(0, 200),
      processedTransactionIds: [...next.processedTransactionIds, txId].slice(0, 500),
      totalPurchasesByProduct: {
        ...next.totalPurchasesByProduct,
        [record.productId]: (next.totalPurchasesByProduct[record.productId] ?? 0) + 1,
      },
    };
  }
  return next;
}

export function mergeRunStoreInventoryIntoProfile(
  profile: PlayerProfile,
  storeInv: StoreInventory
): PlayerProfile {
  const c = profile.consumables;
  const hasLegacy =
    storeInv.lawyerTokens > 0 ||
    storeInv.intelTips > 0 ||
    storeInv.robberyProtectionTokens > 0;

  if (!hasLegacy) return profile;

  return {
    ...profile,
    consumables: {
      ...c,
      emergencyLawyerTokens: c.emergencyLawyerTokens + storeInv.lawyerTokens,
      intelRevealTokens: c.intelRevealTokens + storeInv.intelTips,
      robberyProtectionTokens: c.robberyProtectionTokens + storeInv.robberyProtectionTokens,
    },
  };
}

export async function loadPlayerProfile(): Promise<PlayerProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return createDefaultPlayerProfile();
    const parsed = JSON.parse(raw) as ProfileEnvelope;
    if (!parsed?.profile) return createDefaultPlayerProfile();
    return migratePlayerProfile(parsed.profile);
  } catch {
    return createDefaultPlayerProfile();
  }
}

export async function savePlayerProfile(profile: PlayerProfile): Promise<void> {
  const envelope: ProfileEnvelope = {
    version: PROFILE_VERSION,
    savedAt: new Date().toISOString(),
    profile: migratePlayerProfile(profile),
  };
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(envelope));
}

export async function clearPlayerProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function isTransactionProcessed(profile: PlayerProfile, transactionId: string): boolean {
  return profile.processedTransactionIds.includes(transactionId);
}

export function markTransactionPending(
  profile: PlayerProfile,
  transactionId: string
): PlayerProfile {
  if (
    profile.processedTransactionIds.includes(transactionId) ||
    profile.pendingTransactionIds.includes(transactionId)
  ) {
    return profile;
  }
  return {
    ...profile,
    pendingTransactionIds: [...profile.pendingTransactionIds, transactionId].slice(0, 50),
  };
}

export function grantPurchaseTransaction(
  profile: PlayerProfile,
  transaction: Omit<PurchaseTransaction, 'grantedAt' | 'status'> & {
    status?: PurchaseTransactionStatus;
  },
  grantCredits: (p: PlayerProfile) => PlayerProfile
): { profile: PlayerProfile; alreadyApplied: boolean } {
  const { transactionId } = transaction;
  if (profile.processedTransactionIds.includes(transactionId)) {
    return { profile, alreadyApplied: true };
  }

  let next = grantCredits(profile);
  const grantedAt = new Date().toISOString();
  const record: PurchaseTransaction = {
    ...transaction,
    grantedAt,
    status: transaction.status ?? 'granted',
  };

  next = {
    ...next,
    processedTransactionIds: [...next.processedTransactionIds, transactionId].slice(0, 500),
    pendingTransactionIds: next.pendingTransactionIds.filter((id) => id !== transactionId),
    purchaseHistory: [record, ...next.purchaseHistory].slice(0, 200),
    totalPurchasesByProduct: {
      ...next.totalPurchasesByProduct,
      [transaction.productId]:
        (next.totalPurchasesByProduct[transaction.productId] ?? 0) + transaction.quantityGranted,
    },
  };

  return { profile: next, alreadyApplied: false };
}

export function stripPersistentTokensFromStoreInventory(
  storeInv: StoreInventory
): StoreInventory {
  return {
    ...createDefaultStoreInventory(),
    temporaryStorageBoosts: storeInv.temporaryStorageBoosts,
    temporaryPoliceReductionUntilDay: storeInv.temporaryPoliceReductionUntilDay,
    businessRaidProtectionUntilDay: storeInv.businessRaidProtectionUntilDay,
    starterBoostUsedThisRun: storeInv.starterBoostUsedThisRun,
    payrollCredits: storeInv.payrollCredits,
    businessUpkeepCredits: storeInv.businessUpkeepCredits,
  };
}
