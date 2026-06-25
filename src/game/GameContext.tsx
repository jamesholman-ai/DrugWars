import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AreaId, CommodityId, GameState } from '../types/game';
import {
  borrowMoney,
  buyCommodity,
  chooseEventOption,
  createInitialGameState,
  payDebt,
  restDay,
  sellCommodity,
  stayHere,
  travelToArea,
  travelToCity,
} from './engine';
import {
  purchaseInventoryUpgrade as buyInventoryUpgrade,
  purchaseStashHouse as buyStashHouse,
} from './progression';
import { purchaseEquipment as buyEquipment } from './equipmentShop';
import {
  layLow,
  bribeLocalPolice,
  hireLawyerHeat,
  useSafehouse,
  destroyEvidence,
  payInformant,
  useBurnerPhone,
} from './heatManagement';
import { buyFromSupplier as buyFromSupplierEngine } from './supplierSystem';
import { acceptContract as acceptContractEngine, fulfillContract as fulfillContractEngine } from './contractSystem';
import { purchaseSafehouse as purchaseSafehouseEngine, depositToSafehouse as depositEngine, withdrawFromSafehouse as withdrawEngine } from './safehouseSystem';
import { purchaseBusiness as purchaseBusinessEngine, repairBusiness as repairBusinessEngine } from './businessSystem';
import { claimMissionReward as claimMissionRewardEngine, claimDailyObjective as claimDailyObjectiveEngine, formatMissionRewardSummary } from './missionSystem';
import { MISSION_MAP } from '../data/missions';
import { RewardClaimFeedback, RewardClaimToast } from '../components/RewardClaimToast';
import { advanceTutorialStep, skipTutorial as skipTutorialEngine } from './tutorialSystem';
import { hireCrewMember, fireCrewMember } from './crewSystem';
import {
  clearSavedGame,
  loadGameState,
  saveGameState,
} from './saveStorage';
import { normalizeGameState } from './stateUtils';
import { ProductId } from '../types/products';
import {
  loadEntitlementState,
  recordPurchase,
  saveEntitlementState,
} from './entitlements';
import {
  purchaseProduct as purchaseProductBilling,
  isStorePurchaseEnabled,
} from '../services/platformBilling';
import {
  applyStorePurchase,
  validateStorePurchase,
} from './storePurchaseSystem';
import { createDefaultStoreInventory } from '../types/store';

function applyUpdate(
  prev: GameState | null,
  updater: (state: GameState) => GameState
): GameState | null {
  if (!prev) return null;
  return normalizeGameState(updater(normalizeGameState(prev)));
}

interface GameContextValue {
  gameState: GameState | null;
  hasActiveGame: boolean;
  hasSavedGame: boolean;
  isStorageReady: boolean;
  startNewGame: () => Promise<GameState>;
  continueGame: () => Promise<boolean>;
  resetSave: () => Promise<void>;
  buy: (commodityId: CommodityId, quantity: number) => void;
  sell: (commodityId: CommodityId, quantity: number) => void;
  travelToArea: (areaId: AreaId) => void;
  travelToCity: (cityId: string, areaId?: AreaId) => void;
  stay: () => void;
  payOffDebt: (amount: number) => void;
  borrow: (amount: number) => void;
  rest: () => void;
  resolveEventChoice: (choiceId: string) => void;
  purchaseInventoryUpgrade: () => void;
  purchaseStashHouse: (stashId: string) => void;
  purchaseEquipment: (equipmentId: string) => void;
  layLow: () => void;
  bribePolice: () => void;
  hireLawyer: () => void;
  useSafehouse: () => void;
  destroyEvidence: () => void;
  payInformant: () => void;
  useBurnerPhone: () => void;
  buyFromSupplier: (supplierId: string, commodityId: CommodityId, quantity: number) => void;
  acceptContract: (contractId: string) => void;
  fulfillContract: (contractId: string) => void;
  hireCrew: (recruitId: string) => void;
  fireCrew: (crewId: string) => void;
  purchaseSafehouse: (safehouseId: string) => void;
  depositToSafehouse: (safehouseId: string, commodityId: CommodityId, quantity: number) => void;
  withdrawFromSafehouse: (safehouseId: string, commodityId: CommodityId, quantity: number) => void;
  purchaseBusiness: (businessId: string) => void;
  repairBusiness: (businessId: string) => void;
  claimMissionReward: (missionId: string) => void;
  claimDailyObjective: (objectiveId: string) => void;
  isClaimingReward: (claimKey: string) => boolean;
  purchaseStoreProduct: (productId: ProductId) => Promise<{ ok: boolean; message: string }>;
  advanceTutorial: () => void;
  skipTutorial: () => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<RewardClaimFeedback | null>(null);
  const [activeClaimKey, setActiveClaimKey] = useState<string | null>(null);
  const claimFeedbackId = useRef(0);

