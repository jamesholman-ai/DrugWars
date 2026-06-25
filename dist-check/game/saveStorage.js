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
const engine_1 = require("./engine");
const stateUtils_1 = require("./stateUtils");
const worldEvents_1 = require("../data/worldEvents");
const progression_1 = require("./progression");
exports.SAVE_KEY = '@neon_underworld/save';
exports.SAVE_VERSION = 1;
const VALID_COMMODITY_IDS = new Set(commodities_1.COMMODITIES.map((c) => c.id));
const VALID_LOCATION_IDS = new Set(locations_1.LOCATIONS.map((l) => l.id));
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
            ? entry.affectedLocations.filter((id) => typeof id === 'string' && VALID_LOCATION_IDS.has(id))
            : [];
        const affectedCommodities = Array.isArray(entry.affectedCommodities)
            ? entry.affectedCommodities.filter((id) => typeof id === 'string' && VALID_COMMODITY_IDS.has(id))
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
            priceMultiplier: readNumber(entry.priceMultiplier, 1, 0.1, 5),
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
        const commodityId = readString(entry.commodityId, '');
        if (!VALID_COMMODITY_IDS.has(commodityId))
            continue;
        const quantity = readNumber(entry.quantity, 0, 0);
        if (quantity <= 0)
            continue;
        items.push({
            commodityId: commodityId,
            quantity: Math.floor(quantity),
            avgCost: readNumber(entry.avgCost, 0, 0),
        });
    }
    return items;
}
function migrateMarketPrices(raw, fallback) {
    if (!isRecord(raw)) {
        return fallback;
    }
    const prices = (0, engine_1.generateMarketPrices)();
    for (const location of locations_1.LOCATIONS) {
        const locRaw = raw[location.id];
        if (!isRecord(locRaw))
            continue;
        for (const commodity of commodities_1.COMMODITIES) {
            const price = locRaw[commodity.id];
            if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
                prices[location.id][commodity.id] = Math.round(price);
            }
        }
    }
    return prices;
}
function migratePlayer(raw) {
    const defaults = (0, engine_1.createInitialPlayerState)();
    if (!isRecord(raw)) {
        return defaults;
    }
    const location = readString(raw.currentLocation, defaults.currentLocation);
    const currentLocation = VALID_LOCATION_IDS.has(location)
        ? location
        : locations_1.STARTING_LOCATION_ID;
    const inventory = migrateInventory(raw.inventory);
    const inventoryCapacity = readNumber(raw.inventoryCapacity, defaults.inventoryCapacity, 1);
    return {
        cash: readNumber(raw.cash, defaults.cash, 0),
        debt: readNumber(raw.debt, defaults.debt, 0),
        health: readNumber(raw.health, defaults.health, 0, 100),
        heat: readNumber(raw.heat, defaults.heat, 0, 100),
        reputation: readNumber(raw.reputation, defaults.reputation, 0, 100),
        day: readNumber(raw.day, defaults.day, 1),
        currentLocation,
        inventoryCapacity,
        inventory,
        isGameOver: readBoolean(raw.isGameOver, defaults.isGameOver),
        gameOverReason: typeof raw.gameOverReason === 'string' ? raw.gameOverReason : undefined,
    };
}
/** Safely migrate parsed JSON into a valid GameState (fills missing fields). */
function migrateGameState(raw) {
    let stateRaw = raw;
    if (isRecord(raw) && 'state' in raw) {
        const envelope = raw;
        stateRaw = envelope.state;
    }
    if (!isRecord(stateRaw)) {
        return null;
    }
    const fallbackPrices = (0, engine_1.generateMarketPrices)();
    const player = migratePlayer(stateRaw.player);
    const { events: activeWorldEvents, refreshPrices } = migrateActiveWorldEvents(stateRaw.activeWorldEvents, player.day);
    let marketPrices = migrateMarketPrices(stateRaw.marketPrices, fallbackPrices);
    if (refreshPrices) {
        marketPrices = (0, engine_1.generateMarketPrices)(activeWorldEvents);
    }
    const isLegacySave = !isRecord(stateRaw.progression);
    const progression = (0, progression_1.migrateLegacyProgression)(stateRaw.progression, player, marketPrices, isLegacySave);
    const migrated = {
        player,
        marketPrices,
        pendingEvent: null,
        lastMessage: readString(stateRaw.lastMessage, 'Game loaded.'),
        messageLog: Array.isArray(stateRaw.messageLog)
            ? stateRaw.messageLog.filter((m) => typeof m === 'string').slice(0, 20)
            : [],
        memoryFlags: migrateMemoryFlags(stateRaw.memoryFlags),
        npcRelations: migrateNpcRelations(stateRaw.npcRelations),
        activeWorldEvents,
        progression,
    };
    if (!locations_1.LOCATION_MAP[migrated.player.currentLocation]) {
        migrated.player.currentLocation = locations_1.STARTING_LOCATION_ID;
    }
    return (0, stateUtils_1.normalizeGameState)(migrated);
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
