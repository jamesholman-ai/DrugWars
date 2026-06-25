"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STASH_HOUSE_MAP = exports.STASH_HOUSES = exports.INVENTORY_UPGRADE_MAP = exports.INVENTORY_UPGRADES = exports.LOCATION_UNLOCK_REQUIREMENTS = exports.REPUTATION_TIERS = exports.RANK_MAP = exports.RANKS = exports.STARTING_UNLOCKED_LOCATIONS = exports.BASE_INVENTORY_CAPACITY = void 0;
exports.BASE_INVENTORY_CAPACITY = 100;
/** Locations available from day one on a new run. */
exports.STARTING_UNLOCKED_LOCATIONS = [
    'downtown',
    'projects',
    'nightclub_district',
];
exports.RANKS = [
    {
        id: 'wannabe',
        name: 'Wannabe',
        description: 'Fresh on the block. Nobody knows your name yet.',
        requirements: {},
        benefits: ['Access to Downtown, Old Quarter, Neon Row'],
    },
    {
        id: 'runner',
        name: 'Runner',
        description: 'You move product and stay out of cuffs. Barely.',
        requirements: { reputation: 12, netWorth: 2500, daysSurvived: 3 },
        benefits: ['Harbor district intel', 'Better street cred'],
    },
    {
        id: 'hustler',
        name: 'Hustler',
        description: 'Small-time but steady. Corners remember your face.',
        requirements: {
            reputation: 25,
            netWorth: 8000,
            lifetimeProfit: 2000,
            daysSurvived: 8,
        },
        benefits: ['College Strip routes open', 'Supplier deals improve'],
    },
    {
        id: 'dealer',
        name: 'Dealer',
        description: 'Real volume. Real heat. Real money.',
        requirements: {
            reputation: 35,
            netWorth: 15000,
            lifetimeProfit: 6000,
            daysSurvived: 15,
        },
        benefits: ['Industrial Zone access', 'Bulk buyer interest'],
    },
    {
        id: 'plug',
        name: 'Plug',
        description: 'Wholesale connects. You set the tempo.',
        requirements: {
            reputation: 50,
            netWorth: 35000,
            lifetimeProfit: 15000,
            daysSurvived: 25,
        },
        benefits: ['Airport routes unlock', 'Crew respect on the street'],
    },
    {
        id: 'shot_caller',
        name: 'Shot Caller',
        description: 'Territory bends when you walk through.',
        requirements: {
            reputation: 65,
            netWorth: 75000,
            lifetimeProfit: 35000,
            daysSurvived: 40,
        },
        benefits: ['Rivals think twice', 'Premium stash options'],
    },
    {
        id: 'kingpin',
        name: 'Kingpin',
        description: 'Citywide name. Enforcers know the invoice.',
        requirements: {
            reputation: 80,
            netWorth: 150000,
            lifetimeProfit: 80000,
            daysSurvived: 60,
        },
        benefits: ['Maximum street influence', 'Elite upgrade tiers'],
    },
    {
        id: 'empire_boss',
        name: 'Empire Boss',
        description: 'The underworld runs on your schedule.',
        requirements: {
            reputation: 90,
            netWorth: 300000,
            lifetimeProfit: 200000,
            daysSurvived: 90,
        },
        benefits: ['Legend status', 'All districts bow'],
    },
];
exports.RANK_MAP = Object.fromEntries(exports.RANKS.map((r) => [r.id, r]));
exports.REPUTATION_TIERS = [
    { id: 'unknown', name: 'Unknown', minReputation: 0 },
    { id: 'noticed', name: 'Noticed', minReputation: 15 },
    { id: 'connected', name: 'Connected', minReputation: 30 },
    { id: 'feared', name: 'Feared', minReputation: 45 },
    { id: 'respected', name: 'Respected', minReputation: 60 },
    { id: 'untouchable', name: 'Untouchable', minReputation: 80 },
];
/** Locked until requirements met (starter locations omitted). */
exports.LOCATION_UNLOCK_REQUIREMENTS = {
    suburbs: {
        rankId: 'runner',
        reputation: 25,
        cash: 4000,
        daysSurvived: 5,
    },
    college_area: {
        rankId: 'hustler',
        reputation: 28,
        daysSurvived: 10,
    },
    industrial_zone: {
        rankId: 'dealer',
        netWorth: 12000,
        daysSurvived: 18,
    },
    airport: {
        rankId: 'plug',
        reputation: 52,
        netWorth: 28000,
        daysSurvived: 28,
    },
};
exports.INVENTORY_UPGRADES = [
    {
        id: 'bigger_pockets',
        name: 'Bigger Pockets',
        description: 'Sewn-in pockets for small runs.',
        cost: 750,
        capacityBonus: 25,
        order: 0,
    },
    {
        id: 'backpack',
        name: 'Backpack',
        description: 'Dedicated carry bag for mid-size loads.',
        cost: 1800,
        capacityBonus: 35,
        order: 1,
    },
    {
        id: 'hidden_compartments',
        name: 'Hidden Compartments',
        description: 'False panels in your ride.',
        cost: 4000,
        capacityBonus: 50,
        order: 2,
    },
    {
        id: 'runner_crew',
        name: 'Runner Crew',
        description: 'Two trusted couriers on call.',
        cost: 8500,
        capacityBonus: 75,
        order: 3,
    },
    {
        id: 'cargo_van',
        name: 'Cargo Van',
        description: 'Serious bulk. Serious risk.',
        cost: 16000,
        capacityBonus: 100,
        order: 4,
    },
];
exports.INVENTORY_UPGRADE_MAP = Object.fromEntries(exports.INVENTORY_UPGRADES.map((u) => [u.id, u]));
exports.STASH_HOUSES = [
    {
        id: 'stash_downtown',
        locationId: 'downtown',
        name: 'Downtown Safehouse',
        description: 'Basement unit off the main strip. Low profile.',
        cost: 4000,
        capacityBonus: 35,
        robberyReduction: 0.22,
        extraHeatDecay: 1,
    },
    {
        id: 'stash_projects',
        locationId: 'projects',
        name: 'Old Quarter Stash',
        description: 'Abandoned unit the block protects.',
        cost: 2800,
        capacityBonus: 30,
        robberyReduction: 0.18,
        extraHeatDecay: 0,
    },
    {
        id: 'stash_neon',
        locationId: 'nightclub_district',
        name: 'Neon Row Cache',
        description: 'Back-room locker behind the clubs.',
        cost: 3200,
        capacityBonus: 30,
        robberyReduction: 0.15,
        extraHeatDecay: 1,
    },
    {
        id: 'stash_harbor',
        locationId: 'suburbs',
        name: 'Harbor Warehouse',
        description: 'Dockside storage with a blind eye.',
        cost: 5500,
        capacityBonus: 45,
        robberyReduction: 0.2,
        extraHeatDecay: 1,
    },
    {
        id: 'stash_college',
        locationId: 'college_area',
        name: 'Campus Drop Spot',
        description: 'Off-campus house with a locked shed.',
        cost: 4800,
        capacityBonus: 40,
        robberyReduction: 0.16,
        extraHeatDecay: 0,
    },
    {
        id: 'stash_industrial',
        locationId: 'industrial_zone',
        name: 'Industrial Vault',
        description: 'Locked container on the rail line.',
        cost: 7000,
        capacityBonus: 55,
        robberyReduction: 0.25,
        extraHeatDecay: 2,
    },
    {
        id: 'stash_airport',
        locationId: 'airport',
        name: 'Terminal Backroom',
        description: 'Paid-off storage behind customs.',
        cost: 12000,
        capacityBonus: 60,
        robberyReduction: 0.28,
        extraHeatDecay: 1,
    },
];
exports.STASH_HOUSE_MAP = Object.fromEntries(exports.STASH_HOUSES.map((s) => [s.id, s]));
