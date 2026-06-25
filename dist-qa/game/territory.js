"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferDefaultOwner = inferDefaultOwner;
exports.createDefaultAreaOwnership = createDefaultAreaOwnership;
exports.createDefaultLocalHeat = createDefaultLocalHeat;
exports.getAreaOwnership = getAreaOwnership;
exports.getLocalCityHeat = getLocalCityHeat;
exports.getEffectivePoliceHeat = getEffectivePoliceHeat;
exports.adjustLocalHeat = adjustLocalHeat;
exports.getDisplayTerritoryOwner = getDisplayTerritoryOwner;
exports.formatOwnerLabel = formatOwnerLabel;
exports.formatDemandHint = formatDemandHint;
exports.rollAreaFlavorMessage = rollAreaFlavorMessage;
exports.migrateAreaOwnership = migrateAreaOwnership;
exports.migrateLocalHeatByCity = migrateLocalHeatByCity;
exports.ensureAreaBelongsToCity = ensureAreaBelongsToCity;
const areas_1 = require("../data/areas");
const locations_1 = require("../data/locations");
const random_1 = require("../utils/random");
function inferDefaultOwner(area) {
    if (area.policePresence >= 65)
        return 'police_controlled';
    if (area.cartelInfluence >= 55)
        return 'cartel';
    if (area.rivalInfluence >= 55)
        return 'rival_gang';
    return 'neutral';
}
function createDefaultAreaOwnership() {
    const ownership = {};
    for (const area of areas_1.CITY_AREAS) {
        ownership[(0, locations_1.getAreaKey)(area.cityId, area.id)] = inferDefaultOwner(area);
    }
    return ownership;
}
function createDefaultLocalHeat() {
    const heat = {};
    for (const city of locations_1.CITIES) {
        heat[city.id] = Math.round(10 + city.riskModifier * 8);
    }
    return heat;
}
function getAreaOwnership(state, cityId, areaId) {
    return state.areaOwnership?.[(0, locations_1.getAreaKey)(cityId, areaId)] ?? 'neutral';
}
function getLocalCityHeat(state, cityId) {
    return (0, random_1.clamp)(state.localHeatByCity?.[cityId] ?? 0, 0, 100);
}
/** Police encounters blend local city heat with personal heat. */
function getEffectivePoliceHeat(state, cityId) {
    const local = getLocalCityHeat(state, cityId);
    return (0, random_1.clamp)(Math.round(local * 0.65 + state.player.heat * 0.35), 0, 100);
}
function adjustLocalHeat(state, cityId, delta) {
    const current = { ...(state.localHeatByCity ?? createDefaultLocalHeat()) };
    current[cityId] = (0, random_1.clamp)((current[cityId] ?? 0) + delta, 0, 100);
    return current;
}
const OWNER_LABELS = {
    neutral: 'Neutral',
    rival_gang: 'Rival Gang',
    cartel: 'Cartel',
    police_controlled: 'Police',
    player_controlled: 'Your Crew',
};
function getDisplayTerritoryOwner(owner) {
    if (owner === 'player_controlled')
        return 'neutral';
    return owner;
}
function formatOwnerLabel(owner) {
    return OWNER_LABELS[getDisplayTerritoryOwner(owner)];
}
function formatDemandHint(demandModifiers, limit = 2) {
    const hot = Object.entries(demandModifiers)
        .filter((entry) => {
        const mod = entry[1];
        return typeof mod === 'number' && mod >= 1.08;
    })
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, mod]) => `${id} +${Math.round((mod - 1) * 100)}%`);
    return hot.length ? hot.join(', ') : 'Balanced';
}
/** Small flavor event when entering a new area (no day advance). */
function rollAreaFlavorMessage(state, areaName, owner) {
    const roll = Math.random();
    if (roll > 0.22)
        return null;
    if (owner === 'police_controlled') {
        return `Entering ${areaName} — patrols active. Keep your head down.`;
    }
    if (owner === 'cartel') {
        return `Entering ${areaName} — cartel eyes on the block.`;
    }
    if (owner === 'rival_gang') {
        return `Entering ${areaName} — rival crew holds this turf.`;
    }
    if (owner === 'player_controlled') {
        return `Entering ${areaName} — your people control this strip.`;
    }
    return `Entering ${areaName} — streets are watching.`;
}
function migrateAreaOwnership(raw) {
    const defaults = createDefaultAreaOwnership();
    if (typeof raw !== 'object' || raw === null)
        return defaults;
    const valid = [
        'neutral',
        'rival_gang',
        'cartel',
        'police_controlled',
        'player_controlled',
    ];
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'string' && valid.includes(value)) {
            defaults[key] = value;
        }
    }
    return defaults;
}
function migrateLocalHeatByCity(raw, playerHeat) {
    const defaults = createDefaultLocalHeat();
    if (typeof raw !== 'object' || raw === null) {
        if (playerHeat > 0) {
            defaults.new_york = (0, random_1.clamp)(playerHeat, 0, 100);
        }
        return defaults;
    }
    for (const [cityId, value] of Object.entries(raw)) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            defaults[cityId] = (0, random_1.clamp)(value, 0, 100);
        }
    }
    return defaults;
}
function ensureAreaBelongsToCity(cityId, areaId) {
    return (0, areas_1.getAreasForCity)(cityId).some((a) => a.id === areaId);
}
