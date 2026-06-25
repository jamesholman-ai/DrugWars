"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAVE_VERSION = exports.SAVE_KEY = void 0;
exports.migrateGameState = migrateGameState;
exports.saveGameState = saveGameState;
exports.loadGameState = loadGameState;
exports.hasSavedGame = hasSavedGame;
exports.clearSavedGame = clearSavedGame;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const game_1 = require("../types/game");
const commodities_1 = require("../data/commodities");
const locations_1 = require("../data/locations");
const territory_1 = require("./territory");
const supplierSystem_1 = require("./supplierSystem");
const contractSystem_1 = require("./contractSystem");
const crewSystem_1 = require("./crewSystem");
const safehouseSystem_1 = require("./safehouseSystem");
const businessSystem_1 = require("./businessSystem");
const missionSystem_1 = require("./missionSystem");
const tutorialSystem_1 = require("./tutorialSystem");
const money_1 = require("./money");
const engine_1 = require("./engine");
const stateUtils_1 = require("./stateUtils");
const worldEvents_1 = require("../data/worldEvents");
const progression_1 = require("./progression");
exports.SAVE_KEY = '@neon_underworld/save';
exports.SAVE_VERSION = 9;
const VALID_COMMODITY_IDS = new Set(commodities_1.COMMODITIES.map((c) => c.id));
const VALID_AREA_KEYS = new Set((0, locations_1.getAllAreaKeys)());
const VALID_WORLD_EVENT_TYPES = new Set([
    'market_shortage',
    'police_crackdown',
    'gang_war',
    'market_boom',
    'market_crash',
    'airport_lockdown',
    'supplier_flood',
    'informant_network_buzz',
]);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high']);
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readNumber(value, fallback, min, max) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    let n = value;
    if (min !== undefined)
        n = Math.max(min, n);
    if (max !== undefined)
        n = Math.min(max, n);
    return n;
}
function readBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function readString(value, fallback) {
    return typeof value === 'string' ? value : fallback;
}
function migrateCommodityId(raw) {
    if (VALID_COMMODITY_IDS.has(raw))
        return raw;
    const mapped = commodities_1.LEGACY_COMMODITY_MAP[raw];
    if (mapped)
        return mapped;
    return null;
}
function migrateAreaKey(raw) {
    if (VALID_AREA_KEYS.has(raw))
        return raw;
    if (raw in locations_1.LEGACY_LOCATION_TO_CITY_AREA) {
        const mapped = locations_1.LEGACY_LOCATION_TO_CITY_AREA[raw];
        return (0, locations_1.getAreaKey)(mapped.cityId, mapped.areaId);
    }
    const colonIdx = raw.indexOf(':');
    if (colonIdx > 0) {
        const cityId = raw.slice(0, colonIdx);
        const areaSlug = raw.slice(colonIdx + 1);
        if (locations_1.CITY_MAP[cityId]) {
            const resolved = (0, locations_1.resolveAreaIdForCity)(cityId, areaSlug);
            const key = (0, locations_1.getAreaKey)(cityId, resolved);
            if (VALID_AREA_KEYS.has(key))
                return key;
        }
    }
    if (raw in locations_1.CITY_MAP) {
        return (0, locations_1.getAreaKey)(raw, (0, locations_1.resolveAreaIdForCity)(raw, 'downtown'));
    }
    const parsed = (0, locations_1.parseAreaKey)(raw);
    if (parsed && VALID_AREA_KEYS.has((0, locations_1.getAreaKey)(parsed.cityId, parsed.areaId))) {
        return (0, locations_1.getAreaKey)(parsed.cityId, parsed.areaId);
    }
    return null;
}
function migrateMemoryFlags(raw) {
    const defaults = (0, game_1.createEmptyMemoryFlags)();
    if (!isRecord(raw)) {
        return defaults;
    }
    return {
        helpedCop: readBoolean(raw.helpedCop, defaults.helpedCop),
        snitchedOnRival: readBoolean(raw.snitchedOnRival, defaults.snitchedOnRival),
        stiffedSupplier: readBoolean(raw.stiffedSupplier, defaults.stiffedSupplier),
        paidCollector: readBoolean(raw.paidCollector, defaults.paidCollector),
        soldToBuyer: readBoolean(raw.soldToBuyer, defaults.soldToBuyer),
        bribedCop: readBoolean(raw.bribedCop, defaults.bribedCop),
        ignoredInformant: readBoolean(raw.ignoredInformant, defaults.ignoredInformant),
    };
}
function migrateNpcRelations(raw) {
    if (!isRecord(raw)) {
        return {};
    }
    const relations = {};
    for (const [id, value] of Object.entries(raw)) {
        if (!isRecord(value))
            continue;
        relations[id] = {
            attitude: readNumber(value.attitude, 0, -100, 100),
            trust: readNumber(value.trust, 50, 0, 100),
            encounters: readNumber(value.encounters, 0, 0),
            lastSeenDay: readNumber(value.lastSeenDay, 0, 0),
        };
    }
    return relations;
}
function dedupeWorldEventsByType(events) {
    const byType = new Map();
    for (const event of events) {
        const existing = byType.get(event.type);
        if (!existing || event.expiresDay > existing.expiresDay) {
            byType.set(event.type, event);
        }
    }
    return Array.from(byType.values());
}
function migrateActiveWorldEvents(raw, currentDay) {
    if (!Array.isArray(raw)) {
        return { events: [], refreshPrices: false };
    }
    const parsed = [];
    for (const entry of raw) {
        if (!isRecord(entry))
            continue;
        const type = readString(entry.type, '');
        if (!VALID_WORLD_EVENT_TYPES.has(type))
            continue;
        const severity = readString(entry.severity, 'low');
        if (!VALID_SEVERITIES.has(severity))
            continue;
        const affectedLocations = Array.isArray(entry.affectedLocations)
            ? entry.affectedLocations
                .map((id) => (typeof id === 'string' ? migrateAreaKey(id) : null))
                .filter((id) => id != null)
            : [];
        const affectedCommodities = Array.isArray(entry.affectedCommodities)
            ? entry.affectedCommodities
                .map((id) => (typeof id === 'string' ? migrateCommodityId(id) : null))
                .filter((id) => id != null)
            : [];
        const startDay = readNumber(entry.startDay, currentDay, 1);
        const durationDays = readNumber(entry.durationDays, 3, 1);
        const expiresDay = readNumber(entry.expiresDay, startDay + durationDays, startDay + 1);
        const eventWeightModifiers = {};
        if (isRecord(entry.eventWeightModifiers)) {
            for (const [key, value] of Object.entries(entry.eventWeightModifiers)) {
                if (typeof value === 'number' && Number.isFinite(value)) {
                    eventWeightModifiers[key] = value;
                }
            }
        }
        parsed.push({
            id: readString(entry.id, `we_migrated_${parsed.length}`),
            type: type,
            title: readString(entry.title, 'World Event'),
            description: readString(entry.description, ''),
            affectedLocations,
            affectedCommodities,
            durationDays,
            priceMultiplier: readNumber(entry.priceMultiplier, 1, 0.05, 12),
            heatMultiplier: readNumber(entry.heatMultiplier, 1, 0.1, 5),
            eventWeightModifiers,
            startDay,
            expiresDay,
            severity: severity,
        });
    }
    const deduped = dedupeWorldEventsByType(parsed);
    const nonExpired = deduped.filter((event) => event.expiresDay > currentDay);
    const events = nonExpired.slice(0, worldEvents_1.MAX_ACTIVE_WORLD_EVENTS);
    const refreshPrices = nonExpired.length !== events.length || deduped.length > nonExpired.length;
    return {
        events,
        refreshPrices,
    };
}
function migrateInventory(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const items = [];
    for (const entry of raw) {
        if (!isRecord(entry))
            continue;
        const commodityId = migrateCommodityId(readString(entry.commodityId, ''));
        if (!commodityId)
            continue;
        const quantity = readNumber(entry.quantity, 0, 0);
        if (quantity <= 0)
            continue;
        items.push({
            commodityId,
            quantity: Math.floor(quantity),
            avgCost: readNumber(entry.avgCost, 0, 0),
        });
    }
    return items;
}
function isLegacyPriceFormat(raw) {
    return Object.keys(raw).some((key) => !key.includes(':') && key in locations_1.LEGACY_LOCATION_TO_CITY_AREA);
}
function migrateMarketPrices(raw, fallback, activeEvents) {
    if (!isRecord(raw) || isLegacyPriceFormat(raw)) {
        return (0, engine_1.generateMarketPrices)(activeEvents);
    }
    const prices = (0, engine_1.generateMarketPrices)(activeEvents);
    for (const areaKey of (0, locations_1.getAllAreaKeys)()) {
        const locRaw = raw[areaKey];
        if (!isRecord(locRaw))
            continue;
        for (const commodity of commodities_1.COMMODITIES) {
            const price = locRaw[commodity.id];
            if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
                prices[areaKey][commodity.id] = Math.round(price);
            }
        }
    }
    return prices;
}
function migratePriceHistory(raw) {
    if (!isRecord(raw))
        return {};
    const history = {};
    for (const [key, value] of Object.entries(raw)) {
        const areaKey = migrateAreaKey(key);
        if (!areaKey || !isRecord(value))
            continue;
        const entry = {};
        for (const [commodityId, chain] of Object.entries(value)) {
            const id = migrateCommodityId(commodityId);
            if (!id || !Array.isArray(chain))
                continue;
            entry[id] = chain
                .filter((n) => typeof n === 'number' && Number.isFinite(n))
                .slice(-6);
        }
        history[areaKey] = entry;
    }
    return history;
}
function migratePlayer(raw) {
    const defaults = (0, engine_1.createInitialPlayerState)();
    if (!isRecord(raw)) {
        return defaults;
    }
    let currentCityId = readString(raw.currentCityId, defaults.currentCityId);
    let currentAreaId = readString(raw.currentAreaId, defaults.currentAreaId);
    if (typeof raw.currentLocation === 'string') {
        const legacy = locations_1.LEGACY_LOCATION_TO_CITY_AREA[raw.currentLocation];
        if (legacy) {
            currentCityId = legacy.cityId;
            currentAreaId = legacy.areaId;
        }
        else if (raw.currentLocation.includes(':')) {
            const parsed = (0, locations_1.parseAreaKey)(raw.currentLocation);
            if (parsed) {
                currentCityId = parsed.cityId;
                currentAreaId = parsed.areaId;
            }
        }
        else if (raw.currentLocation in locations_1.CITY_MAP) {
            currentCityId = raw.currentLocation;
            currentAreaId = (0, locations_1.resolveAreaIdForCity)(currentCityId, 'downtown');
        }
    }
    if (!locations_1.CITY_MAP[currentCityId]) {
        currentCityId = locations_1.STARTING_CITY_ID;
    }
    currentAreaId = (0, locations_1.resolveAreaIdForCity)(currentCityId, currentAreaId);
    if (!locations_1.AREA_MAP[currentAreaId]) {
        currentAreaId = locations_1.STARTING_AREA_ID;
    }
    const inventory = migrateInventory(raw.inventory);
    const inventoryCapacity = readNumber(raw.inventoryCapacity, defaults.inventoryCapacity, 1);
    const legalDefaults = (0, game_1.createDefaultPlayerLegalFields)();
    const legalRaw = typeof raw.legalStatus === 'string' ? raw.legalStatus : legalDefaults.legalStatus;
    const validLegal = [
        'clean',
        'warning',
        'detained',
        'arrested',
        'jailed',
        'federal_case',
    ];
    const legalStatus = validLegal.includes(legalRaw)
        ? legalRaw
        : legalDefaults.legalStatus;
    return (0, money_1.normalizeMoneyFields)({
        cash: readNumber(raw.cash, defaults.cash, 0),
        dirtyCash: typeof raw.dirtyCash === 'number'
            ? readNumber(raw.dirtyCash, 0, 0)
            : readNumber(raw.cash, defaults.cash, 0),
        cleanCash: typeof raw.cleanCash === 'number'
            ? readNumber(raw.cleanCash, 0, 0)
            : typeof raw.dirtyCash === 'number'
                ? 0
                : 0,
        debt: readNumber(raw.debt, defaults.debt, 0),
        health: readNumber(raw.health, defaults.health, 0, 100),
        heat: readNumber(raw.heat, defaults.heat, 0, 100),
        reputation: readNumber(raw.reputation, defaults.reputation, 0, 100),
        day: readNumber(raw.day, defaults.day, 1),
        currentCityId,
        currentAreaId,
        inventoryCapacity,
        inventory,
        isGameOver: readBoolean(raw.isGameOver, defaults.isGameOver),
        gameOverReason: typeof raw.gameOverReason === 'string' ? raw.gameOverReason : undefined,
        legalStatus,
        federalCaseSeverity: readNumber(raw.federalCaseSeverity, legalDefaults.federalCaseSeverity, 0, 100),
        daysInJail: readNumber(raw.daysInJail, legalDefaults.daysInJail, 0),
        debtCollectorWarnings: readNumber(raw.debtCollectorWarnings, legalDefaults.debtCollectorWarnings, 0),
    });
}
function migrateGameState(raw) {
    let stateRaw = raw;
    if (isRecord(raw) && 'state' in raw) {
        const envelope = raw;
        stateRaw = envelope.state;
    }
    if (!isRecord(stateRaw)) {
        return null;
    }
    const player = migratePlayer(stateRaw.player);
    const { events: activeWorldEvents, refreshPrices } = migrateActiveWorldEvents(stateRaw.activeWorldEvents, player.day);
    const fallbackPrices = (0, engine_1.generateMarketPrices)(activeWorldEvents);
    let marketPrices = migrateMarketPrices(stateRaw.marketPrices, fallbackPrices, activeWorldEvents);
    if (refreshPrices) {
        marketPrices = (0, engine_1.generateMarketPrices)(activeWorldEvents);
    }
    const isLegacySave = !isRecord(stateRaw.progression) ||
        (isRecord(stateRaw.player) &&
            'currentLocation' in stateRaw.player &&
            !('currentCityId' in stateRaw.player));
    const progression = (0, progression_1.migrateLegacyProgression)(stateRaw.progression, player, marketPrices, isLegacySave);
    const extended = isRecord(stateRaw) ? (0, stateUtils_1.migrateExtendedState)(stateRaw) : {
        equipment: [],
        cartelStanding: 0,
        cartelBetrayals: 0,
        localHeatByCity: {},
        heatCooldowns: (0, game_1.createDefaultHeatCooldowns)(),
        encounterHistory: [],
    };
    const areaOwnership = (0, territory_1.migrateAreaOwnership)(isRecord(stateRaw) ? stateRaw.areaOwnership : undefined);
    const localHeatByCity = (0, territory_1.migrateLocalHeatByCity)(extended.localHeatByCity, player.heat);
    const supplierRelationships = (0, supplierSystem_1.migrateSupplierRelationships)(isRecord(stateRaw) ? stateRaw.supplierRelationships : undefined);
    const supplierOffers = (0, supplierSystem_1.migrateSupplierOffers)(isRecord(stateRaw) ? stateRaw.supplierOffers : undefined);
    const contractOffers = (0, contractSystem_1.migrateContracts)(isRecord(stateRaw) ? stateRaw.contractOffers : undefined, 'offers');
    const activeContracts = (0, contractSystem_1.migrateContracts)(isRecord(stateRaw) ? stateRaw.activeContracts : undefined, 'active');
    const completedContracts = (0, contractSystem_1.migrateContracts)(isRecord(stateRaw) ? stateRaw.completedContracts : undefined, 'completed');
    const failedContracts = (0, contractSystem_1.migrateContracts)(isRecord(stateRaw) ? stateRaw.failedContracts : undefined, 'failed');
    const availableCrew = (0, crewSystem_1.migrateCrewRecruits)(isRecord(stateRaw) ? stateRaw.availableCrew : undefined);
    const hiredCrew = (0, crewSystem_1.migrateHiredCrew)(isRecord(stateRaw) ? stateRaw.hiredCrew : undefined);
    const crewHistory = (0, crewSystem_1.migrateCrewHistory)(isRecord(stateRaw) ? stateRaw.crewHistory : undefined);
    const ownedSafehouses = (0, safehouseSystem_1.migrateOwnedSafehouses)(isRecord(stateRaw) ? stateRaw.ownedSafehouses : undefined);
    const storedInventoryBySafehouse = (0, safehouseSystem_1.migrateStoredInventory)(isRecord(stateRaw) ? stateRaw.storedInventoryBySafehouse : undefined);
    const ownedBusinesses = (0, businessSystem_1.migrateOwnedBusinesses)(isRecord(stateRaw) ? stateRaw.ownedBusinesses : undefined);
    const businessHistory = (0, businessSystem_1.migrateBusinessHistory)(isRecord(stateRaw) ? stateRaw.businessHistory : undefined);
    const businessRaids = (0, businessSystem_1.migrateBusinessRaids)(isRecord(stateRaw) ? stateRaw.businessRaids : undefined);
    const lastDaySummary = (0, businessSystem_1.migrateDaySummary)(isRecord(stateRaw) ? stateRaw.lastDaySummary : undefined);
    const activeMissions = (0, missionSystem_1.migrateMissionInstances)(isRecord(stateRaw) ? stateRaw.activeMissions : undefined);
    const completedMissions = (0, missionSystem_1.migrateMissionInstances)(isRecord(stateRaw) ? stateRaw.completedMissions : undefined);
    const failedMissions = (0, missionSystem_1.migrateMissionInstances)(isRecord(stateRaw) ? stateRaw.failedMissions : undefined);
    const dailyObjectives = (0, missionSystem_1.migrateDailyObjectives)(isRecord(stateRaw) ? stateRaw.dailyObjectives : undefined);
    const missionProgress = (0, missionSystem_1.migrateMissionProgress)(isRecord(stateRaw) ? stateRaw.missionProgress : undefined);
    const activePriceTips = (0, missionSystem_1.migratePriceTips)(isRecord(stateRaw) ? stateRaw.activePriceTips : undefined);
    const currentStoryArc = isRecord(stateRaw) && typeof stateRaw.currentStoryArc === 'string'
        ? stateRaw.currentStoryArc
        : null;
    const missionsRaw = isRecord(stateRaw) && Array.isArray(stateRaw.missions)
        ? stateRaw.missions.filter((m) => typeof m === 'string')
        : undefined;
    const hasExistingProgress = player.day > 1 ||
        player.cash !== (0, engine_1.createInitialPlayerState)().cash ||
        (Array.isArray(stateRaw.activeMissions) && stateRaw.activeMissions.length > 0);
    const tutorial = (0, tutorialSystem_1.migrateTutorial)(isRecord(stateRaw) ? stateRaw.tutorial : undefined, hasExistingProgress);
    const migrated = {
        player,
        marketPrices,
        priceHistory: migratePriceHistory(stateRaw.priceHistory),
        pendingEvent: null,
        lastMessage: readString(stateRaw.lastMessage, 'Game loaded.'),
        messageLog: Array.isArray(stateRaw.messageLog)
            ? stateRaw.messageLog.filter((m) => typeof m === 'string').slice(0, 20)
            : [],
        memoryFlags: migrateMemoryFlags(stateRaw.memoryFlags),
        npcRelations: migrateNpcRelations(stateRaw.npcRelations),
        activeWorldEvents,
        progression,
        ...extended,
        localHeatByCity,
        areaOwnership,
        supplierRelationships,
        supplierOffers,
        contractOffers,
        activeContracts,
        completedContracts,
        failedContracts,
        availableCrew,
        hiredCrew,
        crewHistory,
        ownedSafehouses,
        storedInventoryBySafehouse,
        ownedBusinesses,
        businessHistory,
        businessRaids,
        lastDaySummary,
        missions: missionsRaw,
        activeMissions,
        completedMissions,
        failedMissions,
        dailyObjectives,
        currentStoryArc,
        missionProgress,
        activePriceTips,
        tutorial,
    };
    if (!locations_1.CITY_MAP[migrated.player.currentCityId]) {
        migrated.player.currentCityId = locations_1.STARTING_CITY_ID;
    }
    migrated.player.currentAreaId = (0, locations_1.resolveAreaIdForCity)(migrated.player.currentCityId, migrated.player.currentAreaId);
    if (!locations_1.AREA_MAP[migrated.player.currentAreaId]) {
        migrated.player.currentAreaId = locations_1.STARTING_AREA_ID;
    }
    const areaKey = (0, locations_1.getAreaKey)(migrated.player.currentCityId, migrated.player.currentAreaId);
    if (!migrated.marketPrices[areaKey]) {
        migrated.marketPrices = (0, engine_1.generateMarketPrices)(activeWorldEvents);
    }
    let normalized = (0, stateUtils_1.normalizeGameState)(migrated);
    const needsMissionInit = (normalized.activeMissions ?? []).length === 0 &&
        (normalized.completedMissions ?? []).length === 0;
    if (needsMissionInit) {
        normalized = (0, missionSystem_1.initializeMissionState)(normalized);
        normalized = (0, missionSystem_1.syncMissionState)(normalized);
    }
    const todaysObjectives = (normalized.dailyObjectives ?? []).filter((o) => o.generatedDay === normalized.player.day);
    if (todaysObjectives.length === 0) {
        normalized = (0, missionSystem_1.generateDailyObjectives)(normalized);
    }
    return normalized;
}
async function saveGameState(state) {
    const envelope = {
        version: exports.SAVE_VERSION,
        savedAt: new Date().toISOString(),
        state: (0, stateUtils_1.normalizeGameState)(state),
    };
    await async_storage_1.default.setItem(exports.SAVE_KEY, JSON.stringify(envelope));
}
async function loadGameState() {
    try {
        const json = await async_storage_1.default.getItem(exports.SAVE_KEY);
        if (!json) {
            return null;
        }
        const parsed = JSON.parse(json);
        return migrateGameState(parsed);
    }
    catch {
        return null;
    }
}
async function hasSavedGame() {
    try {
        const json = await async_storage_1.default.getItem(exports.SAVE_KEY);
        return json !== null && json.length > 0;
    }
    catch {
        return false;
    }
}
async function clearSavedGame() {
    await async_storage_1.default.removeItem(exports.SAVE_KEY);
}
