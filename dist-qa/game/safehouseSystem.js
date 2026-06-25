"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnedSafehouseIds = getOwnedSafehouseIds;
exports.isSafehouseOwned = isSafehouseOwned;
exports.getSafehousesAtLocation = getSafehousesAtLocation;
exports.getLocalOwnedSafehouse = getLocalOwnedSafehouse;
exports.getStoredInventory = getStoredInventory;
exports.getStoredUsed = getStoredUsed;
exports.getTotalStorageCapacity = getTotalStorageCapacity;
exports.getSafehouseHeatDecayBonus = getSafehouseHeatDecayBonus;
exports.getSafehouseRobberyProtection = getSafehouseRobberyProtection;
exports.getSafehousePoliceModifier = getSafehousePoliceModifier;
exports.purchaseSafehouse = purchaseSafehouse;
exports.depositToSafehouse = depositToSafehouse;
exports.withdrawFromSafehouse = withdrawFromSafehouse;
exports.tickSafehouseUpkeep = tickSafehouseUpkeep;
exports.getDailySafehouseUpkeep = getDailySafehouseUpkeep;
exports.createDefaultSafehouseState = createDefaultSafehouseState;
exports.migrateOwnedSafehouses = migrateOwnedSafehouses;
exports.migrateStoredInventory = migrateStoredInventory;
const safehouses_1 = require("../data/safehouses");
const progression_1 = require("../data/progression");
const commodities_1 = require("../data/commodities");
const progression_2 = require("./progression");
const messages_1 = require("./messages");
const progression_3 = require("./progression");
const money_1 = require("./money");
const missionSystem_1 = require("./missionSystem");
const random_1 = require("../utils/random");
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function meetsSafehouseUnlock(state, def) {
    if (!(0, progression_2.isCityUnlocked)(state, def.cityId))
        return false;
    if (def.minRank && rankIndex(state.progression.rankId) < rankIndex(def.minRank))
        return false;
    if (def.minReputation != null && state.player.reputation < def.minReputation)
        return false;
    return true;
}
function getOwnedSafehouseIds(state) {
    return (state.ownedSafehouses ?? []).map((o) => o.safehouseId);
}
function isSafehouseOwned(state, safehouseId) {
    return getOwnedSafehouseIds(state).includes(safehouseId);
}
function getSafehousesAtLocation(state, cityId, areaId) {
    return safehouses_1.SAFEHOUSES.filter((s) => s.cityId === cityId && s.areaId === areaId);
}
function getLocalOwnedSafehouse(state) {
    const { currentCityId, currentAreaId } = state.player;
    const owned = state.ownedSafehouses ?? [];
    for (const o of owned) {
        const def = safehouses_1.SAFEHOUSE_MAP[o.safehouseId];
        if (def?.cityId === currentCityId && def.areaId === currentAreaId) {
            return { owned: o, def };
        }
    }
    return null;
}
function getStoredInventory(state, safehouseId) {
    return [...(state.storedInventoryBySafehouse?.[safehouseId] ?? [])];
}
function getStoredUsed(state, safehouseId) {
    return getStoredInventory(state, safehouseId).reduce((s, i) => s + i.quantity, 0);
}
function getTotalStorageCapacity(state) {
    let total = 0;
    for (const o of state.ownedSafehouses ?? []) {
        total += safehouses_1.SAFEHOUSE_MAP[o.safehouseId]?.storageCapacity ?? 0;
    }
    return total;
}
function getSafehouseHeatDecayBonus(state) {
    const local = getLocalOwnedSafehouse(state);
    if (!local)
        return 0;
    const condition = local.owned.condition / 100;
    return Math.round(local.def.heatReductionPerDay * condition);
}
function getSafehouseRobberyProtection(state) {
    const local = getLocalOwnedSafehouse(state);
    if (!local)
        return 0;
    const condition = local.owned.condition / 100;
    return local.def.robberyProtection * condition;
}
function getSafehousePoliceModifier(state) {
    const local = getLocalOwnedSafehouse(state);
    if (!local)
        return 1;
    const missed = local.owned.upkeepMissedDays;
    const penalty = 1 + missed * 0.05;
    return Math.min(1.2, local.def.policeRiskModifier * penalty);
}
function mergeItem(items, commodityId, quantity, avgCost) {
    const existing = items.find((i) => i.commodityId === commodityId);
    if (!existing) {
        return [...items, { commodityId, quantity, avgCost }];
    }
    const totalQty = existing.quantity + quantity;
    return items.map((i) => i.commodityId === commodityId
        ? {
            ...i,
            quantity: totalQty,
            avgCost: Math.round((i.avgCost * i.quantity + avgCost * quantity) / totalQty),
        }
        : i);
}
function removeQty(items, commodityId, quantity) {
    const existing = items.find((i) => i.commodityId === commodityId);
    if (!existing || existing.quantity <= 0) {
        return { items, removed: 0, avgCost: 0 };
    }
    const removed = Math.min(quantity, existing.quantity);
    const avgCost = existing.avgCost;
    const next = items
        .map((i) => i.commodityId === commodityId
        ? { ...i, quantity: i.quantity - removed }
        : i)
        .filter((i) => i.quantity > 0);
    return { items: next, removed, avgCost };
}
function getCarriedCount(inventory) {
    return inventory.reduce((s, i) => s + i.quantity, 0);
}
function purchaseSafehouse(state, safehouseId) {
    const def = safehouses_1.SAFEHOUSE_MAP[safehouseId];
    if (!def)
        return (0, messages_1.withMessage)(state, 'Unknown property.');
    if (isSafehouseOwned(state, safehouseId)) {
        return (0, messages_1.withMessage)(state, 'You already own this property.');
    }
    if (!meetsSafehouseUnlock(state, def)) {
        return (0, messages_1.withMessage)(state, 'Requirements not met for this property.');
    }
    const { player } = state;
    if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
        return (0, messages_1.withMessage)(state, 'You must be on-site to purchase this property.');
    }
    const afterSpend = (0, money_1.spendMoney)(player, def.purchaseCost, true);
    if (!afterSpend) {
        return (0, messages_1.withMessage)(state, `Need $${def.purchaseCost} for ${def.name} (clean preferred). You have $${player.cash}.`);
    }
    const owned = {
        safehouseId,
        purchasedDay: player.day,
        upkeepMissedDays: 0,
        condition: 100,
    };
    return (0, progression_3.applyProgressionAfterAction)((0, missionSystem_1.trackMissionEvent)((0, messages_1.withMessage)({
        ...state,
        player: afterSpend,
        ownedSafehouses: [...(state.ownedSafehouses ?? []), owned],
        storedInventoryBySafehouse: {
            ...(state.storedInventoryBySafehouse ?? {}),
            [safehouseId]: [],
        },
    }, `Purchased ${def.name} for $${def.purchaseCost}. Storage +${def.storageCapacity}. Upkeep $${def.upkeepPerDay}/day.`), { kind: 'purchase_safehouse' }));
}
function depositToSafehouse(state, safehouseId, commodityId, quantity) {
    if (quantity <= 0)
        return state;
    const def = safehouses_1.SAFEHOUSE_MAP[safehouseId];
    if (!def || !isSafehouseOwned(state, safehouseId)) {
        return (0, messages_1.withMessage)(state, 'You do not own this property.');
    }
    const { player } = state;
    if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
        return (0, messages_1.withMessage)(state, 'Must be at the property to deposit.');
    }
    const { items: carried, removed, avgCost } = removeQty(player.inventory, commodityId, quantity);
    if (removed <= 0) {
        return (0, messages_1.withMessage)(state, 'Not enough product to deposit.');
    }
    const stored = getStoredInventory(state, safehouseId);
    const used = stored.reduce((s, i) => s + i.quantity, 0);
    if (used + removed > def.storageCapacity) {
        return (0, messages_1.withMessage)(state, `Property full (${used}/${def.storageCapacity}). Withdraw or upgrade elsewhere.`);
    }
    const nextStored = mergeItem(stored, commodityId, removed, avgCost);
    const name = commodities_1.COMMODITY_MAP[commodityId]?.name ?? commodityId;
    return (0, missionSystem_1.trackMissionEvent)((0, messages_1.withMessage)({
        ...state,
        player: { ...player, inventory: carried },
        storedInventoryBySafehouse: {
            ...(state.storedInventoryBySafehouse ?? {}),
            [safehouseId]: nextStored,
        },
    }, `Deposited ${removed} ${name} into ${def.name}.`), { kind: 'deposit_safehouse', quantity: removed });
}
function withdrawFromSafehouse(state, safehouseId, commodityId, quantity) {
    if (quantity <= 0)
        return state;
    const def = safehouses_1.SAFEHOUSE_MAP[safehouseId];
    if (!def || !isSafehouseOwned(state, safehouseId)) {
        return (0, messages_1.withMessage)(state, 'You do not own this property.');
    }
    const { player } = state;
    if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
        return (0, messages_1.withMessage)(state, 'Must be at the property to withdraw.');
    }
    const stored = getStoredInventory(state, safehouseId);
    const { items: nextStored, removed, avgCost } = removeQty(stored, commodityId, quantity);
    if (removed <= 0) {
        return (0, messages_1.withMessage)(state, 'Not enough product in property storage.');
    }
    const carriedUsed = getCarriedCount(player.inventory);
    if (carriedUsed + removed > player.inventoryCapacity) {
        const space = player.inventoryCapacity - carriedUsed;
        return (0, messages_1.withMessage)(state, `Carried storage full. Only ${space} slots free.`);
    }
    const nextCarried = mergeItem(player.inventory, commodityId, removed, avgCost);
    const name = commodities_1.COMMODITY_MAP[commodityId]?.name ?? commodityId;
    return (0, messages_1.withMessage)({
        ...state,
        player: { ...player, inventory: nextCarried },
        storedInventoryBySafehouse: {
            ...(state.storedInventoryBySafehouse ?? {}),
            [safehouseId]: nextStored,
        },
    }, `Withdrew ${removed} ${name} from ${def.name}.`);
}
function tickSafehouseUpkeep(state) {
    const owned = state.ownedSafehouses ?? [];
    if (owned.length === 0)
        return state;
    let totalUpkeep = 0;
    for (const o of owned) {
        totalUpkeep += safehouses_1.SAFEHOUSE_MAP[o.safehouseId]?.upkeepPerDay ?? 0;
    }
    let cash = state.player.cash;
    const messages = [];
    let nextOwned = [];
    if (cash >= totalUpkeep) {
        cash -= totalUpkeep;
        nextOwned = owned.map((o) => ({
            ...o,
            upkeepMissedDays: 0,
            condition: (0, random_1.clamp)(o.condition + 1, 0, 100),
        }));
        messages.push(`Property upkeep -$${totalUpkeep}.`);
    }
    else {
        messages.push(`Could not pay full property upkeep ($${totalUpkeep}).`);
        cash = 0;
        nextOwned = owned.map((o) => ({
            ...o,
            upkeepMissedDays: o.upkeepMissedDays + 1,
            condition: (0, random_1.clamp)(o.condition - 8, 20, 100),
        }));
    }
    return (0, messages_1.withMessage)({ ...state, player: { ...state.player, cash }, ownedSafehouses: nextOwned }, messages[0]);
}
function getDailySafehouseUpkeep(state) {
    return (state.ownedSafehouses ?? []).reduce((sum, o) => sum + (safehouses_1.SAFEHOUSE_MAP[o.safehouseId]?.upkeepPerDay ?? 0), 0);
}
function createDefaultSafehouseState() {
    return { ownedSafehouses: [], storedInventoryBySafehouse: {} };
}
function migrateOwnedSafehouses(raw) {
    if (!Array.isArray(raw))
        return [];
    const result = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        const id = typeof e.safehouseId === 'string' ? e.safehouseId : '';
        if (!safehouses_1.SAFEHOUSE_MAP[id])
            continue;
        result.push({
            safehouseId: id,
            purchasedDay: typeof e.purchasedDay === 'number' ? e.purchasedDay : 1,
            upkeepMissedDays: typeof e.upkeepMissedDays === 'number' ? e.upkeepMissedDays : 0,
            condition: typeof e.condition === 'number' ? (0, random_1.clamp)(e.condition, 20, 100) : 100,
        });
    }
    return result;
}
function migrateStoredInventory(raw) {
    const result = {};
    if (typeof raw !== 'object' || raw === null)
        return result;
    for (const [key, value] of Object.entries(raw)) {
        if (!safehouses_1.SAFEHOUSE_MAP[key] || !Array.isArray(value))
            continue;
        const items = [];
        for (const entry of value) {
            if (typeof entry !== 'object' || entry === null)
                continue;
            const e = entry;
            const commodityId = typeof e.commodityId === 'string' ? e.commodityId : '';
            if (!commodities_1.COMMODITY_MAP[commodityId])
                continue;
            const quantity = typeof e.quantity === 'number' ? Math.max(0, Math.floor(e.quantity)) : 0;
            if (quantity <= 0)
                continue;
            items.push({
                commodityId: commodityId,
                quantity,
                avgCost: typeof e.avgCost === 'number' ? Math.max(0, e.avgCost) : 0,
            });
        }
        result[key] = items;
    }
    return result;
}
