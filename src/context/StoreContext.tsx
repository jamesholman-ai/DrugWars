import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  getCategoryOwnedBalance,
  getOwnedBalanceForProduct,
  grantProductCredits,
} from '../game/consumableCredits';
import { buildPurchaseGrantSummary, useProductCredit } from '../game/consumableUseSystem';
import { loadEntitlementState } from '../game/entitlements';
import {
  clearPlayerProfile,
  grantPurchaseTransaction,
  loadPlayerProfile,
  mergeLegacyPurchaseHistory,
  savePlayerProfile,
} from '../game/profileStorage';
import {
  finishTransaction,
  getBillingStatusMessage,
  isDevMockStoreEnabled,
  isPlatformBillingLive,
  isStorePurchaseEnabled,
  purchaseProduct as purchaseProductBilling,
  restorePurchases as restorePurchasesBilling,
} from '../services/platformBilling';
import { GameState } from '../types/game';
import { createDefaultPlayerProfile, PlayerProfile, PurchaseTransaction } from '../types/playerProfile';
import { ProductId, ProductCategory } from '../types/products';

interface StoreContextValue {
  profile: PlayerProfile;
  isStoreReady: boolean;
  storePurchaseEnabled: boolean;
  platformBillingLive: boolean;
  devMockEnabled: boolean;
  billingStatusMessage: string;
  purchaseStoreProduct: (productId: ProductId) => Promise<{ ok: boolean; message: string }>;
  useStoreCredit: (
    productId: ProductId,
    gameState: GameState
  ) => { ok: boolean; message: string; profile: PlayerProfile; state: GameState };
  getOwnedForCategory: (category: ProductCategory) => number;
  getOwnedForProduct: (productId: ProductId) => number;
  restorePurchases: () => Promise<{ ok: boolean; message: string }>;
  resetPlayerProfile: () => Promise<void>;
  persistProfile: (profile: PlayerProfile) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      let loaded = await loadPlayerProfile();
      const legacyEntitlements = await loadEntitlementState();
      loaded = mergeLegacyPurchaseHistory(loaded, legacyEntitlements.purchaseHistory);
      if (!mounted) return;
      setProfile(loaded);
      setIsStoreReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistProfile = useCallback(async (next: PlayerProfile) => {
    await savePlayerProfile(next);
    setProfile(next);
  }, []);

  const purchaseStoreProduct = useCallback(
    async (productId: ProductId): Promise<{ ok: boolean; message: string }> => {
      if (!isStorePurchaseEnabled()) {
        return { ok: false, message: 'In-app purchases are not available in this release.' };
      }

      const current = profile ?? (await loadPlayerProfile());
      const billing = await purchaseProductBilling(productId);
      if (!billing.ok) {
        return { ok: false, message: billing.error };
      }

      const transactionId = billing.transactionId ?? `fallback_${productId}_${Date.now()}`;
      const platform = billing.platform ?? (billing.localDev ? 'local_dev' : 'apple');

      const { profile: granted, alreadyApplied } = grantPurchaseTransaction(
        current,
        {
          transactionId,
          productId,
          platform,
          purchasedAt: new Date().toISOString(),
          quantityGranted: 1,
        },
        (p) => grantProductCredits(p, productId)
      );

      await persistProfile(granted);
      await finishTransaction(transactionId);

      if (alreadyApplied) {
        return { ok: true, message: 'Purchase already applied.' };
      }

      return { ok: true, message: buildPurchaseGrantSummary(productId) };
    },
    [profile, persistProfile]
  );

  const useStoreCredit = useCallback(
    (productId: ProductId, gameState: GameState) => {
      const current = profile ?? createDefaultPlayerProfile();
      const result = useProductCredit(current, gameState, productId);
      if (result.ok) {
        void persistProfile(result.profile);
      }
      return {
        ok: result.ok,
        message: result.ok ? result.summary : result.error,
        profile: result.profile,
        state: result.state,
      };
    },
    [profile, persistProfile]
  );

  const restorePurchases = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const result = await restorePurchasesBilling();
    if (!result.ok) {
      return { ok: false, message: result.error };
    }

    let current = profile ?? (await loadPlayerProfile());
    const restored = result.restoredTransactions ?? [];

    for (const item of restored) {
      const { profile: next } = grantPurchaseTransaction(
        current,
        {
          transactionId: item.transactionId,
          productId: item.productId,
          platform: 'apple',
          purchasedAt: new Date().toISOString(),
          quantityGranted: 1,
          status: 'restored',
        },
        (p) => grantProductCredits(p, item.productId)
      );
      current = next;
    }

    await persistProfile(current);

    if (!isPlatformBillingLive()) {
      return {
        ok: true,
        message:
          restored.length > 0
            ? `Restored ${restored.length} purchase(s).`
            : 'Platform restore pending — wallet credits preserved.',
      };
    }

    return {
      ok: true,
      message:
        restored.length > 0
          ? `Restored ${restored.length} purchase(s).`
          : 'No previous purchases found on this store account.',
    };
  }, [profile, persistProfile]);

  const resetPlayerProfile = useCallback(async () => {
    await clearPlayerProfile();
    setProfile(createDefaultPlayerProfile());
  }, []);

  const getOwnedForCategory = useCallback(
    (category: ProductCategory) => {
      if (!profile) return 0;
      return getCategoryOwnedBalance(profile, category);
    },
    [profile]
  );

  const getOwnedForProduct = useCallback(
    (productId: ProductId) => {
      if (!profile) return 0;
      return getOwnedBalanceForProduct(profile, productId);
    },
    [profile]
  );

  const value = useMemo((): StoreContextValue => {
    return {
      profile: profile ?? createDefaultPlayerProfile(),
      isStoreReady,
      storePurchaseEnabled: isStorePurchaseEnabled(),
      platformBillingLive: isPlatformBillingLive(),
      devMockEnabled: isDevMockStoreEnabled(),
      billingStatusMessage: getBillingStatusMessage(),
      purchaseStoreProduct,
      useStoreCredit,
      getOwnedForCategory,
      getOwnedForProduct,
      restorePurchases,
      resetPlayerProfile,
      persistProfile,
    };
  }, [
    profile,
    isStoreReady,
    purchaseStoreProduct,
    useStoreCredit,
    getOwnedForCategory,
    getOwnedForProduct,
    restorePurchases,
    resetPlayerProfile,
    persistProfile,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}

export function formatPurchaseHistoryLine(record: PurchaseTransaction): string {
  const date = new Date(record.purchasedAt);
  const label = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${record.productId.replace(/_/g, ' ')} · ${label} · ${record.status}`;
}
