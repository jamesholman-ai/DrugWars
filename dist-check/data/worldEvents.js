"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_COMMODITY_IDS = exports.ALL_LOCATION_IDS = exports.SEVERITY_WEIGHTS = exports.WORLD_EVENT_ROLL_CHANCE = exports.MAX_ACTIVE_WORLD_EVENTS = exports.WORLD_EVENT_TEMPLATE_MAP = exports.WORLD_EVENT_TEMPLATES = void 0;
const commodities_1 = require("./commodities");
const locations_1 = require("./locations");
const ALL_LOCATION_IDS = locations_1.LOCATIONS.map((l) => l.id);
exports.ALL_LOCATION_IDS = ALL_LOCATION_IDS;
const ALL_COMMODITY_IDS = commodities_1.COMMODITIES.map((c) => c.id);
exports.ALL_COMMODITY_IDS = ALL_COMMODITY_IDS;
exports.WORLD_EVENT_TEMPLATES = [
    {
        type: 'market_shortage',
        title: 'Market Shortage',
        description: 'Supply dried up. Scarcity is driving prices through the roof.',
        locationPool: ALL_LOCATION_IDS,
        commodityPool: ALL_COMMODITY_IDS,
        maxAffectedLocations: 4,
        maxAffectedCommodities: 2,
        durationBySeverity: { low: 2, medium: 3, high: 5 },
        priceMultiplierBySeverity: { low: 1.25, medium: 1.45, high: 1.7 },
        heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
        eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
        spawnWeight: 12,
    },
    {
        type: 'police_crackdown',
        title: 'Police Crackdown',
        description: 'Extra patrols, checkpoints, and raids. Heat sticks faster.',
        locationPool: ALL_LOCATION_IDS,
        commodityPool: [],
        maxAffectedLocations: 0,
        maxAffectedCommodities: 0,
        durationBySeverity: { low: 3, medium: 4, high: 6 },
        priceMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
        heatMultiplierBySeverity: { low: 1.3, medium: 1.55, high: 1.85 },
        eventWeightModifiersBySeverity: {
            low: { police_stop: 1.4, police_raid: 1.3 },
            medium: { police_stop: 1.7, police_raid: 1.6 },
            high: { police_stop: 2.1, police_raid: 1.9 },
        },
        spawnWeight: 11,
    },
    {
        type: 'gang_war',
        title: 'Gang War',
        description: 'Territory lines are burning. Rivals and stick-up crews everywhere.',
        locationPool: ['projects', 'downtown', 'industrial_zone', 'nightclub_district'],
        commodityPool: [],
        maxAffectedLocations: 3,
        maxAffectedCommodities: 0,
        durationBySeverity: { low: 2, medium: 4, high: 5 },
        priceMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
        heatMultiplierBySeverity: { low: 1.1, medium: 1.2, high: 1.3 },
        eventWeightModifiersBySeverity: {
            low: { rival_dealer: 1.4, robbery_attempt: 1.3 },
            medium: { rival_dealer: 1.7, robbery_attempt: 1.5 },
            high: { rival_dealer: 2, robbery_attempt: 1.8 },
        },
        spawnWeight: 10,
    },
    {
        type: 'market_boom',
        title: 'Market Boom',
        description: 'Buyers are desperate. Prices are climbing citywide.',
        locationPool: ALL_LOCATION_IDS,
        commodityPool: ALL_COMMODITY_IDS,
        maxAffectedLocations: 0,
        maxAffectedCommodities: 3,
        durationBySeverity: { low: 2, medium: 3, high: 4 },
        priceMultiplierBySeverity: { low: 1.3, medium: 1.5, high: 1.75 },
        heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
        eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
        spawnWeight: 10,
    },
    {
        type: 'market_crash',
        title: 'Market Crash',
        description: 'Flooded streets. Nobody wants to pay retail anymore.',
        locationPool: ALL_LOCATION_IDS,
        commodityPool: ALL_COMMODITY_IDS,
        maxAffectedLocations: 0,
        maxAffectedCommodities: 2,
        durationBySeverity: { low: 2, medium: 3, high: 4 },
        priceMultiplierBySeverity: { low: 0.75, medium: 0.65, high: 0.55 },
        heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
        eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
        spawnWeight: 10,
    },
    {
        type: 'airport_lockdown',
        title: 'Airport Lockdown',
        description: 'Federal sweep at the terminal. Flights grounded — smuggling routes closed.',
        locationPool: ['airport'],
        commodityPool: ['rocks', 'powder', 'flower'],
        maxAffectedLocations: 1,
        maxAffectedCommodities: 2,
        durationBySeverity: { low: 2, medium: 3, high: 4 },
        priceMultiplierBySeverity: { low: 0.95, medium: 0.9, high: 0.85 },
        heatMultiplierBySeverity: { low: 1.35, medium: 1.55, high: 1.75 },
        eventWeightModifiersBySeverity: {
            low: { police_stop: 1.2 },
            medium: { police_stop: 1.35, police_raid: 1.2 },
            high: { police_stop: 1.5, police_raid: 1.35 },
        },
        spawnWeight: 7,
    },
    {
        type: 'supplier_flood',
        title: 'Supplier Flood',
        description: 'Wholesale hit the streets hard. Prices are bottoming out.',
        locationPool: ALL_LOCATION_IDS,
        commodityPool: ALL_COMMODITY_IDS,
        maxAffectedLocations: 3,
        maxAffectedCommodities: 2,
        durationBySeverity: { low: 3, medium: 4, high: 5 },
        priceMultiplierBySeverity: { low: 0.8, medium: 0.7, high: 0.6 },
        heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
        eventWeightModifiersBySeverity: {
            low: { supplier_discount: 1.3 },
            medium: { supplier_discount: 1.5 },
            high: { supplier_discount: 1.7 },
        },
        spawnWeight: 9,
    },
    {
        type: 'informant_network_buzz',
        title: 'Informant Network Buzz',
        description: 'Whispers on every corner. Tips are flowing through the grapevine.',
        locationPool: ALL_LOCATION_IDS,
        commodityPool: [],
        maxAffectedLocations: 0,
        maxAffectedCommodities: 0,
        durationBySeverity: { low: 2, medium: 3, high: 4 },
        priceMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
        heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
        eventWeightModifiersBySeverity: {
            low: { informant_tip: 1.5 },
            medium: { informant_tip: 1.85 },
            high: { informant_tip: 2.25 },
        },
        spawnWeight: 8,
    },
];
exports.WORLD_EVENT_TEMPLATE_MAP = Object.fromEntries(exports.WORLD_EVENT_TEMPLATES.map((t) => [t.type, t]));
exports.MAX_ACTIVE_WORLD_EVENTS = 3;
/** Chance a new world event starts when the day advances (if under cap). */
exports.WORLD_EVENT_ROLL_CHANCE = 0.22;
exports.SEVERITY_WEIGHTS = [
    { severity: 'low', weight: 50 },
    { severity: 'medium', weight: 35 },
    { severity: 'high', weight: 15 },
];
