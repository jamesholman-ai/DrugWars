"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEventChoice = resolveEventChoice;
exports.applyDelta = applyDelta;
const commodities_1 = require("../data/commodities");
const locations_1 = require("../data/locations");
const random_1 = require("../utils/random");
const messages_1 = require("./messages");
const engineHelpers_1 = require("./engineHelpers");
const stateUtils_1 = require("./stateUtils");
const npcSystem_1 = require("./npcSystem");
const worldEvents_1 = require("./worldEvents");
function getInventoryCount(inventory) {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
}
function applyDelta(state, delta, summary) {
    const base = (0, stateUtils_1.normalizeGameState)(state);
    let player = { ...base.player, inventory: base.player.inventory.map((i) => ({ ...i })) };
    let marketPrices = {
        ...base.marketPrices,
        ...Object.fromEntries(Object.entries(base.marketPrices).map(([loc, prices]) => [loc, { ...prices }])),
    };
    const memoryFlags = { ...base.memoryFlags };
    const npcRelations = { ...base.npcRelations };
    if (delta.cash)
        player.cash = Math.max(0, player.cash + delta.cash);
    if (delta.health)
        player.health = (0, random_1.clamp)(player.health + delta.health, 0, 100);
    if (delta.heat) {
        const heatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(base, base.player.currentLocation);
        player.heat = (0, random_1.clamp)(player.heat + (0, worldEvents_1.scalePositiveHeat)(delta.heat, heatMult), 0, 100);
    }
    if (delta.reputation)
        player.reputation = (0, random_1.clamp)(player.reputation + delta.reputation, 0, 100);
    if (delta.debt)
        player.debt = Math.max(0, player.debt + delta.debt);
    if (delta.inventoryRemoveQty && player.inventory.length > 0) {
        const idx = (0, random_1.randomInt)(0, player.inventory.length - 1);
        const item = player.inventory[idx];
        const remove = Math.min(delta.inventoryRemoveQty, item.quantity);
        const inventory = player.inventory
            .map((inv, i) => i === idx ? { ...inv, quantity: inv.quantity - remove } : inv)
            .filter((inv) => inv.quantity > 0);
        player = { ...player, inventory };
    }
    if (delta.inventoryAdd) {
        const { commodityId, quantity, avgCost } = delta.inventoryAdd;
        const used = getInventoryCount(player.inventory);
        const space = player.inventoryCapacity - used;
        const addQty = Math.min(quantity, space);
        if (addQty > 0) {
            const existingIdx = player.inventory.findIndex((i) => i.commodityId === commodityId);
            if (existingIdx >= 0) {
                const item = player.inventory[existingIdx];
                const total = item.quantity + addQty;
                player.inventory = player.inventory.map((inv, idx) => idx === existingIdx
                    ? {
                        ...inv,
                        quantity: total,
                        avgCost: Math.round((item.avgCost * item.quantity + avgCost * addQty) / total),
                    }
                    : inv);
            }
            else {
                player.inventory = [
                    ...player.inventory,
                    { commodityId, quantity: addQty, avgCost },
                ];
            }
        }
    }
    if (delta.applyPriceMultiplier) {
        const loc = player.currentLocation;
        const { commodityId, multiplier } = delta.applyPriceMultiplier;
        if (marketPrices[loc]?.[commodityId]) {
            marketPrices = {
                ...marketPrices,
                [loc]: {
                    ...marketPrices[loc],
                    [commodityId]: Math.max(1, Math.round(marketPrices[loc][commodityId] * multiplier)),
                },
            };
        }
    }
    if (delta.memoryFlag) {
        memoryFlags[delta.memoryFlag] = true;
    }
    const eventNpcId = base.pendingEvent?.npc?.id ?? base.pendingEvent?.context.npcId;
    if (eventNpcId) {
        const prev = npcRelations[eventNpcId] ?? (0, npcSystem_1.createDefaultRelation)(eventNpcId);
        const attitude = delta.npcAttitudeDelta
            ? (0, random_1.clamp)(prev.attitude + delta.npcAttitudeDelta, -100, 100)
            : prev.attitude;
        const trust = delta.npcTrustDelta
            ? (0, npcSystem_1.applyTrustDelta)(prev.trust, delta.npcTrustDelta)
            : prev.trust;
        npcRelations[eventNpcId] = {
            attitude,
            trust,
            encounters: prev.encounters + 1,
            lastSeenDay: player.day,
        };
    }
    player = (0, engineHelpers_1.checkGameOverPlayer)(player);
    return (0, messages_1.withMessage)({
        ...base,
        player,
        marketPrices,
        memoryFlags,
        npcRelations,
        pendingEvent: null,
    }, summary);
}
const CHOICE_RESOLVERS = {
    // Police stop
    police_stop_bribe: (state, event, random) => {
        const bribe = event.context.amount ?? 500;
        if (state.player.cash < bribe) {
            return applyDelta(state, { heat: 15, health: -10 }, `Can't afford bribe. Vance arrests you briefly. Heat +15, Health -10.`);
        }
        return applyDelta(state, { cash: -bribe, heat: -8, memoryFlag: 'bribedCop', npcAttitudeDelta: 10 }, `Paid Vance $${bribe}. Heat -8. He remembers.`);
    },
    police_stop_run: (state) => applyDelta(state, { heat: 18, health: -12, reputation: -3 }, 'You ran. Heat +18, Health -12, Rep -3.'),
    police_stop_cooperate: (state, event) => {
        const rep = state.player.reputation;
        if (rep >= 40) {
            return applyDelta(state, {
                heat: -5,
                reputation: 1,
                memoryFlag: 'helpedCop',
                npcAttitudeDelta: 8,
                npcTrustDelta: 5,
            }, 'Vance lets you go with a warning. Heat -5.');
        }
        const fine = Math.min(event.context.amount ?? 200, state.player.cash);
        return applyDelta(state, { cash: -fine, heat: 5, memoryFlag: 'helpedCop', npcAttitudeDelta: 5 }, `Fined $${fine}. Heat +5. Vance notes your cooperation.`);
    },
    // Police raid
    police_raid_ditch: (state, event) => {
        const qty = event.context.quantity ?? 5;
        if (state.player.inventory.length === 0) {
            return applyDelta(state, { heat: -8 }, 'Raid hit — no stash to ditch. Heat -8.');
        }
        return applyDelta(state, { inventoryRemoveQty: qty, heat: -12 }, `Ditched ${qty} units to escape raid. Heat -12.`);
    },
    police_raid_hide: (state, event) => {
        const cost = event.context.amount ?? 300;
        const paid = Math.min(cost, state.player.cash);
        return applyDelta(state, { cash: -paid, heat: -5 }, `Paid $${paid} to hide. Heat -5.`);
    },
    police_raid_stand: (state) => applyDelta(state, { health: -20, heat: 25, reputation: 5 }, 'Stood ground. Health -20, Heat +25, Rep +5 for guts.'),
    // Rival
    rival_fight: (state, event, random) => {
        const win = state.player.reputation >= 35 && random() > 0.4;
        if (win) {
            return applyDelta(state, { reputation: 6, heat: 8, health: -8 }, 'Won the fight. Rep +6, Heat +8, Health -8.');
        }
        const loss = Math.min(event.context.amount ?? 400, state.player.cash);
        return applyDelta(state, { cash: -loss, health: -15, heat: 10 }, `Lost the fight. -$${loss}, Health -15, Heat +10.`);
    },
    rival_pay: (state, event) => {
        const tribute = event.context.amount ?? 350;
        const paid = Math.min(tribute, state.player.cash);
        return applyDelta(state, { cash: -paid, heat: -5, npcAttitudeDelta: 15 }, `Paid Razor $${paid}. Heat -5. Truce held.`);
    },
    rival_snitch: (state) => applyDelta(state, { heat: -10, reputation: -8, memoryFlag: 'snitchedOnRival', npcAttitudeDelta: -40 }, 'Snitched on Razor to the cops. Heat -10, Rep -8. He won\'t forget.'),
    // Robbery
    robbery_fight: (state, event, random) => {
        if (random() > 0.45) {
            return applyDelta(state, { reputation: 3, health: -10, heat: 6 }, 'Fought off robbers. Rep +3, Health -10.');
        }
        const loss = Math.min(event.context.amount ?? 500, state.player.cash);
        return applyDelta(state, { cash: -loss, health: -18 }, `Mugged despite fighting. -$${loss}, Health -18.`);
    },
    robbery_pay: (state, event) => {
        const loss = Math.min(event.context.amount ?? 400, state.player.cash);
        return applyDelta(state, { cash: -loss, heat: 3 }, `Handed over $${loss}. Heat +3.`);
    },
    robbery_bluff: (state) => {
        if (state.player.reputation >= 50) {
            return applyDelta(state, { reputation: 2, heat: 4 }, 'They backed off. Rep +2, Heat +4.');
        }
        return applyDelta(state, { health: -12, cash: -200, heat: 8 }, 'Bluff failed. Health -12, -$200.');
    },
    // Supplier
    supplier_buy: (state, event) => {
        const cost = event.context.amount ?? 600;
        const qty = event.context.quantity ?? 8;
        const commodityId = event.context.commodityId ?? 'flower';
        if (state.player.cash < cost) {
            return applyDelta(state, { npcAttitudeDelta: -10, memoryFlag: 'stiffedSupplier' }, 'Couldn\'t afford bulk deal. Silk is annoyed.');
        }
        return applyDelta(state, {
            cash: -cost,
            inventoryAdd: { commodityId, quantity: qty, avgCost: Math.round(cost / qty) },
            heat: 4,
            npcAttitudeDelta: 15,
        }, `Bought ${qty} ${commodities_1.COMMODITY_MAP[commodityId]?.name} at discount for $${cost}.`);
    },
    supplier_sample: (state, event) => {
        const commodityId = event.context.commodityId ?? 'pills';
        return applyDelta(state, { inventoryAdd: { commodityId, quantity: 2, avgCost: 0 }, npcAttitudeDelta: 5 }, `Silk gave you 2 free ${commodities_1.COMMODITY_MAP[commodityId]?.name}.`);
    },
    supplier_decline: (state) => applyDelta(state, { npcAttitudeDelta: -5 }, "Declined Silk's offer. No hard feelings. Maybe."),
    // Price spike
    spike_sell: (state, event) => {
        const commodityId = event.context.commodityId ?? 'flower';
        const item = state.player.inventory.find((i) => i.commodityId === commodityId);
        if (!item || item.quantity < 1) {
            return applyDelta(state, {}, 'Nothing to sell before the spike. Opportunity missed.');
        }
        const price = state.marketPrices[state.player.currentLocation]?.[commodityId] ?? 0;
        if (price <= 0) {
            return applyDelta(state, {}, 'No market price for spike sale.');
        }
        const mult = event.context.priceMultiplier ?? 1.6;
        const sellPrice = Math.round(price * mult);
        const qty = Math.min(item.quantity, event.context.quantity ?? 5);
        const gain = sellPrice * qty;
        const inventory = state.player.inventory
            .map((i) => (i.commodityId === commodityId ? { ...i, quantity: i.quantity - qty } : i))
            .filter((i) => i.quantity > 0);
        return applyDelta({ ...state, player: { ...state.player, inventory } }, { cash: gain, heat: 3, reputation: 2 }, `Sold ${qty} ${commodities_1.COMMODITY_MAP[commodityId]?.name} on spike for $${gain}.`);
    },
    spike_hold: (state, event) => {
        const commodityId = event.context.commodityId ?? 'flower';
        return applyDelta(state, { applyPriceMultiplier: { commodityId, multiplier: event.context.priceMultiplier ?? 1.5 } }, `${commodities_1.COMMODITY_MAP[commodityId]?.name} prices spiked locally. Sell while hot.`);
    },
    spike_rumor: (state) => applyDelta(state, { reputation: 4, heat: 2 }, 'Spread the spike rumor. Rep +4, Heat +2.'),
    // Price crash
    crash_buy: (state, event) => {
        const commodityId = event.context.commodityId ?? 'powder';
        const cost = event.context.amount ?? 800;
        const qty = event.context.quantity ?? 5;
        if (state.player.cash < cost) {
            return applyDelta(state, {}, `Need $${cost} to buy the dip. Pass.`);
        }
        return applyDelta(state, {
            cash: -cost,
            inventoryAdd: { commodityId, quantity: qty, avgCost: Math.round(cost / qty) },
            heat: 2,
        }, `Bought ${qty} ${commodities_1.COMMODITY_MAP[commodityId]?.name} on crash for $${cost}.`);
    },
    crash_ignore: (state) => applyDelta(state, {}, 'Ignored the crash. Prices stay depressed here.'),
    crash_warn: (state, event) => {
        const commodityId = event.context.commodityId ?? 'powder';
        return applyDelta(state, {
            reputation: 3,
            applyPriceMultiplier: { commodityId, multiplier: event.context.priceMultiplier ?? 0.7 },
        }, `Warned contacts about ${commodities_1.COMMODITY_MAP[commodityId]?.name} crash. Rep +3.`);
    },
    // Informant
    informant_pay: (state, event) => {
        const cost = event.context.amount ?? 250;
        if (state.player.cash < cost) {
            return applyDelta(state, { memoryFlag: 'ignoredInformant', npcAttitudeDelta: -15 }, 'Couldn\'t pay Whisper. Tip lost.');
        }
        const commodityId = event.context.commodityId ?? 'rocks';
        const loc = event.context.locationId ?? state.player.currentLocation;
        const locName = locations_1.LOCATION_MAP[loc]?.name ?? loc;
        return applyDelta(state, { cash: -cost, reputation: 2, npcAttitudeDelta: 10 }, `Paid Whisper $${cost}. Tip: cheap ${commodities_1.COMMODITY_MAP[commodityId]?.name} in ${locName}.`);
    },
    informant_trade: (state) => {
        const qty = state.player.inventory.reduce((s, i) => s + i.quantity, 0);
        if (qty < 3) {
            return applyDelta(state, { npcAttitudeDelta: -5 }, 'Nothing to trade. Whisper walks.');
        }
        return applyDelta(state, { inventoryRemoveQty: 3, heat: -8, reputation: 1 }, 'Traded 3 units for intel. Heat -8.');
    },
    informant_ignore: (state) => applyDelta(state, { memoryFlag: 'ignoredInformant', npcAttitudeDelta: -20 }, 'Ignored Whisper. They remember.'),
    // Bulk buyer
    buyer_sell: (state, event) => {
        const commodityId = event.context.commodityId ?? 'flower';
        const item = state.player.inventory.find((i) => i.commodityId === commodityId);
        const qty = event.context.quantity ?? 10;
        if (!item || item.quantity < qty) {
            return applyDelta(state, {}, `Need ${qty} ${commodities_1.COMMODITY_MAP[commodityId]?.name} for bulk deal.`);
        }
        const premium = event.context.amount ?? 1200;
        const inventory = state.player.inventory
            .map((i) => (i.commodityId === commodityId ? { ...i, quantity: i.quantity - qty } : i))
            .filter((i) => i.quantity > 0);
        return applyDelta({ ...state, player: { ...state.player, inventory } }, { cash: premium, heat: 5, reputation: 3, memoryFlag: 'soldToBuyer', npcAttitudeDelta: 12 }, `Sold ${qty} ${commodities_1.COMMODITY_MAP[commodityId]?.name} to Chip for $${premium}.`);
    },
    buyer_negotiate: (state, event, random) => {
        const commodityId = event.context.commodityId ?? 'flower';
        const item = state.player.inventory.find((i) => i.commodityId === commodityId);
        const qty = event.context.quantity ?? 10;
        if (!item || item.quantity < qty) {
            return applyDelta(state, {}, 'Not enough product to negotiate.');
        }
        const success = state.player.reputation >= 30 && random() > 0.35;
        const payout = success ? (event.context.amount ?? 1200) + 300 : (event.context.amount ?? 1200) - 200;
        const inventory = state.player.inventory
            .map((i) => (i.commodityId === commodityId ? { ...i, quantity: i.quantity - qty } : i))
            .filter((i) => i.quantity > 0);
        return applyDelta({ ...state, player: { ...state.player, inventory } }, { cash: payout, reputation: success ? 4 : -1, memoryFlag: 'soldToBuyer' }, success
            ? `Negotiated $${payout} for bulk sale. Rep +4.`
            : `Chip lowballed you. Took $${payout}. Rep -1.`);
    },
    buyer_decline: (state) => applyDelta(state, { npcAttitudeDelta: -8 }, "Declined Chip's bulk offer."),
    // Health emergency
    health_clinic: (state, event) => {
        const cost = event.context.amount ?? 350;
        const paid = Math.min(cost, state.player.cash);
        if (paid < cost) {
            return applyDelta(state, { health: -15 }, 'Couldn\'t afford clinic. Health -15.');
        }
        return applyDelta(state, { cash: -paid, health: 25 }, `Clinic visit: -$${paid}, Health +25.`);
    },
    health_tough: (state) => applyDelta(state, { health: -18, reputation: 2 }, 'Toughed it out. Health -18, Rep +2 for grit.'),
    health_favor: (state, event) => {
        const added = event.context.secondaryAmount ?? 800;
        return applyDelta(state, { debt: added, health: 20 }, `Called in favor. Health +20, Debt +$${added}.`);
    },
    // Debt collector
    collector_pay: (state, event) => {
        const pay = Math.min(event.context.amount ?? 500, state.player.cash, state.player.debt);
        if (pay <= 0) {
            return applyDelta(state, { health: -10, heat: 12 }, 'No cash. Bruno sends a message. Health -10, Heat +12.');
        }
        return applyDelta(state, { cash: -pay, debt: -pay, heat: -5, memoryFlag: 'paidCollector', npcAttitudeDelta: 10 }, `Paid Bruno $${pay}. Heat -5. Breathing room.`);
    },
    collector_promise: (state, event) => {
        const added = event.context.secondaryAmount ?? 400;
        return applyDelta(state, { debt: added, heat: 8, npcAttitudeDelta: -5 }, `Promised payment. Debt +$${added} interest piled on. Heat +8.`);
    },
    collector_intimidate: (state) => {
        if (state.player.reputation >= 45) {
            return applyDelta(state, { reputation: 3, heat: 15, npcAttitudeDelta: -25 }, 'Bruno backs off… for now. Rep +3, Heat +15.');
        }
        return applyDelta(state, { health: -20, cash: -300, heat: 10 }, 'Bad idea. Health -20, -$300, Heat +10.');
    },
};
function resolveEventChoice(state, choiceId, random = Math.random) {
    const event = (0, stateUtils_1.normalizeGameState)(state).pendingEvent;
    if (!event)
        return state;
    const resolver = CHOICE_RESOLVERS[choiceId];
    if (!resolver) {
        return applyDelta(state, {}, `Event resolved: ${event.title}.`);
    }
    return resolver((0, stateUtils_1.normalizeGameState)(state), event, random);
}
