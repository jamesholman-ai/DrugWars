"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BORROW_AMOUNTS = exports.resolveEventChoice = exports.getInventoryUsed = exports.getNetWorth = void 0;
exports.generateMarketPrices = generateMarketPrices;
exports.createInitialPlayerState = createInitialPlayerState;
exports.createInitialGameState = createInitialGameState;
exports.buyCommodity = buyCommodity;
exports.sellCommodity = sellCommodity;
exports.travelToLocation = travelToLocation;
exports.payDebt = payDebt;
exports.borrowMoney = borrowMoney;
exports.restDay = restDay;
exports.chooseEventOption = chooseEventOption;
exports.getMaxBorrow = getMaxBorrow;
const game_1 = require("../types/game");
const commodities_1 = require("../data/commodities");
const locations_1 = require("../data/locations");
const events_1 = require("../data/events");
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
const STARTING_CASH = 2000;
const STARTING_DEBT = 5500;
const DAILY_DEBT_INTEREST = 0.03;
const HEAT_DECAY = 2;
const MAX_DEBT = 50000;
const BORROW_AMOUNTS = [1000, 2500, 5000];
exports.BORROW_AMOUNTS = BORROW_AMOUNTS;
function generateMarketPrices(activeEvents = []) {
    const prices = {};
    for (const location of locations_1.LOCATIONS) {
        prices[location.id] = {};
        for (const commodity of commodities_1.COMMODITIES) {
            prices[location.id][commodity.id] = (0, random_1.generateCommodityPrice)(commodity, location);
        }
    }
    return (0, worldEvents_1.applyWorldEventsToPrices)(prices, activeEvents);
}
function createInitialPlayerState() {
    return {
        cash: STARTING_CASH,
        debt: STARTING_DEBT,
        health: 100,
        heat: 10,
        reputation: 20,
        day: 1,
        currentLocation: locations_1.STARTING_LOCATION_ID,
        inventoryCapacity: progression_2.BASE_INVENTORY_CAPACITY,
        inventory: [],
        isGameOver: false,
    };
}
function createInitialGameState() {
    const location = locations_1.LOCATION_MAP[locations_1.STARTING_LOCATION_ID];
    const state = {
        player: createInitialPlayerState(),
        marketPrices: generateMarketPrices(),
        pendingEvent: null,
        memoryFlags: (0, game_1.createEmptyMemoryFlags)(),
        npcRelations: {},
        activeWorldEvents: [],
        progression: (0, progression_1.createInitialProgression)(),
        lastMessage: `Day 1 — You arrive in ${location.name} with $${STARTING_CASH} and $${STARTING_DEBT} debt. Hit the market.`,
        messageLog: [
            `Day 1 — New run started in ${location.name}.`,
            `Loan shark expects $${STARTING_DEBT}. Interest accrues daily.`,
        ],
    };
    return (0, progression_1.syncProgression)(state);
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
function finalizeAction(state) {
    return (0, progression_1.applyProgressionAfterAction)(state);
}
/** Apply end-of-day upkeep: interest, heat decay, passive health drain, advance day. */
function applyDailyUpkeep(player, extraHeatDecay = 0) {
    const debtInterest = Math.floor(player.debt * DAILY_DEBT_INTEREST);
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
    const extraHeatDecay = (0, progression_1.getExtraHeatDecayAtLocation)(state.progression, state.player.currentLocation);
    let updated = {
        ...state,
        player: applyDailyUpkeep(state.player, extraHeatDecay),
    };
    updated = (0, worldEvents_1.tickWorldEventsOnDayAdvance)(updated, random);
    updated = {
        ...updated,
        marketPrices: generateMarketPrices(updated.activeWorldEvents),
    };
    const messages = [
        dayMessage,
        interest > 0
            ? `Day ${updated.player.day}: Debt interest +$${interest}. New prices citywide.`
            : `Day ${updated.player.day}: New prices citywide.`,
    ];
    updated = (0, messages_1.withMessages)(updated, messages);
    updated = { ...updated, player: checkGameOver(updated.player) };
    return updated;
}
function heatFromTrade(state, riskLevel, quantity, buying) {
    const multiplier = buying ? 0.6 : 0.4;
    const base = Math.max(1, Math.round(riskLevel * quantity * multiplier));
    const heatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(state, state.player.currentLocation);
    return (0, worldEvents_1.scalePositiveHeat)(base, heatMult);
}
function reputationFromProfit(profit, riskLevel) {
    if (profit <= 0)
        return 0;
    const base = Math.floor(profit / 400) + 1;
    return Math.min(8, base + Math.floor(riskLevel / 2));
}
function buyCommodity(state, commodityId, quantity) {
    if (quantity <= 0 || state.player.isGameOver) {
        return state;
    }
    const commodity = commodities_1.COMMODITY_MAP[commodityId];
    const price = state.marketPrices[state.player.currentLocation]?.[commodityId];
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
    const price = state.marketPrices[state.player.currentLocation]?.[commodityId];
    if (!price || !commodity) {
        return (0, messages_1.withMessage)(state, 'Cannot sell — price unavailable.');
    }
    const totalGain = price * quantity;
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
        player: checkGameOver({
            ...state.player,
            cash: state.player.cash + totalGain,
            heat: (0, random_1.clamp)(state.player.heat + heatGain, 0, 100),
            reputation: (0, random_1.clamp)(state.player.reputation + repGain, 0, 100),
            inventory,
        }),
    }, `Sold ${quantity} ${commodity.name} @ $${price}/ea ($${totalGain} total). ${profitLabel}.${repLabel} Heat +${heatGain}.`);
    if (profit > 0) {
        updated = (0, progression_1.addLifetimeProfit)(updated, profit);
    }
    return finalizeAction(updated);
}
function travelToLocation(state, locationId) {
    if (state.player.isGameOver) {
        return state;
    }
    if (locationId === state.player.currentLocation) {
        return (0, messages_1.withMessage)(state, 'You are already here.');
    }
    const location = locations_1.LOCATION_MAP[locationId];
    if (!location) {
        return (0, messages_1.withMessage)(state, 'Unknown destination.');
    }
    const block = (0, worldEvents_1.isTravelBlocked)(state, locationId);
    if (block.blocked) {
        return (0, messages_1.withMessage)(state, block.reason ?? 'Travel blocked.');
    }
    if (!(0, progression_1.isLocationUnlocked)(state, locationId)) {
        return (0, messages_1.withMessage)(state, (0, progression_1.getLocationUnlockHint)(locationId));
    }
    if (state.player.cash < location.travelCost) {
        return (0, messages_1.withMessage)(state, `Cannot travel to ${location.name} — need $${location.travelCost}, have $${state.player.cash}.`);
    }
    const travelHeatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(state, locationId);
    let updated = {
        ...state,
        player: {
            ...state.player,
            cash: state.player.cash - location.travelCost,
            currentLocation: locationId,
            heat: (0, random_1.clamp)(state.player.heat +
                (0, worldEvents_1.scalePositiveHeat)(Math.round(4 * location.riskModifier), travelHeatMult), 0, 100),
        },
    };
    updated = advanceDayState(updated, `Traveled to ${location.name} (-$${location.travelCost}). Day advances.`);
    if (!updated.player.isGameOver) {
        updated = (0, events_1.rollRandomEvent)(updated, 'travel');
        updated = { ...updated, player: checkGameOver(updated.player) };
    }
    return finalizeAction(updated);
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
    }, `Paid $${payment} toward debt. Remaining: $${remaining}. Rep +${repGain}.`));
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
    const location = locations_1.LOCATION_MAP[state.player.currentLocation];
    const healCost = location?.healCost ?? 200;
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
    updated = advanceDayState(updated, `Rested for a day (-$${healCost}). Health +${healAmount}. Heat -6.`);
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
    return finalizeAction((0, eventResolver_1.resolveEventChoice)(normalized, choiceId));
}
function getMaxBorrow(player) {
    return Math.max(0, MAX_DEBT - player.debt);
}
