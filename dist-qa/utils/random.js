"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomInt = randomInt;
exports.pickRandom = pickRandom;
exports.clamp = clamp;
exports.generateCommodityPrice = generateCommodityPrice;
exports.computePriceTrend = computePriceTrend;
exports.trendArrow = trendArrow;
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
function cityDrugMultiplier(commodityId, city) {
    if (city.specialtyDrugs.includes(commodityId)) {
        return 0.35 + Math.random() * 0.25;
    }
    if (city.demandDrugs.includes(commodityId)) {
        return 2.2 + Math.random() * 3.5;
    }
    return 0.85 + Math.random() * 0.35;
}
/** Generate a dramatic price for a commodity at a city + area. */
function generateCommodityPrice(commodity, city, area, random = Math.random) {
    const demandMod = area.demandModifiers[commodity.id] ?? 1;
    const cityMult = cityDrugMultiplier(commodity.id, city);
    const baseMin = commodity.minPrice * city.priceModifier * area.priceModifier * demandMod;
    const baseMax = commodity.maxPrice * city.priceModifier * area.priceModifier * demandMod;
    const locMin = baseMin * cityMult * 0.6;
    const locMax = baseMax * cityMult * 1.4;
    const roll = random();
    let t;
    if (roll < commodity.volatility * 0.22) {
        t = random() * 0.18;
    }
    else if (roll > 1 - commodity.volatility * 0.22) {
        t = 0.82 + random() * 0.18;
    }
    else if (roll < commodity.volatility * 0.12) {
        t = random() * 0.35;
    }
    else if (roll > 1 - commodity.volatility * 0.12) {
        t = 0.65 + random() * 0.35;
    }
    else {
        t = 0.25 + random() * 0.5;
    }
    let price = locMin + t * Math.max(locMax - locMin, 1);
    if (random() < 0.06) {
        price *= 3 + random() * 7;
    }
    else if (random() < 0.08) {
        price *= 0.2 + random() * 0.4;
    }
    return Math.max(1, Math.round(price));
}
function computePriceTrend(current, history) {
    if (!history || history.length === 0)
        return 'flat';
    const prev = history[history.length - 1];
    if (prev <= 0)
        return 'flat';
    const delta = (current - prev) / prev;
    if (delta >= 0.08)
        return 'up';
    if (delta <= -0.08)
        return 'down';
    return 'flat';
}
function trendArrow(trend) {
    if (trend === 'up')
        return '▲';
    if (trend === 'down')
        return '▼';
    return '→';
}
