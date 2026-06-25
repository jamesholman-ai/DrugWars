import {
  GameState,
  createDefaultHeatCooldowns,
  createDefaultPlayerLegalFields,
  createEmptyMemoryFlags,
} from '../types/game';
import { OwnedEquipment } from '../types/equipment';
import { EncounterHistoryEntry, HeatCooldowns, LegalStatus } from '../types/encounters';
import { createInitialProgression, syncProgression } from './progression';
import {
  createDefaultAreaOwnership,
  createDefaultLocalHeat,
  migrateLocalHeatByCity,
} from './territory';
import { normalizeMoneyFields } from './money';
import { createDefaultBusinessState } from './businessSystem';
import { createDefaultMissionState } from './missionSystem';
import { createDefaultTutorial } from './tutorialSystem';
import { migrateStoreInventory } from './storeInventory';

/** Ensures optional runtime fields exist (guards partial/legacy state). */
export function normalizeGameState(state: GameState): GameState {
  const legalDefaults = createDefaultPlayerLegalFields();
  const heatDefaults = createDefaultHeatCooldowns();
  const businessDefaults = createDefaultBusinessState();
  const missionDefaults = createDefaultMissionState();

  const withDefaults: GameState = {
    ...state,
    memoryFlags: { ...createEmptyMemoryFlags(), ...(state.memoryFlags ?? {}) },
    npcRelations: state.npcRelations ?? {},
    activeWorldEvents: state.activeWorldEvents ?? [],
    progression: state.progression ?? createInitialProgression(),
    messageLog: Array.isArray(state.messageLog) ? [...state.messageLog] : [],
    lastMessage: state.lastMessage ?? '',
    pendingEvent: state.pendingEvent ?? null,
    marketPrices: state.marketPrices ?? {},
    priceHistory: state.priceHistory ?? {},
    equipment: Array.isArray(state.equipment) ? [...state.equipment] : [],
    cartelStanding: state.cartelStanding ?? 0,
    cartelBetrayals: state.cartelBetrayals ?? 0,
    localHeatByCity:
      state.localHeatByCity && Object.keys(state.localHeatByCity).length > 0
        ? state.localHeatByCity
        : migrateLocalHeatByCity(undefined, state.player?.heat ?? 0),
    areaOwnership: state.areaOwnership ?? createDefaultAreaOwnership(),
    supplierRelationships: state.supplierRelationships ?? {},
    supplierOffers: state.supplierOffers ?? [],
    contractOffers: state.contractOffers ?? [],
    activeContracts: state.activeContracts ?? [],
    completedContracts: state.completedContracts ?? [],
    availableCrew: state.availableCrew ?? [],
    hiredCrew: state.hiredCrew ?? [],
    crewHistory: state.crewHistory ?? [],
    ownedSafehouses: state.ownedSafehouses ?? [],
    storedInventoryBySafehouse: state.storedInventoryBySafehouse ?? {},
    ownedBusinesses: state.ownedBusinesses ?? businessDefaults.ownedBusinesses,
    businessHistory: state.businessHistory ?? businessDefaults.businessHistory,
    businessRaids: state.businessRaids ?? businessDefaults.businessRaids,
    lastDaySummary: state.lastDaySummary ?? businessDefaults.lastDaySummary,
    missions: state.missions ?? missionDefaults.missions,
    activeMissions: state.activeMissions ?? missionDefaults.activeMissions,
    completedMissions: state.completedMissions ?? missionDefaults.completedMissions,
    failedMissions: state.failedMissions ?? missionDefaults.failedMissions,
    dailyObjectives: state.dailyObjectives ?? missionDefaults.dailyObjectives,
    currentStoryArc: state.currentStoryArc ?? missionDefaults.currentStoryArc,
    missionProgress: state.missionProgress ?? missionDefaults.missionProgress,
    activePriceTips: state.activePriceTips ?? missionDefaults.activePriceTips,
    tutorial: state.tutorial ?? createDefaultTutorial(true),
    failedContracts: state.failedContracts ?? [],
    heatCooldowns: { ...heatDefaults, ...(state.heatCooldowns ?? {}) },
    encounterHistory: Array.isArray(state.encounterHistory)
      ? [...state.encounterHistory]
      : [],
    storeInventory: migrateStoreInventory(state.storeInventory),
    player: normalizeMoneyFields({
      ...legalDefaults,
      ...state.player,
      inventory: Array.isArray(state.player.inventory)
        ? state.player.inventory.map((item) => ({ ...item }))
        : [],
      legalStatus: (state.player.legalStatus ?? legalDefaults.legalStatus) as LegalStatus,
      federalCaseSeverity:
        state.player.federalCaseSeverity ?? legalDefaults.federalCaseSeverity,
      daysInJail: state.player.daysInJail ?? legalDefaults.daysInJail,
      debtCollectorWarnings:
        state.player.debtCollectorWarnings ?? legalDefaults.debtCollectorWarnings,
    }),
  };

  return syncProgression(withDefaults);
}

