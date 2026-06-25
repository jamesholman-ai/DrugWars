"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEvent = buildEvent;
exports.getAllEventTypes = getAllEventTypes;
const commodities_1 = require("../data/commodities");
const locations_1 = require("../data/locations");
const random_1 = require("../utils/random");
const eventBuilderHelpers_1 = require("./eventBuilderHelpers");
function ctx(partial) {
    return partial;
}
const BUILDERS = {
    police_stop: (state, random) => {
        const bribe = (0, random_1.randomInt)(400, 700);
        const npc = (0, eventBuilderHelpers_1.buildNpcBlock)(state, 'vance', random);
        return {
            id: `evt_${state.player.day}_police_stop`,
            eventType: 'police_stop',
            title: 'Police Stop',
            description: `${npc.name} pulls you over under flickering streetlights. "Routine check." His smile says otherwise.`,
            npc,
            context: ctx({ amount: bribe, npcId: 'vance' }),
            choices: [
                { id: 'police_stop_bribe', label: `Pay bribe ($${bribe})` },
                { id: 'police_stop_run', label: 'Run for it' },
                { id: 'police_stop_cooperate', label: 'Cooperate calmly' },
            ],
        };
    },
    police_raid: (state, random) => ({
        id: `evt_${state.player.day}_police_raid`,
        eventType: 'police_raid',
        title: 'Police Raid',
        description: 'Sirens. Doors splinter. You have seconds to decide what stays and what goes.',
        context: ctx({ quantity: (0, random_1.randomInt)(3, 10), amount: (0, random_1.randomInt)(250, 450) }),
        choices: [
            { id: 'police_raid_ditch', label: 'Ditch stash & flee' },
            { id: 'police_raid_hide', label: 'Pay someone to hide you' },
            { id: 'police_raid_stand', label: 'Stand your ground' },
        ],
    }),
    rival_dealer: (state, random) => {
        const tribute = (0, random_1.randomInt)(300, 500);
        const npc = (0, eventBuilderHelpers_1.buildNpcBlock)(state, 'razor', random);
        return {
            id: `evt_${state.player.day}_rival`,
            eventType: 'rival_dealer',
            title: 'Rival Dealer Encounter',
            description: `${npc.name} blocks the alley. "This is my corner unless you make it worth my while."`,
            npc,
            context: ctx({ amount: tribute, npcId: 'razor' }),
            choices: [
                { id: 'rival_fight', label: 'Fight for the block' },
                { id: 'rival_pay', label: `Pay tribute ($${tribute})` },
                { id: 'rival_snitch', label: 'Snitch to the cops' },
            ],
        };
    },
    robbery_attempt: (state, random) => {
        const demand = (0, random_1.randomInt)(300, 600);
        return {
            id: `evt_${state.player.day}_robbery`,
            eventType: 'robbery_attempt',
            title: 'Robbery Attempt',
            description: `Three figures step from the shadows. "Wallet. Stash. Now. We want about $${demand} worth."`,
            context: ctx({ amount: demand }),
            choices: [
                { id: 'robbery_fight', label: 'Fight back' },
                { id: 'robbery_pay', label: `Hand over cash ($${demand})` },
                { id: 'robbery_bluff', label: 'Bluff — "Wrong person"' },
            ],
        };
    },
    supplier_discount: (state, random) => {
        const commodity = (0, random_1.pickRandom)(commodities_1.COMMODITIES);
        const qty = (0, random_1.randomInt)(6, 12);
        const cost = (0, random_1.randomInt)(400, 900);
        const npc = (0, eventBuilderHelpers_1.buildNpcBlock)(state, 'mama_silk', random);
        return {
            id: `evt_${state.player.day}_supplier`,
            eventType: 'supplier_discount',
            title: 'Supplier Discount',
            description: `${npc.name} waves you into a back room. "Special on ${commodity.name}. ${qty} units for $${cost}."`,
            npc,
            context: ctx({ commodityId: commodity.id, quantity: qty, amount: cost, npcId: 'mama_silk' }),
            choices: [
                { id: 'supplier_buy', label: `Buy bulk ($${cost})` },
                { id: 'supplier_sample', label: 'Take free sample' },
                { id: 'supplier_decline', label: 'Decline politely' },
            ],
        };
    },
    price_spike: (state, random) => {
        const commodity = (0, random_1.pickRandom)(commodities_1.COMMODITIES);
        const mult = 1.4 + random() * 0.4;
        return {
            id: `evt_${state.player.day}_spike`,
            eventType: 'price_spike',
            title: 'Price Spike',
            description: `Word spreads — ${commodity.name} just spiked ${Math.round((mult - 1) * 100)}% uptown. Buyers are frantic.`,
            context: ctx({ commodityId: commodity.id, priceMultiplier: mult, quantity: (0, random_1.randomInt)(3, 8) }),
            choices: [
                { id: 'spike_sell', label: 'Sell into the spike' },
                { id: 'spike_hold', label: 'Hold — ride it higher' },
                { id: 'spike_rumor', label: 'Spread the rumor' },
            ],
        };
    },
    price_crash: (state, random) => {
        const commodity = (0, random_1.pickRandom)(commodities_1.COMMODITIES);
        const mult = 0.5 + random() * 0.25;
        const cost = (0, random_1.randomInt)(500, 1200);
        return {
            id: `evt_${state.player.day}_crash`,
            eventType: 'price_crash',
            title: 'Price Crash',
            description: `A shipment flooded the market. ${commodity.name} prices cratered overnight.`,
            context: ctx({ commodityId: commodity.id, priceMultiplier: mult, amount: cost, quantity: (0, random_1.randomInt)(4, 8) }),
            choices: [
                { id: 'crash_buy', label: `Buy the dip ($${cost})` },
                { id: 'crash_ignore', label: 'Ignore it' },
                { id: 'crash_warn', label: 'Warn your contacts' },
            ],
        };
    },
    informant_tip: (state, random) => {
        const commodity = (0, random_1.pickRandom)(commodities_1.COMMODITIES);
        const location = (0, random_1.pickRandom)(locations_1.LOCATIONS);
        const cost = (0, random_1.randomInt)(200, 400);
        const npc = (0, eventBuilderHelpers_1.buildNpcBlock)(state, 'whisper', random);
        return {
            id: `evt_${state.player.day}_informant`,
            eventType: 'informant_tip',
            title: 'Informant Tip',
            description: `${npc.name} slides up. "Got a line on cheap ${commodity.name} near ${location.name}. $${cost} for the details."`,
            npc,
            context: ctx({ commodityId: commodity.id, locationId: location.id, amount: cost, npcId: 'whisper' }),
            choices: [
                { id: 'informant_pay', label: `Pay for tip ($${cost})` },
                { id: 'informant_trade', label: 'Trade 3 units of stash' },
                { id: 'informant_ignore', label: 'Ignore them' },
            ],
        };
    },
    bulk_buyer_offer: (state, random) => {
        const commodity = (0, random_1.pickRandom)(commodities_1.COMMODITIES);
        const qty = (0, random_1.randomInt)(8, 15);
        const premium = (0, random_1.randomInt)(900, 1800);
        const npc = (0, eventBuilderHelpers_1.buildNpcBlock)(state, 'chip', random);
        return {
            id: `evt_${state.player.day}_buyer`,
            eventType: 'bulk_buyer_offer',
            title: 'Bulk Buyer Offer',
            description: `${npc.name} needs ${qty} ${commodity.name} today. Premium payout: $${premium}.`,
            npc,
            context: ctx({ commodityId: commodity.id, quantity: qty, amount: premium, npcId: 'chip' }),
            choices: [
                { id: 'buyer_sell', label: `Sell bulk ($${premium})` },
                { id: 'buyer_negotiate', label: 'Negotiate higher' },
                { id: 'buyer_decline', label: 'Decline offer' },
            ],
        };
    },
    health_emergency: (state, random) => {
        const clinic = (0, random_1.randomInt)(300, 500);
        const favor = (0, random_1.randomInt)(600, 1200);
        return {
            id: `evt_${state.player.day}_health`,
            eventType: 'health_emergency',
            title: 'Health Emergency',
            description: 'Chest tightens. Vision blurs. You need help before someone finds you bleeding out.',
            context: ctx({ amount: clinic, secondaryAmount: favor }),
            choices: [
                { id: 'health_clinic', label: `Visit clinic ($${clinic})` },
                { id: 'health_tough', label: 'Tough it out' },
                { id: 'health_favor', label: `Call in favor (+$${favor} debt)` },
            ],
        };
    },
    debt_collector_warning: (state, random) => {
        const partial = (0, random_1.randomInt)(400, 800);
        const penalty = (0, random_1.randomInt)(300, 600);
        const npc = (0, eventBuilderHelpers_1.buildNpcBlock)(state, 'bruno', random);
        return {
            id: `evt_${state.player.day}_collector`,
            eventType: 'debt_collector_warning',
            title: 'Debt Collector Warning',
            description: `${npc.name} finds you. "Boss wants $${partial} today. Miss it, and the price jumps."`,
            npc,
            context: ctx({ amount: partial, secondaryAmount: penalty, npcId: 'bruno' }),
            choices: [
                { id: 'collector_pay', label: `Pay partial ($${partial})` },
                { id: 'collector_promise', label: `Promise later (+$${penalty} debt)` },
                { id: 'collector_intimidate', label: 'Intimidate Bruno' },
            ],
        };
    },
};
function buildEvent(eventType, state, random = Math.random) {
    return BUILDERS[eventType](state, random);
}
function getAllEventTypes() {
    return Object.keys(BUILDERS);
}
