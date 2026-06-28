import { GameState } from '../types/game';
import { COMMODITIES } from '../data/commodities';
import { getActiveWorldEventsForLocation } from './worldEvents';
import { getPlayerAreaKey } from '../data/locations';

export interface MarketSentiment {
  headline: string;
  detail?: string;
  sentiment: 'bullish' | 'bearish' | 'volatile' | 'calm';
}

/** Computed market mood from calendar + world events — presentation only. */
export function getMarketSentimentHeadline(
  state: GameState,
  cityId: string
): MarketSentiment | null {
  const { player } = state;
  const day = player.day;
  const weekend = day % 7 === 0 || day % 7 === 6;
  const areaKey = getPlayerAreaKey(player);
  const localEvents = getActiveWorldEventsForLocation(state, areaKey);

  for (const evt of localEvents) {
    if (evt.type === 'market_shortage') {
      return {
        headline: 'Supply shock — scarcity driving prices up',
        detail: 'Police raids and drought rumors reduce street supply.',
        sentiment: 'bullish',
      };
    }
    if (evt.type === 'market_crash') {
      return {
        headline: 'Market crash — buyers sitting on cash',
        sentiment: 'bearish',
      };
    }
    if (evt.type === 'police_crackdown') {
      return {
        headline: 'Raid activity reduces visible supply',
        detail: 'Dealers lay low; prices volatile block to block.',
        sentiment: 'volatile',
      };
    }
    if (evt.type === 'supplier_flood') {
      return {
        headline: 'Supplier flood — wholesale prices softening',
        sentiment: 'bearish',
      };
    }
  }

  if (weekend) {
    const clubDrugs = ['mdma', 'cocaine', 'ketamine'];
    const names = COMMODITIES.filter((c) => clubDrugs.includes(c.id))
      .map((c) => c.name)
      .slice(0, 2)
      .join(' & ');
    return {
      headline: `Weekend nightlife boosts ${names} demand`,
      detail: 'Club district buyers paying premium after midnight.',
      sentiment: 'bullish',
    };
  }

  if (day % 11 === 0) {
    return {
      headline: 'Music festival weekend — ecstasy demand surging',
      sentiment: 'bullish',
    };
  }

  if (day % 13 === 0) {
    return {
      headline: 'Port strike rumors delay import shipments',
      detail: 'Wholesale delays ripple inland over the next few days.',
      sentiment: 'volatile',
    };
  }

  if (day % 17 === 0) {
    return {
      headline: 'Holiday tourism shifts buyer patterns',
      detail: 'Coastal cities see mixed demand by product tier.',
      sentiment: 'calm',
    };
  }

  if (day % 19 === 0) {
    return {
      headline: 'Weather delays reported on freight corridors',
      sentiment: 'volatile',
    };
  }

  return null;
}

export function getMarketPulseLabel(state: GameState, areaKey: string): string | null {
  const sentiment = getMarketSentimentHeadline(state, state.player.currentCityId);
  if (sentiment) return sentiment.headline;
  return null;
}
