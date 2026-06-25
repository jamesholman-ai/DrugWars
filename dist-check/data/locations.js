"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STARTING_LOCATION_ID = exports.LOCATION_MAP = exports.LOCATION_COMMODITY_BIAS = exports.LOCATIONS = void 0;
exports.LOCATIONS = [
    {
        id: 'downtown',
        name: 'Downtown',
        description: 'Glass towers and back-alley handoffs. Prices swing hard here.',
        travelCost: 75,
        riskModifier: 1.0,
        priceModifier: 1.0,
        healCost: 250,
    },
    {
        id: 'projects',
        name: 'Old Quarter',
        description: 'Cheap product moves fast. Watch your back.',
        travelCost: 40,
        riskModifier: 1.3,
        priceModifier: 0.75,
        healCost: 120,
    },
    {
        id: 'suburbs',
        name: 'Harbor',
        description: 'Dockside deals and import prices. Smugglers watch the water.',
        travelCost: 100,
        riskModifier: 0.7,
        priceModifier: 0.9,
        healCost: 350,
    },
    {
        id: 'nightclub_district',
        name: 'Neon Row',
        description: 'Neon lights and desperate buyers. Pills and acid run hot.',
        travelCost: 90,
        riskModifier: 1.1,
        priceModifier: 1.15,
        healCost: 300,
    },
    {
        id: 'college_area',
        name: 'College Strip',
        description: 'Campus kids buy cheap. Great for pills, shrooms, and acid.',
        travelCost: 85,
        riskModifier: 0.85,
        priceModifier: 0.8,
        healCost: 200,
    },
    {
        id: 'industrial_zone',
        name: 'Industrial Zone',
        description: 'Warehouses and loaders. Powder and rocks move in bulk.',
        travelCost: 70,
        riskModifier: 1.2,
        priceModifier: 0.95,
        healCost: 180,
    },
    {
        id: 'airport',
        name: 'Airport',
        description: 'High rollers, high prices, high risk. Everything costs more.',
        travelCost: 150,
        riskModifier: 1.5,
        priceModifier: 1.35,
        healCost: 500,
    },
];
/** Per-location commodity price bias (multiplier on generated price). */
exports.LOCATION_COMMODITY_BIAS = {
    nightclub_district: { pills: 1.2, acid: 1.25, flower: 0.9 },
    college_area: { pills: 0.85, shrooms: 0.8, acid: 0.85, rocks: 1.1 },
    industrial_zone: { powder: 0.85, rocks: 0.9, flower: 1.15 },
    airport: { rocks: 1.2, powder: 1.15, flower: 1.1 },
    projects: { flower: 0.8, pills: 0.85, rocks: 1.1 },
    suburbs: { flower: 1.05, pills: 1.0, powder: 1.1 },
};
exports.LOCATION_MAP = Object.fromEntries(exports.LOCATIONS.map((l) => [l.id, l]));
exports.STARTING_LOCATION_ID = 'downtown';
