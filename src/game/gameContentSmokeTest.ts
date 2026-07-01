/**
 * Content & travel smoke tests.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/gameContentSmokeTest.ts
 */
import { COMMODITIES } from '../data/commodities';
import { CITIES, getAreasForCity } from '../data/locations';
import { resolveAreaIdForCity, STARTING_AREA_ID } from '../data/areas';
import { getPriceDropScenarioCount } from '../data/priceDropScenarios';
import { getPriceSpikeScenarioCount } from '../data/priceSpikeScenarios';
import { getIntelCombinationCount } from '../data/intelTemplates';
import { createInitialGameState, buyCommodity, sellCommodity, travelToArea, travelToCity } from './engine';
import { getAreaMovesToday } from './financeSystem';
import { assertFourAreasPerCity } from './empireSummary';
import {
  availabilityDiffersByArea,
  getDailyAreaAvailability,
  hasLocalBuyers,
  isDrugAvailableToBuy,
} from './marketAvailabilitySystem';
import { getTopActiveIntel, seedHiddenIntel } from './intelSystem';
import { applyWorldEventsToPrices } from './worldEvents';
import { migrateGameState } from './saveStorage';
import { normalizeGameState } from './stateUtils';
import { ActiveWorldEvent, CommodityId, GameState } from '../types/game';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function withStableRandom<T>(fn: () => T): T {
  const original = Math.random;
  Math.random = () => 0.42;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function testFourAreasPerCity(): void {
  assertFourAreasPerCity(getAreasForCity);
  assert(getAreasForCity('new_york').length === 4, 'NY has 4 areas');
}

function testLegacyAreaMigration(): void {
  assert(resolveAreaIdForCity('new_york', 'new_york_harlem') === 'new_york_brooklyn', 'harlem→brooklyn');
  assert(resolveAreaIdForCity('new_york', 'new_york_queens') === 'new_york_harbor', 'queens→harbor');
  assert(resolveAreaIdForCity('miami', 'miami_beach_district') === 'miami_south_beach', 'beach→south_beach');
  assert(resolveAreaIdForCity('los_angeles', 'los_angeles_south_central') === 'los_angeles_compton', 'compton map');

  const envelope = {
    version: 10,
    savedAt: new Date().toISOString(),
    state: {
      ...normalizeGameState(createInitialGameState()),
      player: {
        ...createInitialGameState().player,
        currentCityId: 'new_york',
        currentAreaId: 'new_york_harlem',
      },
    },
  };
  const migrated = migrateGameState(envelope);
  assert(migrated!.player.currentAreaId === 'new_york_brooklyn', 'save migrates harlem');
}

function testMarketAvailability(): void {
  let state = normalizeGameState(createInitialGameState());
  const nyAreas = getAreasForCity('new_york');
  const sets = nyAreas.map((a) =>
    getDailyAreaAvailability(state, 'new_york', a.id).sort().join(',')
  );
  assert(new Set(sets).size > 1, 'NY area availability differs');
  assert(availabilityDiffersByArea(state, 'new_york'), 'availabilityDiffersByArea');

  const allEveryDay = COMMODITIES.every((c) =>
    isDrugAvailableToBuy(state, c.id)
  );
  assert(!allEveryDay, 'not all drugs available at once');

  const areaKey = `${state.player.currentCityId}:${state.player.currentAreaId}`;
  const prices = state.marketPrices[areaKey]!;
  const available = getDailyAreaAvailability(
    state,
    state.player.currentCityId,
    state.player.currentAreaId
  );
  const buyDrug = available.find((d) => (prices[d] ?? 0) > 0) ?? available[0]!;
  assert((prices[buyDrug] ?? 0) > 0, 'available drug has price');
  state = buyCommodity(state, buyDrug, 1);
  assert(
    state.player.inventory.some((i) => i.commodityId === buyDrug && i.quantity > 0),
    'buy works for available drug'
  );

  const unavailable = COMMODITIES.find((c) => !available.includes(c.id))!.id;
  const beforeCash = state.player.cash;
  state = buyCommodity(state, unavailable, 1);
  assert(state.player.cash === beforeCash, 'cannot buy unavailable drug');
}

function testShortageSurplusAvailability(): void {
  let state = normalizeGameState(createInitialGameState());
  const drug: CommodityId = 'cocaine';
  const areaKey = `${state.player.currentCityId}:${state.player.currentAreaId}`;
  const shortage: ActiveWorldEvent = {
    id: 'test_shortage',
    type: 'local_shortage',
    title: 'Local Shortage',
    description: 'Test',
    affectedLocations: [areaKey],
    affectedCommodities: [drug],
    durationDays: 2,
    priceMultiplier: 3,
    heatMultiplier: 1,
    eventWeightModifiers: {},
    startDay: 1,
    expiresDay: 3,
    severity: 'medium',
  };
  state = { ...state, activeWorldEvents: [shortage] };
  const avail = getDailyAreaAvailability(
    state,
    state.player.currentCityId,
    state.player.currentAreaId
  );
  assert(!avail.includes(drug), 'shortage removes drug from availability');

  const surplus: ActiveWorldEvent = {
    ...shortage,
    id: 'test_surplus',
    type: 'local_surplus',
    priceMultiplier: 0.5,
    affectedCommodities: ['heroin'],
  };
  state = { ...state, activeWorldEvents: [surplus] };
  const avail2 = getDailyAreaAvailability(
    state,
    state.player.currentCityId,
    state.player.currentAreaId
  );
  assert(avail2.includes('heroin'), 'surplus adds drug');
}

function testPriceScenarioMultipliers(): void {
  const base = normalizeGameState(createInitialGameState());
  const areaKey = `${base.player.currentCityId}:${base.player.currentAreaId}`;
  const prices = base.marketPrices[areaKey]!;
  const drug: CommodityId = 'cocaine';
  const basePrice = prices[drug]!;

  const spike: ActiveWorldEvent = {
    id: 'spike',
    type: 'market_shortage',
    title: 'Spike',
    description: 'Test spike',
    affectedLocations: [areaKey],
    affectedCommodities: [drug],
    durationDays: 2,
    priceMultiplier: 4,
    heatMultiplier: 1,
    eventWeightModifiers: {},
    startDay: 1,
    expiresDay: 3,
    severity: 'high',
  };
  const spiked = applyWorldEventsToPrices(base.marketPrices, [spike]);
  assert(spiked[areaKey]![drug]! > basePrice, 'spike raises price');

  const drop: ActiveWorldEvent = { ...spike, id: 'drop', type: 'market_crash', priceMultiplier: 0.4 };
  const dropped = applyWorldEventsToPrices(base.marketPrices, [drop]);
  assert(dropped[areaKey]![drug]! < basePrice, 'drop lowers price');
}

function testIntelPoolAndTopLimit(): void {
  let state = normalizeGameState(createInitialGameState());
  state = seedHiddenIntel(state, 8, () => 0.5);
  assert((state.hiddenOpportunities ?? []).length > 0, 'hidden intel seeded');
  assert(getIntelCombinationCount() >= 1000, '1000+ intel combinations');
  assert(getPriceSpikeScenarioCount() >= 100, '100+ spike scenarios');
  assert(getPriceDropScenarioCount() >= 100, '100+ drop scenarios');

  state = {
    ...state,
    activeIntel: (state.hiddenOpportunities ?? []).slice(0, 5).map((e) => ({
      ...e,
      revealed: true,
    })),
  };
  assert(getTopActiveIntel(state).length <= 3, 'top intel capped at 3');
}

function testTravelRules(): void {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    player: { ...state.player, cash: 50000, day: 5 },
    areaMovesToday: 0,
    lastAreaMoveDay: 5,
  };
  const day = state.player.day;
  state = withStableRandom(() => travelToArea(state, 'new_york_harbor'));
  assert(state.player.day === day, 'move 1 no day advance');
  state = withStableRandom(() => travelToArea(state, 'new_york_brooklyn'));
  assert(state.player.day === day, 'move 2 no day advance');
  state = withStableRandom(() => travelToArea(state, 'new_york_club_district'));
  assert(state.player.day === day + 1, 'move 3 advances day');
  assert(getAreaMovesToday(state) === 0, 'counter reset');

  state = {
    ...normalizeGameState(createInitialGameState()),
    player: {
      ...createInitialGameState().player,
      cash: 50000,
      day: 10,
      currentCityId: 'new_york',
      currentAreaId: STARTING_AREA_ID,
    },
    progression: {
      ...createInitialGameState().progression,
      unlockedCities: CITIES.map((c) => c.id),
    },
  };
  const d = state.player.day;
  state = withStableRandom(() => travelToCity(state, 'miami'));
  assert(state.player.day === d + 1, 'city travel advances day');
}

function run(): void {
  testFourAreasPerCity();
  testLegacyAreaMigration();
  testMarketAvailability();
  testShortageSurplusAvailability();
  testPriceScenarioMultipliers();
  testIntelPoolAndTopLimit();
  testTravelRules();
  console.log('gameContentSmokeTest: all passed');
}

run();
