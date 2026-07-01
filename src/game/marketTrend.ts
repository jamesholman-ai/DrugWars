/** Pure market trend helpers — compare current price to last known price in area. */

export type MarketTrendDirection = 'up' | 'down' | 'flat';

export type MarketTrendColor = 'green' | 'red' | 'gray';

export type MarketTrendIcon = 'trendUp' | 'trendDown' | 'trendFlat';

export function getMarketTrend(
  currentPrice: number,
  previousPrice?: number | null
): MarketTrendDirection {
  if (previousPrice == null || previousPrice <= 0) return 'flat';
  if (currentPrice > previousPrice) return 'up';
  if (currentPrice < previousPrice) return 'down';
  return 'flat';
}

export function getPreviousKnownPrice(history: number[] | undefined): number | null {
  if (!history || history.length < 2) return null;
  const prev = history[history.length - 2];
  if (prev <= 0) return null;
  return prev;
}

export function getMarketTrendFromHistory(
  currentPrice: number,
  history: number[] | undefined
): {
  direction: MarketTrendDirection;
  previousPrice: number | null;
  hasHistory: boolean;
} {
  const previousPrice = getPreviousKnownPrice(history);
  return {
    direction: getMarketTrend(currentPrice, previousPrice),
    previousPrice,
    hasHistory: previousPrice != null,
  };
}

export function getMarketTrendColor(direction: MarketTrendDirection): MarketTrendColor {
  if (direction === 'up') return 'green';
  if (direction === 'down') return 'red';
  return 'gray';
}

export function getMarketTrendIcon(direction: MarketTrendDirection): MarketTrendIcon {
  if (direction === 'up') return 'trendUp';
  if (direction === 'down') return 'trendDown';
  return 'trendFlat';
}

export function getMarketTrendArrowSymbol(direction: MarketTrendDirection): string {
  if (direction === 'up') return '▲';
  if (direction === 'down') return '▼';
  return '—';
}
