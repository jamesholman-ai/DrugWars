"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGameState = normalizeGameState;
exports.migrateExtendedState = migrateExtendedState;
const game_1 = require("../types/game");
const progression_1 = require("./progression");
const territory_1 = require("./territory");
const money_1 = require("./money");
const businessSystem_1 = require("./businessSystem");
const missionSystem_1 = require("./missionSystem");
const tutorialSystem_1 = require("./tutorialSystem");
/** Ensures optional runtime fields exist (guards partial/legacy state). */
function normalizeGameState(state) {
    const legalDefaults = (0, game_1.createDefaultPlayerLegalFields)();
    const heatDefaults = (0, game_1.createDefaultHeatCooldowns)();
    const businessDefaults = (0, businessSystem_1.createDefaultBusinessState)();
    const missionDefaults = (0, missionSystem_1.createDefaultMissionState)();
    const withDefaults = {
        ...state,
        memoryFlags: { ...(0, game_1.createEmptyMemoryFlags)(), ...(state.memoryFlags ?? {}) },
        npcRelations: state.npcRelations ?? {},
        activeWorldEvents: state.activeWorldEvents ?? [],
        progression: state.progression ?? (0, progression_1.createInitialProgression)(),
        messageLog: Array.isArray(state.messageLog) ? [...state.messageLog] : [],
        lastMessage: state.lastMessage ?? '',
        pendingEvent: state.pendingEvent ?? null,
        marketPrices: state.marketPrices ?? {},
        priceHistory: state.priceHistory ?? {},
        equipment: Array.isArray(state.equipment) ? [...state.equipment] : [],
        cartelStanding: state.cartelStanding ?? 0,
        cartelBetrayals: state.cartelBetrayals ?? 0,
        localHeatByCity: state.localHeatByCity && Object.keys(state.localHeatByCity).length > 0
            ? state.localHeatByCity
            : (0, territory_1.migrateLocalHeatByCity)(undefined, state.player?.heat ?? 0),
        areaOwnership: state.areaOwnership ?? (0, territory_1.createDefaultAreaOwnership)(),
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
        tutorial: state.tutorial ?? (0, tutorialSystem_1.createDefaultTutorial)(true),
        failedContracts: state.failedContracts ?? [],
        heatCooldowns: { ...heatDefaults, ...(state.heatCooldowns ?? {}) },
        encounterHistory: Array.isArray(state.encounterHistory)
            ? [...state.encounterHistory]
            : [],
        player: (0, money_1.normalizeMoneyFields)({
            ...legalDefaults,
            ...state.player,
            inventory: Array.isArray(state.player.inventory)
                ? state.player.inventory.map((item) => ({ ...item }))
                : [],
            legalStatus: (state.player.legalStatus ?? legalDefaults.legalStatus),
            federalCaseSeverity: state.player.federalCaseSeverity ?? legalDefaults.federalCaseSeverity,
            daysInJail: state.player.daysInJail ?? legalDefaults.daysInJail,
            debtCollectorWarnings: state.player.debtCollectorWarnings ?? legalDefaults.debtCollectorWarnings,
        }),
    };
    return (0, progression_1.syncProgression)(withDefaults);
}
function migrateExtendedState(raw) {
    const defaults = (0, game_1.createDefaultHeatCooldowns)();
    const equipment = Array.isArray(raw.equipment)
        ? raw.equipment
            .filter((e) => typeof e === 'object' && e !== null)
            .map((e) => ({
            equipmentId: typeof e.equipmentId === 'string' ? e.equipmentId : '',
            usesRemaining: typeof e.usesRemaining === 'number' ? e.usesRemaining : undefined,
        }))
            .filter((e) => e.equipmentId.length > 0)
        : [];
    const localHeatByCity = {};
    if (typeof raw.localHeatByCity === 'object' && raw.localHeatByCity !== null) {
        for (const [k, v] of Object.entries(raw.localHeatByCity)) {
            if (typeof v === 'number')
                localHeatByCity[k] = v;
        }
    }
    const heatCooldowns = { ...defaults };
    if (typeof raw.heatCooldowns === 'object' && raw.heatCooldowns !== null) {
        const hc = raw.heatCooldowns;
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
    const encounterHistory = Array.isArray(raw.encounterHistory)
        ? raw.encounterHistory
            .filter((e) => typeof e === 'object' && e !== null)
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
