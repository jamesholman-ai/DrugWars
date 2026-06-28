import { ActiveWorldEvent, CommodityId, PriceTrend } from '../types/game';
import { eventAppliesToPrice } from '../game/worldEvents';
import { formatMoney } from './format';

const FLAT_THRESHOLD = 0.08;
const MAJOR_SWING_THRESHOLD = 0.25;

export interface MarketPriceChange {
  previousPrice: number | null;
  delta: number | null;
  percentChange: number | null;
  trend: PriceTrend;
  hasHistory: boolean;
  isMajorSwing: boolean;
}

export function getMarketPriceChange(
  current: number,
  history: number[] | undefined
): MarketPriceChange {
  if (!history || history.length < 2) {
    return {
      previousPrice: null,
      delta: null,
      percentChange: null,
      trend: 'flat',
      hasHistory: false,
      isMajorSwing: false,
    };
  }

  const previousPrice = history[history.length - 2];
  if (previousPrice <= 0) {
    return {
      previousPrice: null,
      delta: null,
      percentChange: null,
      trend: 'flat',
      hasHistory: false,
      isMajorSwing: false,
    };
  }

  const delta = current - previousPrice;
  const percentChange = delta / previousPrice;
  const absChange = Math.abs(percentChange);

  let trend: PriceTrend = 'flat';
  if (percentChange >= FLAT_THRESHOLD) trend = 'up';
  else if (percentChange <= -FLAT_THRESHOLD) trend = 'down';

  return {
    previousPrice,
    delta,
    percentChange,
    trend,
    hasHistory: true,
    isMajorSwing: absChange >= MAJOR_SWING_THRESHOLD,
  };
}

/** @deprecated Prefer getMarketPriceChange from marketPriceDisplay. */
export function computePriceTrend(
  current: number,
  history: number[] | undefined
): PriceTrend {
  return getMarketPriceChange(current, history).trend;
}

export function trendArrow(trend: PriceTrend, hasHistory: boolean): string {
  if (!hasHistory) return '◆';
  if (trend === 'up') return '▲';
  if (trend === 'down') return '▼';
  return '◆';
}

export function formatPriceDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '−';
  return `${sign}${formatMoney(Math.abs(delta))}`;
}

export function formatPercentChange(percentChange: number): string {
  const pct = percentChange * 100;
  const sign = pct >= 0 ? '+' : '−';
  const abs = Math.abs(pct);
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  return `${sign}${formatted}%`;
}

const WORLD_EVENT_BADGE_LABELS: Partial<Record<ActiveWorldEvent['type'], string>> = {
  market_shortage: 'SHORTAGE',
  market_boom: 'BOOM',
  market_crash: 'CRASH',
  supplier_flood: 'FLOOD',
  airport_lockdown: 'LOCKDOWN',
};

export function getCommodityWorldEventBadge(
  events: ActiveWorldEvent[],
  areaKey: string,
  commodityId: CommodityId
): string | null {
  for (const event of events) {
    if (!eventAppliesToPrice(event, areaKey, commodityId)) continue;
    const label = WORLD_EVENT_BADGE_LABELS[event.type];
    if (label) return label;
  }
  return null;
}

export type MarketTrendTone = 'new' | 'rising' | 'falling' | 'flat' | 'major';

export function getMarketTrendTone(change: MarketPriceChange): MarketTrendTone {
  if (!change.hasHistory) return 'new';
  if (change.isMajorSwing) return 'major';
  if (change.trend === 'up') return 'rising';
  if (change.trend === 'down') return 'falling';
  return 'flat';
}

export interface PriceHistoryStats {
  high: number;
  low: number;
  confidence: 'low' | 'moderate' | 'high';
}

export function getPriceHistoryStats(
  current: number,
  history: number[] | undefined
): PriceHistoryStats | null {
  const series = history?.length ? [...history.slice(-24), current] : current > 0 ? [current] : [];
  if (series.length < 2) return null;
  const high = Math.max(...series);
  const low = Math.min(...series);
  const spread = high - low;
  const avg = series.reduce((a, b) => a + b, 0) / series.length;
  const volatility = avg > 0 ? spread / avg : 0;
  const confidence: PriceHistoryStats['confidence'] =
    volatility >= 0.35 ? 'low' : volatility >= 0.15 ? 'moderate' : 'high';
  return { high, low, confidence };
}
