"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomInt = randomInt;
exports.pickRandom = pickRandom;
exports.clamp = clamp;
exports.generateCommodityPrice = generateCommodityPrice;
const locations_1 = require("../data/locations");
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pickRandom(items) {
    if (items.length === 0) {
        throw new Error('pickRandom called with empty array');
    }
    return items[randomInt(0, items.length - 1)];
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
/** Generate a price within commodity min/max, skewed by location and volatility. */
function generateCommodityPrice(commodity, location) {
    const bias = locations_1.LOCATION_COMMODITY_BIAS[location.id]?.[commodity.id] ?? 1;
    const locMin = commodity.minPrice * location.priceModifier * bias;
    const locMax = commodity.maxPrice * location.priceModifier * bias;
    // Volatility can push toward extremes
    const roll = Math.random();
    let t;
    if (roll < commodity.volatility * 0.3) {
        t = Math.random() * 0.25; // crash low
    }
    else if (roll > 1 - commodity.volatility * 0.3) {
        t = 0.75 + Math.random() * 0.25; // spike high
    }
    else {
        t = Math.random();
    }
    return Math.max(1, Math.round(locMin + t * (locMax - locMin)));
}