  const showClaimFeedback = useCallback(
    (variant: RewardClaimFeedback['variant'], title: string, detail?: string) => {
      claimFeedbackId.current += 1;
      setClaimFeedback({
        id: claimFeedbackId.current,
        variant,
        title,
        detail,
      });
    },
    []
  );

  const dismissClaimFeedback = useCallback(() => {
    setClaimFeedback(null);
  }, []);

  const persist = useCallback(async (state: GameState) => {
    await saveGameState(state);
    setHasSavedGame(true);
  }, []);

  const commitUpdate = useCallback(
    (updater: (state: GameState) => GameState) => {
      setGameState((prev) => {
        const next = applyUpdate(prev, updater);
        if (next) {
          void persist(next);
        }
        return next;
      });
    },
    [persist]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      const loaded = await loadGameState();
      if (!mounted) return;

      if (loaded) {
        setGameState(loaded);
        setHasSavedGame(true);
      }
      setIsStorageReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const startNewGame = useCallback(async (): Promise<GameState> => {
    const state = normalizeGameState({
      ...createInitialGameState(),
      storeInventory: createDefaultStoreInventory(),
    });
    setGameState(state);
    setHasSavedGame(true);
    await persist(state);
    return state;
  }, [persist]);

  const continueGame = useCallback(async (): Promise<boolean> => {
    if (gameState) {
      return true;
    }
    const loaded = await loadGameState();
    if (!loaded) {
      setHasSavedGame(false);
      return false;
    }
    setGameState(loaded);
    setHasSavedGame(true);
    return true;
  }, [gameState]);

  const resetSave = useCallback(async () => {
    await clearSavedGame();
    setGameState(null);
    setHasSavedGame(false);
  }, []);

  const buy = useCallback(
    (commodityId: CommodityId, quantity: number) => {
      commitUpdate((s) => buyCommodity(s, commodityId, quantity));
    },
    [commitUpdate]
  );

  const sell = useCallback(
    (commodityId: CommodityId, quantity: number) => {
      commitUpdate((s) => sellCommodity(s, commodityId, quantity));
    },
    [commitUpdate]
  );

  const travelArea = useCallback(
    (areaId: AreaId) => {
      commitUpdate((s) => travelToArea(s, areaId));
    },
    [commitUpdate]
  );

  const travelCity = useCallback(
    (cityId: string, areaId?: AreaId) => {
      commitUpdate((s) => travelToCity(s, cityId, areaId));
    },
    [commitUpdate]
  );

  const stay = useCallback(() => {
    commitUpdate((s) => stayHere(s));
  }, [commitUpdate]);

  const payOffDebt = useCallback(
    (amount: number) => {
      commitUpdate((s) => payDebt(s, amount));
    },
    [commitUpdate]
  );

  const borrow = useCallback(
    (amount: number) => {
      commitUpdate((s) => borrowMoney(s, amount));
    },
    [commitUpdate]
  );

  const rest = useCallback(() => {
    commitUpdate((s) => restDay(s));
  }, [commitUpdate]);

  const resolveEventChoice = useCallback(
    (choiceId: string) => {
      commitUpdate((s) => chooseEventOption(s, choiceId));
    },
    [commitUpdate]
  );

  const purchaseInventoryUpgrade = useCallback(() => {
    commitUpdate((s) => buyInventoryUpgrade(s));
  }, [commitUpdate]);

  const purchaseStashHouse = useCallback(
    (stashId: string) => {
      commitUpdate((s) => buyStashHouse(s, stashId));
    },
    [commitUpdate]
  );

  const purchaseEquipment = useCallback(
    (equipmentId: string) => {
      commitUpdate((s) => buyEquipment(s, equipmentId));
    },
    [commitUpdate]
  );

  const layLowAction = useCallback(() => {
    commitUpdate((s) => layLow(s));
  }, [commitUpdate]);

  const bribePolice = useCallback(() => {
    commitUpdate((s) => bribeLocalPolice(s));
  }, [commitUpdate]);

  const hireLawyer = useCallback(() => {
    commitUpdate((s) => hireLawyerHeat(s));
  }, [commitUpdate]);

  const useSafehouseAction = useCallback(() => {
    commitUpdate((s) => useSafehouse(s));
  }, [commitUpdate]);

  const destroyEvidenceAction = useCallback(() => {
    commitUpdate((s) => destroyEvidence(s));
  }, [commitUpdate]);

  const payInformantAction = useCallback(() => {
    commitUpdate((s) => payInformant(s));
  }, [commitUpdate]);

  const useBurnerPhoneAction = useCallback(() => {
    commitUpdate((s) => useBurnerPhone(s));
  }, [commitUpdate]);

  const buyFromSupplier = useCallback(
    (supplierId: string, commodityId: CommodityId, quantity: number) => {
      commitUpdate((s) => buyFromSupplierEngine(s, supplierId, commodityId, quantity));
    },
    [commitUpdate]
  );

  const acceptContract = useCallback(
    (contractId: string) => {
      commitUpdate((s) => acceptContractEngine(s, contractId));
    },
    [commitUpdate]
  );

  const fulfillContract = useCallback(
    (contractId: string) => {
      commitUpdate((s) => fulfillContractEngine(s, contractId));
    },
    [commitUpdate]
  );

  const hireCrew = useCallback(
    (recruitId: string) => {
      commitUpdate((s) => hireCrewMember(s, recruitId));
    },
    [commitUpdate]
  );

  const fireCrew = useCallback(
    (crewId: string) => {
      commitUpdate((s) => fireCrewMember(s, crewId));
    },
    [commitUpdate]
  );

  const purchaseSafehouse = useCallback(
    (safehouseId: string) => {
      commitUpdate((s) => purchaseSafehouseEngine(s, safehouseId));
    },
    [commitUpdate]
  );

  const depositToSafehouse = useCallback(
    (safehouseId: string, commodityId: CommodityId, quantity: number) => {
      commitUpdate((s) => depositEngine(s, safehouseId, commodityId, quantity));
    },
    [commitUpdate]
  );

  const withdrawFromSafehouse = useCallback(
    (safehouseId: string, commodityId: CommodityId, quantity: number) => {
      commitUpdate((s) => withdrawEngine(s, safehouseId, commodityId, quantity));
    },
    [commitUpdate]
  );

  const purchaseBusiness = useCallback(
    (businessId: string) => {
      commitUpdate((s) => purchaseBusinessEngine(s, businessId));
    },
    [commitUpdate]
  );

  const repairBusiness = useCallback(
    (businessId: string) => {
      commitUpdate((s) => repairBusinessEngine(s, businessId));
    },
    [commitUpdate]
  );

  const claimMissionReward = useCallback(
    (missionId: string) => {
      const claimKey = `mission:${missionId}`;
      if (activeClaimKey) return;

      setActiveClaimKey(claimKey);
      setGameState((prev) => {
        if (!prev) {
          setActiveClaimKey(null);
          return prev;
        }

        const before = normalizeGameState(prev);
        const pending = before.completedMissions?.find((m) => m.id === missionId);
        if (pending?.claimed) {
          showClaimFeedback('error', 'Claim failed', 'Reward already claimed.');
          setActiveClaimKey(null);
          return prev;
        }

        const def = MISSION_MAP[missionId];
        const next = normalizeGameState(claimMissionRewardEngine(before, missionId));
        const claimed = next.completedMissions?.find((m) => m.id === missionId)?.claimed === true;

        if (pending && !pending.claimed && claimed && def) {
          showClaimFeedback('success', 'Reward claimed', formatMissionRewardSummary(def.rewards));
        } else if (next.lastMessage !== before.lastMessage) {
          showClaimFeedback('error', 'Claim failed', next.lastMessage);
        }

        void persist(next);
        setActiveClaimKey(null);
        return next;
      });
    },
    [activeClaimKey, persist, showClaimFeedback]
  );

  const claimDailyObjective = useCallback(
    (objectiveId: string) => {
      const claimKey = `daily:${objectiveId}`;
      if (activeClaimKey) return;

      setActiveClaimKey(claimKey);
      setGameState((prev) => {
        if (!prev) {
          setActiveClaimKey(null);
          return prev;
        }

        const before = normalizeGameState(prev);
        const pending = before.dailyObjectives?.find((o) => o.id === objectiveId);
        if (pending?.claimed) {
          showClaimFeedback('error', 'Claim failed', 'Reward already claimed.');
          setActiveClaimKey(null);
          return prev;
        }

        const next = normalizeGameState(claimDailyObjectiveEngine(before, objectiveId));
        const claimed =
          next.dailyObjectives?.find((o) => o.id === objectiveId)?.claimed === true;

        if (
          pending &&
          !pending.claimed &&
          pending.progress >= pending.target &&
          claimed
        ) {
          showClaimFeedback(
            'success',
            'Reward claimed',
            formatMissionRewardSummary(pending.rewards)
          );
        } else if (next.lastMessage !== before.lastMessage) {
          showClaimFeedback('error', 'Claim failed', next.lastMessage);
        }

        void persist(next);
        setActiveClaimKey(null);
        return next;
      });
    },
    [activeClaimKey, persist, showClaimFeedback]
  );

  const isClaimingReward = useCallback(
    (claimKey: string) => activeClaimKey === claimKey,
    [activeClaimKey]
  );

  const purchaseStoreProduct = useCallback(
    async (productId: ProductId): Promise<{ ok: boolean; message: string }> => {
      if (!isStorePurchaseEnabled()) {
        return {
          ok: false,
          message: 'Store purchases are not enabled yet.',
        };
      }

      if (!gameState) {
        return {
          ok: false,
          message: 'Start or continue a game before purchasing consumables.',
        };
      }

      const validation = validateStorePurchase(gameState, productId);
      if (!validation.ok) {
        return { ok: false, message: validation.error };
      }

      const billing = await purchaseProductBilling(productId);
      if (!billing.ok) {
        return { ok: false, message: billing.error };
      }

      const applied = applyStorePurchase(gameState, productId);
      if (!applied.ok) {
        return { ok: false, message: applied.error };
      }

      const next = normalizeGameState(applied.state);
      setGameState(next);
      await persist(next);

      const entitlements = await loadEntitlementState();
      await saveEntitlementState(
        recordPurchase(entitlements, {
          productId,
          purchasedAt: new Date().toISOString(),
          source: 'purchase',
        })
      );

      return { ok: true, message: applied.summary };
    },
    [gameState, persist]
  );

  const advanceTutorial = useCallback(() => {
    commitUpdate((s) => advanceTutorialStep(s));
  }, [commitUpdate]);

  const skipTutorial = useCallback(() => {
    commitUpdate((s) => skipTutorialEngine(s));
  }, [commitUpdate]);

  const endGame = useCallback(() => {
    setGameState(null);
  }, []);

  const value = useMemo(
    () => ({
      gameState,
      hasActiveGame: gameState !== null,
      hasSavedGame,
      isStorageReady,
      startNewGame,
      continueGame,
      resetSave,
      buy,
      sell,
      travelToArea: travelArea,
      travelToCity: travelCity,
      stay,
      payOffDebt,
      borrow,
      rest,
      resolveEventChoice,
      purchaseInventoryUpgrade,
      purchaseStashHouse,
      purchaseEquipment,
      layLow: layLowAction,
      bribePolice,
      hireLawyer,
      useSafehouse: useSafehouseAction,
      destroyEvidence: destroyEvidenceAction,
      payInformant: payInformantAction,
      useBurnerPhone: useBurnerPhoneAction,
      buyFromSupplier,
      acceptContract,
      fulfillContract,
      hireCrew,
      fireCrew,
      purchaseSafehouse,
      depositToSafehouse,
      withdrawFromSafehouse,
      purchaseBusiness,
      repairBusiness,
      claimMissionReward,
      claimDailyObjective,
      isClaimingReward,
      purchaseStoreProduct,
      advanceTutorial,
      skipTutorial,
      endGame,
    }),
    [
      gameState,
      hasSavedGame,
      isStorageReady,
      startNewGame,
      continueGame,
      resetSave,
      buy,
      sell,
      travelArea,
      travelCity,
      stay,
      payOffDebt,
      borrow,
      rest,
      resolveEventChoice,
      purchaseInventoryUpgrade,
      purchaseStashHouse,
      purchaseEquipment,
      layLowAction,
      bribePolice,
      hireLawyer,
      useSafehouseAction,
      destroyEvidenceAction,
      payInformantAction,
      useBurnerPhoneAction,
      buyFromSupplier,
      acceptContract,
      fulfillContract,
      hireCrew,
      fireCrew,
      purchaseSafehouse,
      depositToSafehouse,
      withdrawFromSafehouse,
      purchaseBusiness,
      repairBusiness,
      claimMissionReward,
      claimDailyObjective,
      isClaimingReward,
      purchaseStoreProduct,
      advanceTutorial,
      skipTutorial,
      endGame,
    ]
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <RewardClaimToast feedback={claimFeedback} onDismiss={dismissClaimFeedback} />
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}
