import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AreaId, CommodityId, GameState } from '../types/game';
import {
  borrowMoney,
  buyCommodity,
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
import { purchaseSafehouse as purchaseSafehouseEngine, rentSafehouse as rentSafehouseEngine, setHomeBase as setHomeBaseEngine, depositToSafehouse as depositEngine, withdrawFromSafehouse as withdrawEngine } from './safehouseSystem';
import { purchaseBusiness as purchaseBusinessEngine, repairBusiness as repairBusinessEngine } from './businessSystem';
import { claimMissionReward as claimMissionRewardEngine, claimDailyObjective as claimDailyObjectiveEngine, formatMissionRewardSummary } from './missionSystem';
import { MISSION_MAP } from '../data/missions';
import { RewardClaimFeedback, RewardClaimToast } from '../components/RewardClaimToast';
import { advanceTutorialStep, skipTutorial as skipTutorialEngine } from './tutorialSystem';
import { hireCrewMember, fireCrewMember } from './crewSystem';
import { assignCrewMember } from './crewManagementSystem';
import {
  upgradeBusiness as upgradeBusinessEngine,
  assignBusinessManager as assignBusinessManagerEngine,
  layLowThroughBusiness as layLowThroughBusinessEngine,
} from './businessManagementSystem';
import {
  upgradeProperty as upgradePropertyEngine,
  assignPropertyGuard as assignPropertyGuardEngine,
  layLowAtProperty as layLowAtPropertyEngine,
} from './propertyManagementSystem';
import {
  clearSavedGame,
  loadGameState,
  saveGameState,
} from './saveStorage';
import { normalizeGameState } from './stateUtils';
import { ProductId } from '../types/products';
import { CrewAssignment, BusinessUpgradeKind, PropertyUpgradeKind } from '../types/empire';
import { revealIntelWithToken } from './intelSystem';
import { createDefaultStoreInventory } from '../types/store';
import { useStore } from '../context/StoreContext';
import {
  mergeRunStoreInventoryIntoProfile,
  stripPersistentTokensFromStoreInventory,
} from './profileStorage';
import { getStoreInventory, withStoreInventory } from './storeInventory';
import { useLawyerToken } from './consumableUseSystem';
import { EventPopup, EventPopupPhase } from '../components/events/EventPopup';
import { EventResultSummary } from './eventResultSummary';
import { resolveGameEventChoice } from './eventPopupFlow';
import { GameEvent } from '../types/events';

interface EventPopupSession {
  event: GameEvent;
  phase: EventPopupPhase;
  result?: EventResultSummary;
  /** Applied to game state when the player confirms the result screen. */
  deferredLastMessage?: string;
  deferredMessageLog?: string[];
}

type EventPopupAction =
  | { type: 'open'; event: GameEvent }
  | {
      type: 'resolve';
      event: GameEvent;
      result: EventResultSummary;
      deferredLastMessage: string;
      deferredMessageLog: string[];
    }
  | { type: 'clear' };

function eventPopupReducer(
  state: EventPopupSession | null,
  action: EventPopupAction
): EventPopupSession | null {
  switch (action.type) {
    case 'open':
      return { event: action.event, phase: 'choosing' };
    case 'resolve':
      return {
        event: action.event,
        phase: 'result',
        result: action.result,
        deferredLastMessage: action.deferredLastMessage,
        deferredMessageLog: action.deferredMessageLog,
      };
    case 'clear':
      return null;
    default:
      return state;
  }
}

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
  resetAllData: () => Promise<void>;
  buy: (commodityId: CommodityId, quantity: number) => void;
  sell: (commodityId: CommodityId, quantity: number) => void;
  travelToArea: (areaId: AreaId) => GameState | null;
  travelToCity: (cityId: string, areaId?: AreaId) => GameState | null;
  stay: () => void;
  payOffDebt: (amount: number) => void;
  borrow: (amount: number) => void;
  rest: () => void;
  resolveEventChoice: (choiceId: string) => EventResultSummary | null;
  confirmEventPopup: () => void;
  isEventPopupVisible: boolean;
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
  assignCrew: (crewId: string, assignment: CrewAssignment, targetId?: string) => void;
  purchaseSafehouse: (safehouseId: string) => void;
  rentSafehouse: (safehouseId: string) => void;
  setHomeBase: (safehouseId: string) => void;
  depositToSafehouse: (safehouseId: string, commodityId: CommodityId, quantity: number) => void;
  withdrawFromSafehouse: (safehouseId: string, commodityId: CommodityId, quantity: number) => void;
  purchaseBusiness: (businessId: string) => void;
  repairBusiness: (businessId: string) => void;
  upgradeBusinessAction: (businessId: string, kind: BusinessUpgradeKind) => void;
  assignBusinessManager: (businessId: string, crewId: string | null) => void;
  layLowBusiness: (businessId: string) => void;
  upgradePropertyAction: (safehouseId: string, kind: PropertyUpgradeKind) => void;
  assignPropertyGuard: (safehouseId: string, crewId: string | null) => void;
  layLowProperty: (safehouseId: string) => void;
  claimMissionReward: (missionId: string) => void;
  claimDailyObjective: (objectiveId: string) => void;
  revealIntel: () => void;
  useConsumable: (productId: ProductId) => Promise<{ ok: boolean; message: string }>;
  isClaimingReward: (claimKey: string) => boolean;
  advanceTutorial: () => void;
  skipTutorial: () => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const {
    profile,
    persistProfile,
    useStoreCredit,
    resetPlayerProfile,
    isStoreReady: isProfileReady,
  } = useStore();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<RewardClaimFeedback | null>(null);
  const [activeClaimKey, setActiveClaimKey] = useState<string | null>(null);
  const [eventPopup, dispatchEventPopup] = useReducer(eventPopupReducer, null);
  const claimFeedbackId = useRef(0);
  const eventPopupRef = useRef<EventPopupSession | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  gameStateRef.current = gameState;

  useLayoutEffect(() => {
    eventPopupRef.current = eventPopup;
  }, [eventPopup]);

  const openChoosingPopup = useCallback((event: GameEvent) => {
    if (eventPopupRef.current?.phase === 'result') return;
    if (
      eventPopupRef.current?.phase === 'choosing' &&
      eventPopupRef.current.event.id === event.id
    ) {
      return;
    }
    dispatchEventPopup({ type: 'open', event });
  }, []);

  const showEventResult = useCallback(
    (
      event: GameEvent,
      result: EventResultSummary,
      deferredLastMessage: string,
      deferredMessageLog: string[]
    ) => {
      dispatchEventPopup({
        type: 'resolve',
        event,
        result,
        deferredLastMessage,
        deferredMessageLog,
      });
    },
    []
  );

  const dismissEventPopup = useCallback(() => {
    dispatchEventPopup({ type: 'clear' });
  }, []);

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

  useEffect(() => {
    if (eventPopup?.phase === 'result') return;
    if (gameState?.pendingEvent && !eventPopup) {
      openChoosingPopup(gameState.pendingEvent);
    }
  }, [gameState?.pendingEvent, eventPopup, openChoosingPopup]);

  const persist = useCallback(async (state: GameState) => {
    await saveGameState(state);
    setHasSavedGame(true);
  }, []);

  const confirmEventPopup = useCallback(() => {
    const session = eventPopupRef.current;
    dismissEventPopup();

    if (session?.phase !== 'result' || !session.deferredLastMessage) {
      return;
    }

    setGameState((prev) => {
      if (!prev) return prev;
      const next = normalizeGameState({
        ...prev,
        lastMessage: session.deferredLastMessage!,
        messageLog: session.deferredMessageLog ?? [session.deferredLastMessage!],
      });
      gameStateRef.current = next;
      void persist(next);
      return next;
    });
  }, [dismissEventPopup, persist]);

  const commitUpdate = useCallback(
    (updater: (state: GameState) => GameState): GameState | null => {
      const prev = gameStateRef.current;
      if (!prev) return null;

      const next = applyUpdate(prev, updater);
      if (!next) return null;

      gameStateRef.current = next;
      setGameState(next);
      void persist(next);

      if (next.pendingEvent && eventPopupRef.current?.phase !== 'result') {
        openChoosingPopup(next.pendingEvent);
      }

      return next;
    },
    [openChoosingPopup, persist]
  );

  useEffect(() => {
    if (!isProfileReady) return;
    let mounted = true;

    void (async () => {
      const loaded = await loadGameState();
      if (!mounted) return;

      if (loaded) {
        const storeInv = getStoreInventory(loaded);
        const mergedProfile = mergeRunStoreInventoryIntoProfile(profile, storeInv);
        if (mergedProfile !== profile) {
          await persistProfile(mergedProfile);
        }
        const stripped = stripPersistentTokensFromStoreInventory(storeInv);
        const normalized = normalizeGameState(withStoreInventory(loaded, stripped));
        setGameState(normalized);
        if (stripped !== storeInv) {
          await saveGameState(normalized);
        }
        setHasSavedGame(true);
      }
      setIsStorageReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [isProfileReady]);

  const startNewGame = useCallback(async (): Promise<GameState> => {
    dismissEventPopup();
    let nextProfile = profile;
    if (gameState) {
      nextProfile = mergeRunStoreInventoryIntoProfile(profile, getStoreInventory(gameState));
      await persistProfile(nextProfile);
    }

    const state = normalizeGameState({
      ...createInitialGameState(),
      storeInventory: createDefaultStoreInventory(),
    });
    setGameState(state);
    setHasSavedGame(true);
    await persist(state);
    return state;
  }, [dismissEventPopup, persist, profile, gameState, persistProfile]);

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

  const resetAllData = useCallback(async () => {
    await clearSavedGame();
    await resetPlayerProfile();
    setGameState(null);
    setHasSavedGame(false);
  }, [resetPlayerProfile]);

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
      if (eventPopupRef.current) return null;
      return commitUpdate((s) => travelToArea(s, areaId));
    },
    [commitUpdate]
  );

  const travelCity = useCallback(
    (cityId: string, areaId?: AreaId) => {
      if (eventPopupRef.current) return null;
      return commitUpdate((s) => travelToCity(s, cityId, areaId));
    },
    [commitUpdate]
  );

  const stay = useCallback(() => {
    if (eventPopupRef.current) return;
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
    if (eventPopupRef.current) return;
    commitUpdate((s) => restDay(s));
  }, [commitUpdate]);

  const resolveEventChoice = useCallback(
    (choiceId: string): EventResultSummary | null => {
      const popup = eventPopupRef.current;
      if (popup?.phase === 'result') {
        return popup.result ?? null;
      }

      const prev = gameStateRef.current;
      if (!prev) return null;

      const activeEvent =
        prev.pendingEvent ?? (popup?.phase === 'choosing' ? popup.event : null);
      if (!activeEvent) return null;

      const resolved = resolveGameEventChoice(prev, activeEvent, choiceId, {
        deferMessages: true,
      });
      if ('locked' in resolved) return null;

      const { after, result, deferredLastMessage, deferredMessageLog } = resolved;
      showEventResult(
        activeEvent,
        result,
        deferredLastMessage ?? result.message,
        deferredMessageLog ?? [result.message]
      );
      gameStateRef.current = after;
      setGameState(after);
      void persist(after);
      return result;
    },
    [persist, showEventResult]
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
    if (profile.consumables.emergencyLawyerTokens > 0 && gameState) {
      const result = useLawyerToken(profile, gameState);
      if (result.ok) {
        void persistProfile(result.profile);
        const next = normalizeGameState(result.state);
        setGameState(next);
        void persist(next);
        return;
      }
    }
    commitUpdate((s) => hireLawyerHeat(s));
  }, [commitUpdate, profile, gameState, persistProfile, persist]);

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

  const assignCrew = useCallback(
    (crewId: string, assignment: CrewAssignment, targetId?: string) => {
      commitUpdate((s) => assignCrewMember(s, crewId, assignment, targetId));
    },
    [commitUpdate]
  );

  const purchaseSafehouse = useCallback(
    (safehouseId: string) => {
      commitUpdate((s) => purchaseSafehouseEngine(s, safehouseId));
    },
    [commitUpdate]
  );

  const rentSafehouse = useCallback(
    (safehouseId: string) => {
      commitUpdate((s) => rentSafehouseEngine(s, safehouseId));
    },
    [commitUpdate]
  );

  const setHomeBase = useCallback(
    (safehouseId: string) => {
      commitUpdate((s) => setHomeBaseEngine(s, safehouseId));
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

  const upgradeBusinessAction = useCallback(
    (businessId: string, kind: BusinessUpgradeKind) => {
      commitUpdate((s) => upgradeBusinessEngine(s, businessId, kind));
    },
    [commitUpdate]
  );

  const assignBusinessManager = useCallback(
    (businessId: string, crewId: string | null) => {
      commitUpdate((s) => assignBusinessManagerEngine(s, businessId, crewId));
    },
    [commitUpdate]
  );

  const layLowBusiness = useCallback(
    (businessId: string) => {
      commitUpdate((s) => layLowThroughBusinessEngine(s, businessId));
    },
    [commitUpdate]
  );

  const upgradePropertyAction = useCallback(
    (safehouseId: string, kind: PropertyUpgradeKind) => {
      commitUpdate((s) => upgradePropertyEngine(s, safehouseId, kind));
    },
    [commitUpdate]
  );

  const assignPropertyGuard = useCallback(
    (safehouseId: string, crewId: string | null) => {
      commitUpdate((s) => assignPropertyGuardEngine(s, safehouseId, crewId));
    },
    [commitUpdate]
  );

  const layLowProperty = useCallback(
    (safehouseId: string) => {
      commitUpdate((s) => layLowAtPropertyEngine(s, safehouseId));
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

  const revealIntel = useCallback(() => {
    setGameState((prev) => {
      if (!prev) return prev;
      const { state, profile: nextProfile } = revealIntelWithToken(prev, profile);
      void persistProfile(nextProfile);
      void persist(state);
      return normalizeGameState(state);
    });
  }, [profile, persistProfile, persist]);

  const useConsumable = useCallback(
    async (productId: ProductId): Promise<{ ok: boolean; message: string }> => {
      if (!gameState) {
        return { ok: false, message: 'Start or continue a game to use consumables.' };
      }
      const result = useStoreCredit(productId, gameState);
      if (result.ok) {
        const next = normalizeGameState(result.state);
        setGameState(next);
        await persist(next);
      }
      return { ok: result.ok, message: result.message };
    },
    [gameState, useStoreCredit, persist]
  );

  const isClaimingReward = useCallback(
    (claimKey: string) => activeClaimKey === claimKey,
    [activeClaimKey]
  );

  const advanceTutorial = useCallback(() => {
    commitUpdate((s) => advanceTutorialStep(s));
  }, [commitUpdate]);

  const skipTutorial = useCallback(() => {
    commitUpdate((s) => skipTutorialEngine(s));
  }, [commitUpdate]);

  const endGame = useCallback(() => {
    dismissEventPopup();
    setGameState(null);
  }, [dismissEventPopup]);

  const value = useMemo(
    () => ({
      gameState,
      hasActiveGame: gameState !== null,
      hasSavedGame,
      isStorageReady,
      startNewGame,
      continueGame,
      resetSave,
      resetAllData,
      buy,
      sell,
      travelToArea: travelArea,
      travelToCity: travelCity,
      stay,
      payOffDebt,
      borrow,
      rest,
      resolveEventChoice,
      confirmEventPopup,
      isEventPopupVisible: eventPopup != null,
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
      assignCrew,
      purchaseSafehouse,
      rentSafehouse,
      setHomeBase,
      depositToSafehouse,
      withdrawFromSafehouse,
      purchaseBusiness,
      repairBusiness,
      upgradeBusinessAction,
      assignBusinessManager,
      layLowBusiness,
      upgradePropertyAction,
      assignPropertyGuard,
      layLowProperty,
      claimMissionReward,
      claimDailyObjective,
      revealIntel,
      useConsumable,
      isClaimingReward,
      advanceTutorial,
      skipTutorial,
      endGame,
    }),
    [
      gameState,
      eventPopup,
      hasSavedGame,
      isStorageReady,
      startNewGame,
      continueGame,
      resetSave,
      resetAllData,
      buy,
      sell,
      travelArea,
      travelCity,
      stay,
      payOffDebt,
      borrow,
      rest,
      resolveEventChoice,
      confirmEventPopup,
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
      assignCrew,
      purchaseSafehouse,
      rentSafehouse,
      setHomeBase,
      depositToSafehouse,
      withdrawFromSafehouse,
      purchaseBusiness,
      repairBusiness,
      upgradeBusinessAction,
      assignBusinessManager,
      layLowBusiness,
      upgradePropertyAction,
      assignPropertyGuard,
      layLowProperty,
      claimMissionReward,
      claimDailyObjective,
      revealIntel,
      useConsumable,
      isClaimingReward,
      advanceTutorial,
      skipTutorial,
      endGame,
    ]
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <EventPopup
        visible={eventPopup != null}
        phase={eventPopup?.phase ?? 'choosing'}
        event={eventPopup?.event ?? gameState?.pendingEvent ?? null}
        gameState={gameState}
        resolvedResult={eventPopup?.result ?? null}
        onChoose={resolveEventChoice}
        onConfirm={confirmEventPopup}
      />
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
