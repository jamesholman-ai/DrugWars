"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AREA_IDS = exports.STARTING_LOCATION_ID = exports.LOCATION_MAP = exports.LOCATIONS = exports.LEGACY_LOCATION_MAP = exports.LEGACY_LOCATIONS = exports.LEGACY_LOCATION_TO_CITY_AREA = exports.AREA_COMMODITY_BIAS = exports.STARTING_CITY_ID = exports.CITY_MAP = exports.CITIES = exports.getTravelHubAreaId = exports.isPortArea = exports.isAirportArea = exports.STARTING_AREA_ID = exports.resolveAreaIdForCity = exports.getDefaultAreaForCity = exports.getCurrentArea = exports.getAreasForCity = exports.CITY_AREA_MAP = exports.CITY_AREAS = exports.AREA_MAP = exports.AREAS = void 0;
exports.getAreaKey = getAreaKey;
exports.parseAreaKey = parseAreaKey;
exports.getPlayerAreaKey = getPlayerAreaKey;
exports.getAllAreaKeys = getAllAreaKeys;
exports.getAreaLabel = getAreaLabel;
const areas_1 = require("./areas");
Object.defineProperty(exports, "AREAS", { enumerable: true, get: function () { return areas_1.AREAS; } });
Object.defineProperty(exports, "AREA_MAP", { enumerable: true, get: function () { return areas_1.AREA_MAP; } });
Object.defineProperty(exports, "CITY_AREAS", { enumerable: true, get: function () { return areas_1.CITY_AREAS; } });
Object.defineProperty(exports, "CITY_AREA_MAP", { enumerable: true, get: function () { return areas_1.CITY_AREA_MAP; } });
Object.defineProperty(exports, "getAreasForCity", { enumerable: true, get: function () { return areas_1.getAreasForCity; } });
Object.defineProperty(exports, "getCurrentArea", { enumerable: true, get: function () { return areas_1.getCurrentArea; } });
Object.defineProperty(exports, "getDefaultAreaForCity", { enumerable: true, get: function () { return areas_1.getDefaultAreaForCity; } });
Object.defineProperty(exports, "resolveAreaIdForCity", { enumerable: true, get: function () { return areas_1.resolveAreaIdForCity; } });
Object.defineProperty(exports, "STARTING_AREA_ID", { enumerable: true, get: function () { return areas_1.STARTING_AREA_ID; } });
Object.defineProperty(exports, "isAirportArea", { enumerable: true, get: function () { return areas_1.isAirportArea; } });
Object.defineProperty(exports, "isPortArea", { enumerable: true, get: function () { return areas_1.isPortArea; } });
Object.defineProperty(exports, "getTravelHubAreaId", { enumerable: true, get: function () { return areas_1.getTravelHubAreaId; } });
exports.CITIES = [
    {
        id: 'new_york',
        name: 'New York',
        description: 'The empire state hustle. Everything moves, nothing sleeps.',
        travelCost: 420,
        riskModifier: 1.15,
        priceModifier: 1.1,
        specialtyDrugs: ['crack', 'heroin', 'speed'],
        demandDrugs: ['cocaine', 'ketamine'],
    },
    {
        id: 'los_angeles',
        name: 'Los Angeles',
        description: 'Sun, smog, and studio-grade product.',
        travelCost: 480,
        riskModifier: 1.05,
        priceModifier: 1.05,
        specialtyDrugs: ['weed', 'mdma', 'ketamine'],
        demandDrugs: ['cocaine', 'morphine'],
    },
    {
        id: 'miami',
        name: 'Miami',
        description: 'Import hub. Cocaine flows like the tide.',
        travelCost: 380,
        riskModifier: 1.2,
        priceModifier: 0.92,
        specialtyDrugs: ['cocaine', 'crack', 'mdma'],
        demandDrugs: ['heroin', 'morphine'],
    },
    {
        id: 'detroit',
        name: 'Detroit',
        description: 'Hard streets. Hard product. Hard markup for outsiders.',
        travelCost: 340,
        riskModifier: 1.3,
        priceModifier: 1.0,
        specialtyDrugs: ['crack', 'heroin', 'meth'],
        demandDrugs: ['cocaine', 'ecstasy', 'ketamine'],
    },
    {
        id: 'chicago',
        name: 'Chicago',
        description: 'Windy city corridors and cold winter demand.',
        travelCost: 360,
        riskModifier: 1.1,
        priceModifier: 1.0,
        specialtyDrugs: ['heroin', 'crack', 'speed'],
        demandDrugs: ['cocaine', 'lsd'],
    },
    {
        id: 'atlanta',
        name: 'Atlanta',
        description: 'Southern trap capital. Lean culture, loud money.',
        travelCost: 320,
        riskModifier: 1.05,
        priceModifier: 0.98,
        specialtyDrugs: ['weed', 'mdma', 'crack'],
        demandDrugs: ['cocaine', 'morphine'],
    },
    {
        id: 'las_vegas',
        name: 'Las Vegas',
        description: 'Tourists pay tourist prices. Everything spikes on weekends.',
        travelCost: 400,
        riskModifier: 1.0,
        priceModifier: 1.25,
        specialtyDrugs: ['ecstasy', 'mdma', 'ketamine'],
        demandDrugs: ['cocaine', 'heroin', 'morphine'],
    },
    {
        id: 'seattle',
        name: 'Seattle',
        description: 'Rain, coffee, and cheap green. Export weed elsewhere.',
        travelCost: 450,
        riskModifier: 0.9,
        priceModifier: 0.95,
        specialtyDrugs: ['weed', 'mushrooms', 'lsd'],
        demandDrugs: ['cocaine', 'crack', 'heroin'],
    },
    {
        id: 'austin',
        name: 'Austin',
        description: 'Live music and festival crowds. Party product moves.',
        travelCost: 350,
        riskModifier: 0.95,
        priceModifier: 1.0,
        specialtyDrugs: ['weed', 'mushrooms', 'mdma'],
        demandDrugs: ['cocaine', 'ketamine'],
    },
    {
        id: 'boston',
        name: 'Boston',
        description: 'Ivy League buyers and harbor imports.',
        travelCost: 390,
        riskModifier: 1.0,
        priceModifier: 1.08,
        specialtyDrugs: ['lsd', 'mushrooms', 'ecstasy'],
        demandDrugs: ['cocaine', 'heroin'],
    },
    {
        id: 'san_francisco',
        name: 'San Francisco',
        description: 'Tech money meets street pharma.',
        travelCost: 470,
        riskModifier: 0.85,
        priceModifier: 1.15,
        specialtyDrugs: ['lsd', 'mushrooms', 'ketamine'],
        demandDrugs: ['cocaine', 'crack', 'meth'],
    },
    {
        id: 'toronto',
        name: 'Toronto',
        description: 'Cross-border corridors. Hash and pills in rotation.',
        travelCost: 440,
        riskModifier: 0.95,
        priceModifier: 1.02,
        specialtyDrugs: ['hashish', 'mdma', 'ketamine'],
        demandDrugs: ['cocaine', 'heroin'],
    },
    {
        id: 'london',
        name: 'London',
        description: 'UK demand taxes American exports hard.',
        travelCost: 620,
        riskModifier: 1.1,
        priceModifier: 1.35,
        specialtyDrugs: ['hashish', 'speed', 'ecstasy'],
        demandDrugs: ['weed', 'cocaine', 'crack'],
    },
    {
        id: 'paris',
        name: 'Paris',
        description: 'Fashion district markups on everything imported.',
        travelCost: 640,
        riskModifier: 1.05,
        priceModifier: 1.3,
        specialtyDrugs: ['hashish', 'ketamine', 'mdma'],
        demandDrugs: ['cocaine', 'heroin', 'morphine'],
    },
    {
        id: 'amsterdam',
        name: 'Amsterdam',
        description: 'Coffee shops and canals. Weed is cheap — export it.',
        travelCost: 680,
        riskModifier: 0.8,
        priceModifier: 0.88,
        specialtyDrugs: ['weed', 'hashish', 'mushrooms', 'ecstasy'],
        demandDrugs: ['cocaine', 'crack', 'heroin'],
    },
];
exports.CITY_MAP = Object.fromEntries(exports.CITIES.map((c) => [c.id, c]));
exports.STARTING_CITY_ID = 'new_york';
function getAreaKey(cityId, areaId) {
    return `${cityId}:${areaId}`;
}
function parseAreaKey(key) {
    const idx = key.indexOf(':');
    if (idx <= 0)
        return null;
    const cityId = key.slice(0, idx);
    const areaId = key.slice(idx + 1);
    if (!exports.CITY_MAP[cityId])
        return null;
    if (!areas_1.AREA_MAP[areaId] && !(0, areas_1.getAreasForCity)(cityId).some((a) => a.id === areaId)) {
        return null;
    }
    return { cityId, areaId };
}
function getPlayerAreaKey(player) {
    return getAreaKey(player.currentCityId, player.currentAreaId);
}
function getAllAreaKeys() {
    const keys = [];
    for (const area of areas_1.CITY_AREAS) {
        keys.push(getAreaKey(area.cityId, area.id));
    }
    return keys;
}
function getAreaLabel(cityId, areaId) {
    const city = exports.CITY_MAP[cityId];
    const area = areas_1.AREA_MAP[areaId] ?? (0, areas_1.getAreasForCity)(cityId).find((a) => a.id === areaId);
    if (!city || !area)
        return `${cityId} · ${areaId}`;
    return `${city.name} · ${area.name}`;
}
/** @deprecated Use CityAreaDefinition.demandModifiers */
exports.AREA_COMMODITY_BIAS = {};
exports.LEGACY_LOCATION_TO_CITY_AREA = {
    downtown: { cityId: 'new_york', areaId: 'new_york_downtown' },
    projects: { cityId: 'new_york', areaId: 'new_york_harlem' },
    suburbs: { cityId: 'miami', areaId: 'miami_port' },
    nightclub_district: { cityId: 'miami', areaId: 'miami_beach_district' },
    college_area: { cityId: 'boston', areaId: 'boston_cambridge' },
    industrial_zone: { cityId: 'detroit', areaId: 'detroit_industrial' },
    airport: { cityId: 'new_york', areaId: 'new_york_queens' },
};
exports.LEGACY_LOCATIONS = [
    {
        id: 'downtown',
        name: 'Downtown',
        description: 'Legacy district',
        travelCost: 75,
        riskModifier: 1,
        priceModifier: 1,
        healCost: 250,
    },
    {
        id: 'projects',
        name: 'Old Quarter',
        description: 'Legacy district',
        travelCost: 40,
        riskModifier: 1.3,
        priceModifier: 0.75,
        healCost: 120,
    },
    {
        id: 'suburbs',
        name: 'Harbor',
        description: 'Legacy district',
        travelCost: 100,
        riskModifier: 0.7,
        priceModifier: 0.9,
        healCost: 350,
    },
    {
        id: 'nightclub_district',
        name: 'Neon Row',
        description: 'Legacy district',
        travelCost: 90,
        riskModifier: 1.1,
        priceModifier: 1.15,
        healCost: 300,
    },
    {
        id: 'college_area',
        name: 'College Strip',
        description: 'Legacy district',
        travelCost: 85,
        riskModifier: 0.85,
        priceModifier: 0.8,
        healCost: 200,
    },
    {
        id: 'industrial_zone',
        name: 'Industrial Zone',
        description: 'Legacy district',
        travelCost: 70,
        riskModifier: 1.2,
        priceModifier: 0.95,
        healCost: 180,
    },
    {
        id: 'airport',
        name: 'Airport',
        description: 'Legacy district',
        travelCost: 150,
        riskModifier: 1.5,
        priceModifier: 1.35,
        healCost: 500,
    },
];
exports.LEGACY_LOCATION_MAP = Object.fromEntries(exports.LEGACY_LOCATIONS.map((l) => [l.id, l]));
/** @deprecated Use CITY_MAP / getAreaLabel */
exports.LOCATIONS = exports.LEGACY_LOCATIONS;
exports.LOCATION_MAP = exports.LEGACY_LOCATION_MAP;
exports.STARTING_LOCATION_ID = 'downtown';
/** All area ids (legacy helper). */
exports.AREA_IDS = areas_1.CITY_AREAS.map((a) => a.id);
