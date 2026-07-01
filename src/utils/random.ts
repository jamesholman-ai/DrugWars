import { Commodity, CommodityId, PriceTrend } from '../types/game';
import { CityAreaDefinition, CityDefinition } from '../types/game';
import { BALANCE } from '../data/balanceConfig';

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('pickRandom called with empty array');
  }
  return items[randomInt(0, items.length - 1)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cityDrugMultiplier(
  commodityId: CommodityId,
  city: CityDefinition
): number {
  if (city.specialtyDrugs.includes(commodityId)) {
    return 0.35 + Math.random() * 0.25;
  }
  if (city.demandDrugs.includes(commodityId)) {
    return 2.2 + Math.random() * 3.5;
  }
  return 0.85 + Math.random() * 0.35;
}

/** Generate a dramatic price for a commodity at a city + area. */
export function generateCommodityPrice(
  commodity: Commodity,
  city: CityDefinition,
  area: CityAreaDefinition,
  random: () => number = Math.random,
  options: { volatilityScale?: number; extremeSpikeChance?: number; extremeCrashChance?: number } = {}
): number {
  const volatilityScale = options.volatilityScale ?? BALANCE.priceVolatility;
  const extremeSpikeChance = options.extremeSpikeChance ?? BALANCE.extremeSpikeChance;
  const extremeCrashChance = options.extremeCrashChance ?? BALANCE.extremeCrashChance;
  const vol = commodity.volatility * volatilityScale;
  const demandMod = area.demandModifiers[commodity.id] ?? 1;
  const cityMult = cityDrugMultiplier(commodity.id, city);
  const baseMin = commodity.minPrice * city.priceModifier * area.priceModifier * demandMod;
  const baseMax = commodity.maxPrice * city.priceModifier * area.priceModifier * demandMod;

  const locMin = baseMin * cityMult * 0.6;
  const locMax = baseMax * cityMult * 1.4;

  const roll = random();
  let t: number;

  if (roll < vol * 0.22) {
    t = random() * 0.18;
  } else if (roll > 1 - vol * 0.22) {
    t = 0.82 + random() * 0.18;
  } else if (roll < vol * 0.12) {
    t = random() * 0.35;
  } else if (roll > 1 - vol * 0.12) {
    t = 0.65 + random() * 0.35;
  } else {
    t = 0.25 + random() * 0.5;
  }

  let price = locMin + t * Math.max(locMax - locMin, 1);

  if (random() < extremeSpikeChance) {
    price *= 2.5 + random() * 5;
  } else if (random() < extremeCrashChance) {
    price *= 0.25 + random() * 0.35;
  }

  return Math.max(1, Math.round(price));
}

import {
  getMarketTrend,
  getMarketTrendArrowSymbol,
  getPreviousKnownPrice,
} from '../game/marketTrend';

export function computePriceTrend(
  current: number,
  history: number[] | undefined
): PriceTrend {
  const previousPrice = getPreviousKnownPrice(history);
  return getMarketTrend(current, previousPrice);
}

export function trendArrow(trend: PriceTrend): string {
  return getMarketTrendArrowSymbol(trend);
}