export function migrateExtendedState(raw: Record<string, unknown>): {
  equipment: OwnedEquipment[];
  cartelStanding: number;
  cartelBetrayals: number;
  localHeatByCity: Record<string, number>;
  heatCooldowns: HeatCooldowns;
  encounterHistory: EncounterHistoryEntry[];
} {
  const defaults = createDefaultHeatCooldowns();

  const equipment: OwnedEquipment[] = Array.isArray(raw.equipment)
    ? raw.equipment
        .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
        .map((e) => ({
          equipmentId: typeof e.equipmentId === 'string' ? e.equipmentId : '',
          usesRemaining:
            typeof e.usesRemaining === 'number' ? e.usesRemaining : undefined,
        }))
        .filter((e) => e.equipmentId.length > 0)
    : [];

  const localHeatByCity: Record<string, number> = {};
  if (typeof raw.localHeatByCity === 'object' && raw.localHeatByCity !== null) {
    for (const [k, v] of Object.entries(raw.localHeatByCity as Record<string, unknown>)) {
      if (typeof v === 'number') localHeatByCity[k] = v;
    }
  }

  const heatCooldowns: HeatCooldowns = { ...defaults };
  if (typeof raw.heatCooldowns === 'object' && raw.heatCooldowns !== null) {
    const hc = raw.heatCooldowns as Record<string, unknown>;
    heatCooldowns.layLowUntilDay =
      typeof hc.layLowUntilDay === 'number' ? hc.layLowUntilDay : 0;
    heatCooldowns.bribePoliceUntilDay =
      typeof hc.bribePoliceUntilDay === 'number' ? hc.bribePoliceUntilDay : 0;
    heatCooldowns.informantProtectionUntilDay =
      typeof hc.informantProtectionUntilDay === 'number'
        ? hc.informantProtectionUntilDay
        : 0;
    heatCooldowns.safehouseUsedUntilDay =
      typeof hc.safehouseUsedUntilDay === 'number' ? hc.safehouseUsedUntilDay : 0;
  }

  const encounterHistory: EncounterHistoryEntry[] = Array.isArray(raw.encounterHistory)
    ? raw.encounterHistory
        .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
        .map((e) => ({
          encounterId: typeof e.encounterId === 'string' ? e.encounterId : 'unknown',
          day: typeof e.day === 'number' ? e.day : 1,
          outcome: typeof e.outcome === 'string' ? e.outcome : '',
        }))
        .slice(-20)
    : [];

  return {
    equipment,
    cartelStanding: typeof raw.cartelStanding === 'number' ? raw.cartelStanding : 0,
    cartelBetrayals: typeof raw.cartelBetrayals === 'number' ? raw.cartelBetrayals : 0,
    localHeatByCity,
    heatCooldowns,
    encounterHistory,
  };
}
