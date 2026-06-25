"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMODITY_MAP = exports.COMMODITIES = void 0;
exports.COMMODITIES = [
    {
        id: 'flower',
        name: 'Flower',
        minPrice: 12,
        maxPrice: 70,
        volatility: 0.3,
        riskLevel: 1,
    },
    {
        id: 'pills',
        name: 'Pills',
        minPrice: 45,
        maxPrice: 190,
        volatility: 0.35,
        riskLevel: 2,
    },
    {
        id: 'powder',
        name: 'Powder',
        minPrice: 180,
        maxPrice: 850,
        volatility: 0.45,
        riskLevel: 3,
    },
    {
        id: 'rocks',
        name: 'Rocks',
        minPrice: 750,
        maxPrice: 3400,
        volatility: 0.5,
        riskLevel: 4,
    },
    {
        id: 'acid',
        name: 'Acid',
        minPrice: 90,
        maxPrice: 420,
        volatility: 0.55,
        riskLevel: 2,
    },
    {
        id: 'shrooms',
        name: 'Shrooms',
        minPrice: 65,
        maxPrice: 280,
        volatility: 0.4,
        riskLevel: 2,
    },
];
exports.COMMODITY_MAP = Object.fromEntries(exports.COMMODITIES.map((c) => [c.id, c]));
