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
  loadEntitlementState,
  markRestoreComplete,
  saveEntitlementState,
} from '../game/entitlements';
import {
  getBillingStatusMessage,
  isPlatformBillingLive,
  isStorePurchaseEnabled,
  restorePurchases as restorePurchasesBilling,
} from '../services/platformBilling';
import { EntitlementState, PurchaseRecord } from '../types/products';

interface StoreContextValue {
  entitlements: EntitlementState;
  isStoreReady: boolean;
  storePurchaseEnabled: boolean;
  platformBillingLive: boolean;
  billingStatusMessage: string;
  restorePurchases: () => Promise<{ ok: boolean; message: string }>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entitlements, setEntitlements] = useState<EntitlementState | null>(null);
  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const loaded = await loadEntitlementState();
      if (!mounted) return;
      setEntitlements(loaded);
      setIsStoreReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const restorePurchases = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const result = await restorePurchasesBilling();
    if (!result.ok) {
      return { ok: false, message: result.error };
    }

    const base = entitlements ?? (await loadEntitlementState());
    const next = markRestoreComplete(base);
    await saveEntitlementState(next);
    setEntitlements(next);

    const restoredCount =
      'restoredIds' in result && result.restoredIds ? result.restoredIds.length : 0;

    if (!isPlatformBillingLive()) {
      return {
        ok: true,
        message:
          restoredCount > 0
            ? `Restored ${restoredCount} purchase(s) locally.`
            : 'Platform restore pending — local purchase history preserved.',
      };
    }

    return {
      ok: true,
      message:
        restoredCount > 0
          ? `Restored ${restoredCount} purchase(s).`
          : 'No previous purchases found on this store account.',
    };
  }, [entitlements]);

  const value = useMemo((): StoreContextValue => {
    return {
      entitlements: entitlements ?? { purchaseHistory: [], lastRestoreAt: null },
      isStoreReady,
      storePurchaseEnabled: isStorePurchaseEnabled(),
      platformBillingLive: isPlatformBillingLive(),
      billingStatusMessage: getBillingStatusMessage(),
      restorePurchases,
    };
  }, [entitlements, isStoreReady, restorePurchases]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}

export function formatPurchaseHistoryLine(record: PurchaseRecord): string {
  const date = new Date(record.purchasedAt);
  const label = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${record.productId.replace(/_/g, ' ')} · ${label} · ${record.source}`;
}
