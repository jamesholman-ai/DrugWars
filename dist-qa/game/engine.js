"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAILY_DEBT_INTEREST = exports.BORROW_AMOUNTS = exports.resolveEventChoice = exports.getInventoryUsed = exports.getNetWorth = void 0;
exports.generateMarketPrices = generateMarketPrices;
exports.generateStartingMarketPrices = generateStartingMarketPrices;
exports.createInitialPlayerState = createInitialPlayerState;
exports.createInitialGameState = createInitialGameState;
exports.buyCommodity = buyCommodity;
exports.sellCommodity = sellCommodity;
exports.travelToArea = travelToArea;
exports.travelToCity = travelToCity;
exports.stayHere = stayHere;
exports.travelToLocation = travelToLocation;
exports.payDebt = payDebt;
exports.borrowMoney = borrowMoney;
exports.restDay = restDay;
exports.chooseEventOption = chooseEventOption;
exports.getMaxBorrow = getMaxBorrow;
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
const crewBonuses_1 = require("./crewBonuses");
const events_1 = require("../data/events");
const encounterSystem_1 = require("./encounterSystem");
const encounterResolver_1 = require("./encounterResolver");
const random_1 = require("../utils/random");
const messages_1 = require("./messages");
const engineHelpers_1 = require("./engineHelpers");
const eventResolver_1 = require("./eventResolver");
Object.defineProperty(exports, "resolveEventChoice", { enumerable: true, get: function () { return eventResolver_1.resolveEventChoice; } });
const stateUtils_1 = require("./stateUtils");
const worldEvents_1 = require("./worldEvents");
const progression_1 = require("./progression");
const progression_2 = require("../data/progression");
const economy_1 = require("./economy");
Object.defineProperty(exports, "getInventoryUsed", { enumerable: true, get: function () { return economy_1.getInventoryUsed; } });
Object.defineProperty(exports, "getNetWorth", { enumerable: true, get: function () { return economy_1.getNetWorth; } });
const combat_1 = require("./combat");
const STARTING_CASH = 2800;
const STARTING_DEBT = 4500;
const DAILY_DEBT_INTEREST = 0.025;
exports.DAILY_DEBT_INTEREST = DAILY_DEBT_INTEREST;
const HEAT_DECAY = 3;
const MAX_DEBT = 50000;
const BORROW_AMOUNTS = [1000, 2500, 5000];
exports.BORROW_AMOUNTS = BORROW_AMOUNTS;
const PRICE_HISTORY_LENGTH = 6;
function generateAreaPrices(cityId, areaId, activeEvents = [], random = Math.random) {
    const city = locations_1.CITY_MAP[cityId];
    const area = locations_1.AREA_MAP[areaId];
    if (!city || !area) {
        return {};
    }
    const prices = {};
    for (const commodity of commodities_1.COMMODITIES) {
        prices[commodity.id] = (0, random_1.generateCommodityPrice)(commodity, city, area, random);
    }
    const areaKey = (0, locations_1.getAreaKey)(cityId, areaId);
    const wrapped = { [areaKey]: prices };
    const adjusted = (0, worldEvents_1.applyWorldEventsToPrices)(wrapped, activeEvents);
    return adjusted[areaKey] ?? prices;
}
function generateMarketPrices(activeEvents = [], random = Math.random) {
    const prices = {};
    for (const city of locations_1.CITIES) {
        for (const area of (0, locations_1.getAreasForCity)(city.id)) {
            const key = (0, locations_1.getAreaKey)(city.id, area.id);
            prices[key] = generateAreaPrices(city.id, area.id, activeEvents, random);
        }
    }
    return prices;
}
/** Fast bootstrap — only prices for the starting area (rest generated on travel/day advance). */
function generateStartingMarketPrices(activeEvents = [], random = Math.random) {
    const key = (0, locations_1.getAreaKey)(locations_1.STARTING_CITY_ID, locations_1.STARTING_AREA_ID);
    return {
        [key]: generateAreaPrices(locations_1.STARTING_CITY_ID, locations_1.STARTING_AREA_ID, activeEvents, random),
    };
}
function pushPriceHistory(history, areaKey, areaPrices) {
    const next = { ...history };
    const prev = { ...(next[areaKey] ?? {}) };
    for (const commodity of commodities_1.COMMODITIES) {
        const price = areaPrices[commodity.id];
        if (price == null)
            continue;
        const chain = [...(prev[commodity.id] ?? []), price];
        prev[commodity.id] = chain.slice(-PRICE_HISTORY_LENGTH);
    }
    next[areaKey] = prev;
    return next;
}
function refreshAreaMarket(state, cityId, areaId, random = Math.random) {
    const areaKey = (0, locations_1.getAreaKey)(cityId, areaId);
    const areaPrices = generateAreaPrices(cityId, areaId, state.activeWorldEvents, random);
    return {
        ...state,
        marketPrices: {
            ...state.marketPrices,
            [areaKey]: areaPrices,
        },
        priceHistory: pushPriceHistory(state.priceHistory, areaKey, areaPrices),
    };
}
function createInitialPlayerState() {
    return (0, money_1.normalizeMoneyFields)({
        cash: STARTING_CASH,
        dirtyCash: STARTING_CASH,
        cleanCash: 0,
        debt: STARTING_DEBT,
        health: 100,
        heat: 10,
        reputation: 20,
        day: 1,
        currentCityId: locations_1.STARTING_CITY_ID,
        currentAreaId: locations_1.STARTING_AREA_ID,
        inventoryCapacity: progression_2.BASE_INVENTORY_CAPACITY,
        inventory: [],
        isGameOver: false,
        ...(0, game_1.createDefaultPlayerLegalFields)(),
    });
}
function createInitialGameState() {
    const label = (0, locations_1.getAreaLabel)(locations_1.STARTING_CITY_ID, locations_1.STARTING_AREA_ID);
    const marketPrices = generateStartingMarketPrices();
    const areaKey = (0, locations_1.getAreaKey)(locations_1.STARTING_CITY_ID, locations_1.STARTING_AREA_ID);
    const state = {
        player: createInitialPlayerState(),
        marketPrices,
        priceHistory: pushPriceHistory({}, areaKey, marketPrices[areaKey]),
        pendingEvent: null,
        memoryFlags: (0, game_1.createEmptyMemoryFlags)(),
        npcRelations: {},
        activeWorldEvents: [],
        progression: (0, progression_1.createInitialProgression)(),
        equipment: [],
        cartelStanding: 0,
        cartelBetrayals: 0,
        localHeatByCity: (0, territory_1.createDefaultLocalHeat)(),
        areaOwnership: (0, territory_1.createDefaultAreaOwnership)(),
        supplierRelationships: {},
        supplierOffers: [],
        contractOffers: [],
        activeContracts: [],
        completedContracts: [],
        failedContracts: [],
        availableCrew: [],
        hiredCrew: [],
        crewHistory: [],
        ownedSafehouses: [],
        storedInventoryBySafehouse: {},
        ownedBusinesses: [],
        businessHistory: [],
        businessRaids: [],
        lastDaySummary: null,
        heatCooldowns: (0, game_1.createDefaultHeatCooldowns)(),
        encounterHistory: [],
        lastMessage: `Day 1 — You arrive in ${label} with $${STARTING_CASH} and $${STARTING_DEBT} debt. Local buyers are hot — check the market.`,
        messageLog: [
            `Day 1 — New run in ${label}. Demand surge active 3 days.`,
            `Loan shark expects $${STARTING_DEBT}. Pay early when you can — interest is 2.5%/day.`,
            `Mission: Make your first sale, then claim the reward on the Hub.`,
        ],
        tutorial: (0, tutorialSystem_1.createDefaultTutorial)(false),
    };
    let stateWithMissions = (0, missionSystem_1.initializeMissionState)(state);
    stateWithMissions = (0, tutorialSystem_1.applyFirstSessionMarketBoost)(stateWithMissions);
    return (0, progression_1.syncProgression)((0, contractSystem_1.generateContractOffers)(stateWithMissions));
}
function getInventoryCount(inventory) {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
}
function getInventoryItem(inventory, commodityId) {
    return inventory.find((item) => item.commodityId === commodityId);
}
function checkGameOver(player) {
    return (0, engineHelpers_1.checkGameOverPlayer)(player);
}
function tryRollEncounterOrLegacy(state, encounterContext, legacyTrigger) {
    let updated = (0, encounterSystem_1.rollEncounter)(state, encounterContext);
    if (!updated.pendingEvent) {
        updated = (0, events_1.rollRandomEvent)(updated, legacyTrigger);
    }
    return (0, engineHelpers_1.checkGameOverState)(updated);
}
function finalizeAction(state, event) {
    const updated = event ? (0, missionSystem_1.trackMissionEvent)(state, event) : (0, missionSystem_1.syncMissionState)(state);
    return (0, progression_1.applyProgressionAfterAction)(updated);
}
function refreshDealsAtLocation(state) {
    let updated = (0, supplierSystem_1.refreshSupplierOffers)(state);
    updated = (0, contractSystem_1.generateContractOffers)(updated);
    updated = (0, crewSystem_1.refreshCrewRecruits)(updated);
    return updated;
}
function tickEmpireBeforeDayAdvance(state) {
    let updated = (0, crewSystem_1.tickCrewPayroll)(state);
    updated = (0, safehouseSystem_1.tickSafehouseUpkeep)(updated);
    updated = (0, businessSystem_1.tickBusinessesOnDayAdvance)(updated);
    return updated;
}
function applyDailyUpkeep(player, extraHeatDecay = 0, debtRate = DAILY_DEBT_INTEREST) {
    const debtInterest = Math.floor(player.debt * debtRate);
    const updated = {
        ...player,
        day: player.day + 1,
        debt: player.debt + debtInterest,
        heat: (0, random_1.clamp)(player.heat - HEAT_DECAY - extraHeatDecay, 0, 100),
        health: (0, random_1.clamp)(player.health - 1, 0, 100),
    };
    return checkGameOver(updated);
}
function advanceDayState(state, dayMessage, random = Math.random) {
    const interest = Math.floor(state.player.debt * DAILY_DEBT_INTEREST);
    const areaKey = (0, locations_1.getPlayerAreaKey)(state.player);
    const extraHeatDecay = (0, progression_1.getExtraHeatDecayAtLocation)(state.progression, areaKey) +
        (0, safehouseSystem_1.getSafehouseHeatDecayBonus)(state);
    const debtRate = DAILY_DEBT_INTEREST * (1 - (0, crewBonuses_1.getAccountantDebtReduction)(state));
    let updated = tickEmpireBeforeDayAdvance(state);
    updated = {
        ...updated,
        player: applyDailyUpkeep(updated.player, extraHeatDecay, debtRate),
    };
    updated = (0, worldEvents_1.tickWorldEventsOnDayAdvance)(updated, random);
    const marketPrices = generateMarketPrices(updated.activeWorldEvents, random);
    updated = {
        ...updated,
        marketPrices,
        priceHistory: Object.keys(marketPrices).reduce((hist, key) => {
            return pushPriceHistory(hist, key, marketPrices[key]);
        }, updated.priceHistory),
    };
    const messages = [
        dayMessage,
        interest > 0
            ? `Day ${updated.player.day}: Debt interest +$${interest}. New prices worldwide.`
            : `Day ${updated.player.day}: New prices worldwide.`,
    ];
    updated = (0, messages_1.withMessages)(updated, messages);
    updated = { ...updated, player: checkGameOver(updated.player) };
    updated = (0, contractSystem_1.tickContractsOnDayAdvance)(updated);
    updated = (0, missionSystem_1.tickMissionsOnDayAdvance)(updated);
    return updated;
}
function heatFromTrade(state, riskLevel, quantity, buying) {
    const multiplier = buying ? 0.55 : 0.32;
    const base = Math.max(1, Math.round(riskLevel * quantity * multiplier));
    const areaKey = (0, locations_1.getPlayerAreaKey)(state.player);
    const heatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(state, areaKey);
    return (0, worldEvents_1.scalePositiveHeat)(base, heatMult);
}
function reputationFromProfit(profit, riskLevel) {
    if (profit <= 0)
        return 0;
    const base = Math.floor(profit / 400) + 1;
    return Math.min(8, base + Math.floor(riskLevel / 2));
}
function getCurrentPrices(state) {
    return state.marketPrices[(0, locations_1.getPlayerAreaKey)(state.player)];
}
function buyCommodity(state, commodityId, quantity) {
    if (quantity <= 0 || state.player.isGameOver) {
        return state;
    }
    const commodity = commodities_1.COMMODITY_MAP[commodityId];
    const price = getCurrentPrices(state)?.[commodityId];
    if (!commodity || !price) {
        return (0, messages_1.withMessage)(state, 'Cannot buy — price unavailable.');
    }
    const totalCost = price * quantity;
    if (state.player.cash < totalCost) {
        return (0, messages_1.withMessage)(state, `Not enough cash. Need $${totalCost}, have $${state.player.cash}.`);
    }
    const currentCount = getInventoryCount(state.player.inventory);
    if (currentCount + quantity > state.player.inventoryCapacity) {
        const space = state.player.inventoryCapacity - currentCount;
        return (0, messages_1.withMessage)(state, `Inventory full (${currentCount}/${state.player.inventoryCapacity}). Only ${space} slots left.`);
    }
    const inventory = state.player.inventory.map((item) => {
        if (item.commodityId !== commodityId) {
            return item;
        }
        const totalQty = item.quantity + quantity;
        return {
            ...item,
            quantity: totalQty,
            avgCost: Math.round((item.avgCost * item.quantity + price * quantity) / totalQty),
        };
    });
    const hasItem = state.player.inventory.some((i) => i.commodityId === commodityId);
    const nextInventory = hasItem
        ? inventory
        : [...inventory, { commodityId, quantity, avgCost: price }];
    const heatGain = heatFromTrade(state, commodity.riskLevel, quantity, true);
    return finalizeAction((0, messages_1.withMessage)({
        ...state,
        player: checkGameOver({
            ...state.player,
            cash: state.player.cash - totalCost,
            heat: (0, random_1.clamp)(state.player.heat + heatGain, 0, 100),
            inventory: nextInventory,
        }),
    }, `Bought ${quantity} ${commodity.name} @ $${price}/ea ($${totalCost} total). Heat +${heatGain}.`));
}
function sellCommodity(state, commodityId, quantity) {
    if (quantity <= 0 || state.player.isGameOver) {
        return state;
    }
    const commodity = commodities_1.COMMODITY_MAP[commodityId];
    const existing = getInventoryItem(state.player.inventory, commodityId);
    if (!existing || existing.quantity < quantity) {
        const have = existing?.quantity ?? 0;
        return (0, messages_1.withMessage)(state, `Cannot sell ${quantity} ${commodity?.name ?? 'item'} — you only have ${have}.`);
    }
    const price = getCurrentPrices(state)?.[commodityId];
    if (!price || !commodity) {
        return (0, messages_1.withMessage)(state, 'Cannot sell — price unavailable.');
    }
    const dealerMult = 1 + (0, crewBonuses_1.getDealerSaleBonus)(state);
    const totalGain = Math.round(price * quantity * dealerMult);
    const profit = (price - existing.avgCost) * quantity;
    const heatGain = heatFromTrade(state, commodity.riskLevel, quantity, false);
    const repGain = reputationFromProfit(profit, commodity.riskLevel);
    const inventory = state.player.inventory
        .map((item) => item.commodityId === commodityId
        ? { ...item, quantity: item.quantity - quantity }
        : item)
        .filter((item) => item.quantity > 0);
    const profitLabel = profit >= 0 ? `Profit $${profit}` : `Loss $${Math.abs(profit)}`;
    const repLabel = repGain > 0 ? ` Rep +${repGain}.` : '';
    let updated = (0, messages_1.withMessage)({
        ...state,
        player: checkGameOver((0, money_1.addDirtyMoney)({
            ...state.player,
            heat: (0, random_1.clamp)(state.player.heat + heatGain, 0, 100),
            reputation: (0, random_1.clamp)(state.player.reputation + repGain, 0, 100),
            inventory,
        }, totalGain)),
    }, `Sold ${quantity} ${commodity.name} @ $${price}/ea ($${totalGain} total, dirty). ${profitLabel}.${repLabel} Heat +${heatGain}.`);
    if (profit > 0) {
        updated = (0, progression_1.addLifetimeProfit)(updated, profit);
    }
    if (!updated.player.isGameOver &&
        (0, combat_1.getInventoryLoadFactor)(updated) > 0.4 &&
        Math.random() < 0.1) {
        updated = tryRollEncounterOrLegacy(updated, 'marketAction', 'day_advance');
    }
    return finalizeAction(updated, {
        kind: 'sell',
        quantity,
        profit,
        commodityId,
    });
}
/** Move to another area in the same city — does NOT advance the day. */
function travelToArea(state, areaId) {
    if (state.player.isGameOver) {
        return state;
    }
    if (areaId === state.player.currentAreaId) {
        return (0, messages_1.withMessage)(state, 'You are already in this area.');
    }
    const area = locations_1.AREA_MAP[areaId];
    if (!area) {
        return (0, messages_1.withMessage)(state, 'Unknown area.');
    }
    if (!(0, territory_1.ensureAreaBelongsToCity)(state.player.currentCityId, areaId)) {
        return (0, messages_1.withMessage)(state, 'That area is not in your current city.');
    }
    const areaKey = (0, locations_1.getAreaKey)(state.player.currentCityId, areaId);
    const block = (0, worldEvents_1.isTravelBlocked)(state, areaKey);
    if (block.blocked) {
        return (0, messages_1.withMessage)(state, block.reason ?? 'Travel blocked.');
    }
    if (state.player.cash < area.travelCost) {
        return (0, messages_1.withMessage)(state, `Cannot travel — need $${area.travelCost}, have $${state.player.cash}.`);
    }
    const travelHeatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(state, areaKey);
    let updated = {
        ...state,
        player: {
            ...state.player,
            cash: state.player.cash - area.travelCost,
            currentAreaId: areaId,
            heat: (0, random_1.clamp)(state.player.heat +
                (0, worldEvents_1.scalePositiveHeat)(Math.round(2 * area.riskModifier), travelHeatMult), 0, 100),
        },
    };
    updated = refreshAreaMarket(updated, state.player.currentCityId, areaId);
    const owner = (0, territory_1.getAreaOwnership)(updated, state.player.currentCityId, areaId);
    const flavor = (0, territory_1.rollAreaFlavorMessage)(updated, area.name, owner);
    updated = (0, messages_1.withMessage)(updated, flavor ??
        `Moved to ${area.name} (-$${area.travelCost}). Day unchanged.`);
    updated = {
        ...updated,
        localHeatByCity: (0, territory_1.adjustLocalHeat)(updated, state.player.currentCityId, 1),
    };
    if (!updated.player.isGameOver) {
        updated = tryRollEncounterOrLegacy(updated, 'areaTravel', 'travel');
        updated = (0, crewSystem_1.applyCrewEncounterRisk)(updated);
    }
    updated = refreshDealsAtLocation(updated);
    return finalizeAction(updated);
}
/** Move to another city — advances the day. */
function travelToCity(state, cityId, areaId) {
    const destAreaId = areaId ?? (0, locations_1.getDefaultAreaForCity)(cityId)?.id ?? `${cityId}_downtown`;
    if (state.player.isGameOver) {
        return state;
    }
    if (cityId === state.player.currentCityId && destAreaId === state.player.currentAreaId) {
        return (0, messages_1.withMessage)(state, 'You are already here.');
    }
    const city = locations_1.CITY_MAP[cityId];
    const area = locations_1.AREA_MAP[destAreaId] ?? (0, locations_1.getAreasForCity)(cityId).find((a) => a.id === destAreaId);
    if (!city || !area) {
        return (0, messages_1.withMessage)(state, 'Unknown destination.');
    }
    const areaKey = (0, locations_1.getAreaKey)(cityId, destAreaId);
    const block = (0, worldEvents_1.isTravelBlocked)(state, areaKey);
    if (block.blocked) {
        return (0, messages_1.withMessage)(state, block.reason ?? 'Travel blocked.');
    }
    if (!(0, progression_1.isCityUnlocked)(state, cityId)) {
        return (0, messages_1.withMessage)(state, (0, progression_1.getCityUnlockHint)(cityId));
    }
    const intraAreaCost = cityId === state.player.currentCityId ? area.travelCost : 0;
    const totalCost = city.travelCost + intraAreaCost;
    if (state.player.cash < totalCost) {
        return (0, messages_1.withMessage)(state, `Cannot travel to ${city.name} — need $${totalCost}, have $${state.player.cash}.`);
    }
    const travelHeatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(state, areaKey);
    let updated = {
        ...state,
        player: {
            ...state.player,
            cash: state.player.cash - totalCost,
            currentCityId: cityId,
            currentAreaId: destAreaId,
            heat: (0, random_1.clamp)(state.player.heat +
                (0, worldEvents_1.scalePositiveHeat)(Math.round(5 * city.riskModifier * area.riskModifier), travelHeatMult), 0, 100),
        },
    };
    updated = advanceDayState(updated, `Traveled to ${(0, locations_1.getAreaLabel)(cityId, destAreaId)} (-$${totalCost}). Day advances.`);
    if (!updated.player.isGameOver) {
        updated = tryRollEncounterOrLegacy(updated, 'cityTravel', 'travel');
    }
    const localHeat = { ...(updated.localHeatByCity ?? {}) };
    if (cityId !== state.player.currentCityId) {
        const prevLocal = localHeat[state.player.currentCityId] ?? updated.player.heat;
        localHeat[state.player.currentCityId] = Math.max(0, prevLocal - 8);
        localHeat[cityId] = (localHeat[cityId] ?? 0) + 4;
        updated = { ...updated, localHeatByCity: localHeat };
    }
    updated = refreshDealsAtLocation(updated);
    return finalizeAction(updated, { kind: 'travel_city', cityId });
}
function stayHere(state) {
    if (state.player.isGameOver) {
        return state;
    }
    const { currentCityId, currentAreaId } = state.player;
    let updated = refreshAreaMarket(state, currentCityId, currentAreaId);
    updated = (0, messages_1.withMessage)(updated, `Staying put in ${locations_1.AREA_MAP[currentAreaId]?.name ?? 'area'}. Local prices refreshed. Day unchanged.`);
    if (!updated.player.isGameOver) {
        updated = tryRollEncounterOrLegacy(updated, 'stay', 'day_advance');
        updated = (0, crewSystem_1.applyCrewEncounterRisk)(updated);
    }
    updated = refreshDealsAtLocation(updated);
    return finalizeAction(updated);
}
/** @deprecated Use travelToArea or travelToCity */
function travelToLocation(state, locationId) {
    return travelToArea(state, locationId);
}
function payDebt(state, amount) {
    if (amount <= 0 || state.player.isGameOver) {
        return state;
    }
    if (state.player.debt <= 0) {
        return (0, messages_1.withMessage)(state, 'You have no debt. Clean slate.');
    }
    const payment = Math.min(amount, state.player.cash, state.player.debt);
    if (payment <= 0) {
        return (0, messages_1.withMessage)(state, 'No cash available to pay debt.');
    }
    const remaining = state.player.debt - payment;
    const repGain = payment >= 1000 ? 3 : payment >= 500 ? 2 : 1;
    return finalizeAction((0, messages_1.withMessage)({
        ...state,
        player: {
            ...state.player,
            cash: state.player.cash - payment,
            debt: remaining,
            reputation: (0, random_1.clamp)(state.player.reputation + repGain, 0, 100),
        },
    }, `Paid $${payment} toward debt. Remaining: $${remaining}. Rep +${repGain}.`), { kind: 'pay_debt', amount: payment });
}
function borrowMoney(state, amount) {
    if (state.player.isGameOver) {
        return state;
    }
    if (!BORROW_AMOUNTS.includes(amount)) {
        return (0, messages_1.withMessage)(state, 'Invalid borrow amount.');
    }
    if (state.player.debt + amount > MAX_DEBT) {
        return (0, messages_1.withMessage)(state, `Loan shark won't go above $${MAX_DEBT} total debt. Current: $${state.player.debt}.`);
    }
    const repPenalty = amount >= 5000 ? 2 : 1;
    return (0, messages_1.withMessage)({
        ...state,
        player: {
            ...state.player,
            cash: state.player.cash + amount,
            debt: state.player.debt + amount,
            heat: (0, random_1.clamp)(state.player.heat + 8, 0, 100),
            reputation: (0, random_1.clamp)(state.player.reputation - repPenalty, 0, 100),
        },
    }, `Borrowed $${amount}. Debt now $${state.player.debt + amount}. Heat +8. Rep -${repPenalty}.`);
}
function restDay(state) {
    if (state.player.isGameOver) {
        return state;
    }
    const area = locations_1.AREA_MAP[state.player.currentAreaId];
    const healCost = area?.healCost ?? 200;
    if (state.player.health >= 100) {
        return (0, messages_1.withMessage)(state, 'You feel fine. No need to rest.');
    }
    if (state.player.cash < healCost) {
        return (0, messages_1.withMessage)(state, `Cannot rest — need $${healCost} for a safe hideout and supplies.`);
    }
    const healAmount = Math.min(100 - state.player.health, 30);
    let updated = {
        ...state,
        player: {
            ...state.player,
            cash: state.player.cash - healCost,
            health: (0, random_1.clamp)(state.player.health + healAmount, 0, 100),
            heat: (0, random_1.clamp)(state.player.heat - 6, 0, 100),
        },
    };
    updated = advanceDayState(updated, `Rested at a motel (-$${healCost}). Health +${healAmount}. Heat -6. Day advances.`);
    if (!updated.player.isGameOver) {
        updated = (0, events_1.rollRandomEvent)(updated, 'rest');
        updated = { ...updated, player: checkGameOver(updated.player) };
    }
    return finalizeAction(updated);
}
function chooseEventOption(state, choiceId) {
    const normalized = (0, stateUtils_1.normalizeGameState)(state);
    if (!normalized.pendingEvent) {
        return normalized;
    }
    if ((0, encounterSystem_1.isEncounterChoice)(choiceId)) {
        return (0, encounterResolver_1.resolveEncounterChoice)(normalized, choiceId);
    }
    return finalizeAction((0, eventResolver_1.resolveEventChoice)(normalized, choiceId));
}
function getMaxBorrow(player) {
    return Math.max(0, MAX_DEBT - player.debt);
}
