/**
 * Market trend unit + flow tests.
 * Run: npx tsx src/game/marketTrendTest.ts
 */
import { createInitialGameState, stayHere } from './engine';
import { getPlayerAreaKey } from '../data/locations';
import { getMarketPriceChange } from '../utils/marketPriceDisplay';
import {
  getMarketTrend,
  getMarketTrendColor,
  getMarketTrendFromHistory,
  getPreviousKnownPrice,
} from './marketTrend';
import { normalizeGameState } from './stateUtils';
import { CommodityId } from '../types/game';
import { isDrugAvailableToBuy } from './marketAvailabilitySystem';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testDirectionBasics(): void {
  assert(getMarketTrend(100, 80) === 'up', '100 vs 80 => up');
  assert(getMarketTrend(80, 100) === 'down', '80 vs 100 => down');
  assert(getMarketTrend(100, 100) === 'flat', '100 vs 100 => flat');
  assert(getMarketTrend(100, null) === 'flat', 'missing previous => flat');
  assert(getMarketTrend(100, 0) === 'flat', 'zero previous => flat');
}

function testColorMapping(): void {
  assert(getMarketTrendColor('up') === 'green', 'up => green');
  assert(getMarketTrendColor('down') === 'red', 'down => red');
  assert(getMarketTrendColor('flat') === 'gray', 'flat => gray');
}

function testHistoryExtraction(): void {
  assert(getPreviousKnownPrice(undefined) === null, 'undefined history');
  assert(getPreviousKnownPrice([100]) === null, 'single entry');
  assert(getPreviousKnownPrice([80, 100]) === 80, 'second-to-last is previous');
  assert(getPreviousKnownPrice([0, 100]) === null, 'invalid previous');

  const fromHistory = getMarketTrendFromHistory(100, [80, 100]);
  assert(fromHistory.hasHistory && fromHistory.direction === 'up', 'history up');
  assert(fromHistory.previousPrice === 80, 'previous price from history');

  const noHistory = getMarketTrendFromHistory(100, [100]);
  assert(!noHistory.hasHistory && noHistory.direction === 'flat', 'no prior day => flat');
}

function testPriceChangeWrapper(): void {
  const up = getMarketPriceChange(100, [80, 100]);
  assert(up.trend === 'up' && up.hasHistory, 'wrapper up');
  assert(up.delta === 20, 'wrapper delta');

  const down = getMarketPriceChange(80, [100, 80]);
  assert(down.trend === 'down' && down.hasHistory, 'wrapper down');

  const flat = getMarketPriceChange(100, [100, 100]);
  assert(flat.trend === 'flat' && flat.hasHistory, 'wrapper flat');

  const missing = getMarketPriceChange(100, [100]);
  assert(!missing.hasHistory && missing.trend === 'flat', 'wrapper missing previous');
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

function testDayAdvanceFlow(): void {
  withStableRandom(() => {
    let state = normalizeGameState(createInitialGameState());
    const areaKey = getPlayerAreaKey(state.player);
    const drug: CommodityId = 'cocaine';
    const day1Price = state.marketPrices[areaKey]![drug]!;

    state = stayHere(state);
    assert(state.player.day === 2, 'day advances');

    const day2Price = state.marketPrices[areaKey]![drug]!;
    const history = state.priceHistory[areaKey]![drug]!;
    const change = getMarketPriceChange(day2Price, history);
    const expected = getMarketTrend(day2Price, day1Price);

    assert(change.trend === expected, `day2 trend matches day1 vs day2 (${expected})`);
    assert(change.hasHistory, 'day2 has prior price history');
    assert(history.length >= 2, 'history stores day1 and day2');
    assert(history[history.length - 2] === day1Price, 'history[-2] is day1 price');
  });
}

function testUnavailableTodayNoBuyRow(): void {
  withStableRandom(() => {
    const state = normalizeGameState(createInitialGameState());
    const unavailable = (['cocaine', 'heroin', 'weed'] as CommodityId[]).find(
      (id) => !isDrugAvailableToBuy(state, id)
    );
    assert(unavailable != null, 'find unavailable drug');
    const owned = state.player.inventory.find((i) => i.commodityId === unavailable)?.quantity ?? 0;
    assert(owned === 0, 'unavailable drug not owned by default');
  });
}

function run(): void {
  testDirectionBasics();
  testColorMapping();
  testHistoryExtraction();
  testPriceChangeWrapper();
  testDayAdvanceFlow();
  testUnavailableTodayNoBuyRow();
  console.log('marketTrendTest: all passed');
}

run();
