"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIGGER_CHANCE = void 0;
exports.rollRandomEvent = rollRandomEvent;
exports.buildWeights = buildWeights;
const weightedRandom_1 = require("../utils/weightedRandom");
const eventBuilder_1 = require("../game/eventBuilder");
const stateUtils_1 = require("../game/stateUtils");
const npcSystem_1 = require("../game/npcSystem");
const worldEvents_1 = require("../game/worldEvents");
const progression_1 = require("../game/progression");
/** NPC tied to recurring event types — used for relationship-based weighting. */
const EVENT_NPC_IDS = {
    police_stop: 'vance',
    rival_dealer: 'razor',
    supplier_discount: 'mama_silk',
    informant_tip: 'whisper',
    bulk_buyer_offer: 'chip',
    debt_collector_warning: 'bruno',
};
function relationWeight(state, eventType, base) {
    const npcId = EVENT_NPC_IDS[eventType];
    let weight = base;
    if (npcId) {
        weight = (0, weightedRandom_1.adjustWeight)(weight, (0, npcSystem_1.getNpcEventWeightMultiplier)(state, npcId));
    }
    return (0, weightedRandom_1.adjustWeight)(weight, (0, worldEvents_1.getWorldEventWeightMultiplier)(state, eventType));
}
function buildWeights(state, trigger) {
    const { player, memoryFlags } = state;
    const heatFactor = 1 + player.heat / 100;
    const debtFactor = 1 + Math.min(player.debt / 15000, 1.5);
    const lowHealthFactor = player.health < 40 ? 2.5 : 1;
    const travelFactor = trigger === 'travel' ? 1.2 : 1;
    const restFactor = trigger === 'rest' ? 0.8 : 1;
    return [
        { item: 'police_stop', weight: relationWeight(state, 'police_stop', (0, weightedRandom_1.adjustWeight)(12, heatFactor * travelFactor)) },
        { item: 'police_raid', weight: (0, weightedRandom_1.adjustWeight)(8, heatFactor * 1.3 * (0, worldEvents_1.getWorldEventWeightMultiplier)(state, 'police_raid')) },
        { item: 'rival_dealer', weight: relationWeight(state, 'rival_dealer', (0, weightedRandom_1.adjustWeight)(10, travelFactor)) },
        { item: 'robbery_attempt', weight: (0, weightedRandom_1.adjustWeight)(11, travelFactor * (player.reputation < 30 ? 1.3 : 0.9) * (0, worldEvents_1.getWorldEventWeightMultiplier)(state, 'robbery_attempt') * (0, progression_1.getRobberyWeightMultiplier)(state)) },
        { item: 'supplier_discount', weight: relationWeight(state, 'supplier_discount', (0, weightedRandom_1.adjustWeight)(9, restFactor)) },
        { item: 'price_spike', weight: (0, weightedRandom_1.adjustWeight)(10, 1) },
        { item: 'price_crash', weight: (0, weightedRandom_1.adjustWeight)(10, 1) },
        {
            item: 'informant_tip',
            weight: relationWeight(state, 'informant_tip', (0, weightedRandom_1.adjustWeight)(8, player.reputation > 40 ? 1.4 : 0.8) * (memoryFlags.ignoredInformant ? 0.7 : 1)),
        },
        {
            item: 'bulk_buyer_offer',
            weight: relationWeight(state, 'bulk_buyer_offer', (0, weightedRandom_1.adjustWeight)(9, player.inventory.length > 0 ? 1.5 : 0.4) * (memoryFlags.soldToBuyer ? 1.2 : 1)),
        },
        { item: 'health_emergency', weight: (0, weightedRandom_1.adjustWeight)(6, lowHealthFactor) },
        {
            item: 'debt_collector_warning',
            weight: relationWeight(state, 'debt_collector_warning', (0, weightedRandom_1.adjustWeight)(10, debtFactor * (player.debt > 6000 ? 1.8 : 0.5)) * (memoryFlags.paidCollector ? 0.85 : 1)),
        },
    ];
}
/** Base chance an event fires when traveling or advancing the day. */
const TRIGGER_CHANCE = {
    travel: 0.55,
    rest: 0.35,
    day_advance: 0.45,
};
exports.TRIGGER_CHANCE = TRIGGER_CHANCE;
function rollRandomEvent(state, trigger = 'travel', random = Math.random) {
    const normalized = (0, stateUtils_1.normalizeGameState)(state);
    const chance = TRIGGER_CHANCE[trigger];
    if (random() > chance) {
        return normalized;
    }
    const weights = buildWeights(normalized, trigger);
    const eventType = (0, weightedRandom_1.weightedPick)(weights, random);
    if (!eventType) {
        return normalized;
    }
    const event = (0, eventBuilder_1.buildEvent)(eventType, normalized, random);
    return {
        ...normalized,
        pendingEvent: event,
    };
}
