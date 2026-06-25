"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCOUNTER_TRIGGER_CHANCE = void 0;
exports.buildEncounterEvent = buildEncounterEvent;
exports.rollEncounter = rollEncounter;
exports.isEncounterChoice = isEncounterChoice;
exports.parseEncounterChoice = parseEncounterChoice;
const encounterCatalog_1 = require("../data/encounterCatalog");
const weightedRandom_1 = require("../utils/weightedRandom");
const locations_1 = require("../data/locations");
const territory_1 = require("./territory");
const combat_1 = require("./combat");
const stateUtils_1 = require("./stateUtils");
const missionSystem_1 = require("./missionSystem");
const TRIGGER_CHANCE = {
    stay: 0.12,
    areaTravel: 0.18,
    cityTravel: 0.28,
    marketAction: 0.08,
    highHeat: 0.25,
};
exports.ENCOUNTER_TRIGGER_CHANCE = TRIGGER_CHANCE;
function factionMultiplier(state, faction, atAirport) {
    switch (faction) {
        case 'police':
        case 'dea':
            return (0, combat_1.getPoliceRiskMultiplier)(state);
        case 'airport_police':
            return atAirport ? (0, combat_1.getAirportRiskMultiplier)(state) * 1.5 : (0, combat_1.getAirportRiskMultiplier)(state) * 0.3;
        case 'thug':
            return (0, combat_1.getRobberyRiskMultiplier)(state);
        case 'rival':
            return (0, combat_1.getRivalRiskMultiplier)(state);
        case 'cartel':
            return (0, combat_1.getCartelRiskMultiplier)(state);
        case 'civilian':
            return 1;
        default:
            return 1;
    }
}
function buildEncounterWeights(state, context) {
    const { player } = state;
    const atAirport = (0, locations_1.isAirportArea)(player.currentAreaId);
    const effectiveHeat = (0, territory_1.getEffectivePoliceHeat)(state, player.currentCityId);
    const highHeat = effectiveHeat >= 55;
    const load = (0, combat_1.getInventoryLoadFactor)(state);
    const items = [];
    for (const enc of encounterCatalog_1.ENCOUNTER_CATALOG) {
        if (!enc.triggerContexts.includes(context))
            continue;
        if (context === 'highHeat' && !highHeat)
            continue;
        if (enc.faction === 'airport_police' && context === 'cityTravel' && !atAirport) {
            continue;
        }
        let weight = enc.baseWeight;
        weight = (0, weightedRandom_1.adjustWeight)(weight, factionMultiplier(state, enc.faction, atAirport));
        if (enc.faction === 'police' || enc.faction === 'dea') {
            weight = (0, weightedRandom_1.adjustWeight)(weight, 1 + effectiveHeat / 100);
        }
        if (enc.faction === 'rival' || enc.faction === 'cartel') {
            weight = (0, weightedRandom_1.adjustWeight)(weight, 1 + player.reputation / 120);
        }
        if (enc.faction === 'thug') {
            weight = (0, weightedRandom_1.adjustWeight)(weight, 1 + load * 0.8);
        }
        if (highHeat && (enc.faction === 'police' || enc.faction === 'dea')) {
            weight = (0, weightedRandom_1.adjustWeight)(weight, 1.4);
        }
        items.push({ item: enc.id, weight });
    }
    return items;
}
function buildEncounterEvent(encounter, state) {
    const areaKey = (0, locations_1.getPlayerAreaKey)(state.player);
    const choices = encounter.choices
        .filter((c) => {
        if (c.minCash != null && state.player.cash < c.minCash)
            return false;
        if (c.requiresEquipment && !state.equipment?.some((e) => e.equipmentId === c.requiresEquipment)) {
            return false;
        }
        return true;
    })
        .map((c) => ({
        id: `enc:${encounter.id}:${c.id}`,
        label: c.label,
    }));
    if (choices.length === 0) {
        choices.push({
            id: `enc:${encounter.id}:talk`,
            label: 'Talk your way out',
        });
    }
    return {
        id: `encounter_${encounter.id}_${state.player.day}`,
        eventType: 'police_stop',
        title: encounter.title,
        description: `${encounter.description}\n\n[Danger ${encounter.dangerLevel}/5 · ${encounter.faction.toUpperCase()} · Threat ${encounter.threatScore}]`,
        choices,
        context: {
            locationId: areaKey,
            amount: encounter.threatScore,
            npcId: encounter.id,
        },
    };
}
function pickSpecialEncounter(state) {
    const { player } = state;
    if (player.debt > 25000 &&
        player.debtCollectorWarnings >= 3 &&
        player.cash < player.debt * 0.1) {
        return encounterCatalog_1.DEBT_COLLECTOR_EXECUTION_ENCOUNTER;
    }
    if ((state.cartelStanding ?? 0) <= -50 &&
        (state.cartelBetrayals ?? 0) >= 2 &&
        player.reputation >= 50) {
        return encounterCatalog_1.CARTEL_EXECUTION_ENCOUNTER;
    }
    return null;
}
function rollEncounter(state, context, random = Math.random) {
    const normalized = (0, stateUtils_1.normalizeGameState)(state);
    if (normalized.pendingEvent || normalized.player.isGameOver) {
        return normalized;
    }
    if (normalized.player.daysInJail > 0) {
        return normalized;
    }
    const special = pickSpecialEncounter(normalized);
    if (special && random() < 0.35) {
        return {
            ...normalized,
            pendingEvent: buildEncounterEvent(special, normalized),
        };
    }
    const effectiveContext = normalized.player.heat >= 70 && random() < 0.25 ? 'highHeat' : context;
    const chance = TRIGGER_CHANCE[effectiveContext];
    if (random() > chance) {
        return normalized;
    }
    const weights = buildEncounterWeights(normalized, effectiveContext);
    const encounterId = (0, weightedRandom_1.weightedPick)(weights, random);
    if (!encounterId)
        return normalized;
    const encounter = encounterCatalog_1.ENCOUNTER_MAP[encounterId];
    if (!encounter)
        return normalized;
    let updated = {
        ...normalized,
        pendingEvent: buildEncounterEvent(encounter, normalized),
    };
    if (encounter.faction === 'police' ||
        encounter.faction === 'dea' ||
        encounter.faction === 'airport_police') {
        updated = (0, missionSystem_1.trackMissionEvent)(updated, { kind: 'police_encounter' });
    }
    return updated;
}
function isEncounterChoice(choiceId) {
    return choiceId.startsWith('enc:');
}
function parseEncounterChoice(choiceId) {
    if (!choiceId.startsWith('enc:'))
        return null;
    const parts = choiceId.slice(4).split(':');
    if (parts.length < 2)
        return null;
    const choiceKey = parts.pop();
    const encounterId = parts.join(':');
    return { encounterId, choiceKey };
}
