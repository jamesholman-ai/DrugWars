import { GameState, CommodityId } from '../types/game';
import { CityNewsEntry } from '../types/cityNews';
import { WORLD_EVENT_TEMPLATE_MAP } from '../data/worldEvents';
import { CITY_MAP, getAreaLabel, getPlayerAreaKey } from '../data/locations';
import { COMMODITY_MAP } from '../data/commodities';
import { getBusinessDef } from './businessPoolSystem';
import { SAFEHOUSE_MAP } from '../data/safehouses';
import { getReputationFlavor } from '../data/reputationFlavor';
import { getMarketSentimentHeadline } from './marketSentiment';
import { FINANCE_LOG_KIND_LABELS } from '../types/finance';
import { daysRemaining } from './worldEvents';

const MAX_NEWS = 8;

function pushUnique(entries: CityNewsEntry[], entry: CityNewsEntry): void {
  if (entries.some((e) => e.id === entry.id)) return;
  entries.push(entry);
}

/** Aggregate live news from world events, finance, empire, and flavor — nothing persisted. */
export function buildCityNewsFeed(
  state: GameState,
  options: { cityId?: string; limit?: number } = {}
): CityNewsEntry[] {
  const { player } = state;
  const cityId = options.cityId ?? player.currentCityId;
  const limit = options.limit ?? MAX_NEWS;
  const entries: CityNewsEntry[] = [];
  const areaKey = getPlayerAreaKey(player);
  const cityName = CITY_MAP[cityId]?.name ?? 'The city';

  for (const event of state.activeWorldEvents ?? []) {
    const tpl = WORLD_EVENT_TEMPLATE_MAP[event.type];
    const local =
      event.affectedLocations.length === 0 ||
      event.affectedLocations.includes(areaKey) ||
      event.affectedLocations.some((loc) => loc.startsWith(`${cityId}:`));
    const days = daysRemaining(event, player.day);
    const drugs =
      event.affectedCommodities.length > 0
        ? event.affectedCommodities
            .map((id) => COMMODITY_MAP[id]?.name ?? id)
            .slice(0, 2)
            .join(', ')
        : null;

    let headline = tpl?.title ?? event.type.replace(/_/g, ' ');
    if (event.type === 'police_crackdown' && local) {
      headline = `Police seize major shipment in ${cityName}`;
    } else if (event.type === 'gang_war' && local) {
      headline = `Gang violence erupts ${local ? 'nearby' : 'across the region'}`;
    } else if (event.type === 'market_boom' && drugs) {
      headline = `Record ${drugs} prices reported in ${cityName}`;
    } else if (event.type === 'market_shortage' && drugs) {
      headline = `${drugs} supply dries up — prices spike`;
    } else if (event.type === 'airport_lockdown') {
      headline = `Customs tighten airport inspections`;
    } else if (event.type === 'market_crash' && drugs) {
      headline = `${drugs} market crashes — buyers disappear`;
    }

    pushUnique(entries, {
      id: `news_world_${event.id}`,
      day: player.day,
      headline,
      detail: tpl?.description,
      category: event.type === 'police_crackdown' ? 'police' : 'world',
      tone: event.severity === 'high' ? 'urgent' : event.severity === 'medium' ? 'bad' : 'neutral',
      sentiment:
        event.type === 'market_boom' || event.type === 'supplier_flood'
          ? 'bullish'
          : event.type === 'market_crash' || event.type === 'market_shortage'
            ? 'bearish'
            : 'volatile',
    });
    void days;
  }

  const sentiment = getMarketSentimentHeadline(state, cityId);
  if (sentiment) {
    pushUnique(entries, {
      id: `news_sentiment_${player.day}`,
      day: player.day,
      headline: sentiment.headline,
      detail: sentiment.detail,
      category: 'market',
      tone: 'neutral',
      sentiment: sentiment.sentiment,
    });
  }

  const repFlavor = getReputationFlavor(player.reputation);
  if (player.reputation >= 45) {
    pushUnique(entries, {
      id: `news_rep_${player.day}`,
      day: player.day,
      headline: repFlavor.mediaLine,
      detail: repFlavor.headline,
      category: 'reputation',
      tone: player.reputation >= 60 ? 'good' : 'neutral',
    });
  }

  for (const log of (state.financeLog ?? []).slice(0, 4)) {
    const kindLabel = FINANCE_LOG_KIND_LABELS[log.kind] ?? log.kind;
    pushUnique(entries, {
      id: `news_fin_${log.id}`,
      day: log.day,
      headline: log.message,
      detail: kindLabel,
      category: 'finance',
      tone:
        log.kind === 'business_income' || log.kind === 'laundered'
          ? 'good'
          : log.kind === 'payroll_paid' || log.kind === 'business_upkeep'
            ? 'neutral'
            : 'neutral',
    });
  }

  for (const record of state.ownedBusinesses ?? []) {
    for (const evt of (record.recentEvents ?? []).slice(0, 1)) {
      const def = getBusinessDef(state, record.businessId);
      pushUnique(entries, {
        id: `news_biz_${evt.id}`,
        day: evt.day,
        headline: `${def?.name ?? 'Front'}: ${evt.message}`,
        category: 'empire',
        tone: evt.tone === 'good' ? 'good' : evt.tone === 'bad' ? 'bad' : 'neutral',
      });
    }
  }

  for (const record of state.ownedSafehouses ?? []) {
    for (const evt of (record.recentEvents ?? []).slice(0, 1)) {
      const def = SAFEHOUSE_MAP[record.safehouseId];
      pushUnique(entries, {
        id: `news_prop_${evt.id}`,
        day: evt.day,
        headline: `${def?.name ?? 'Property'}: ${evt.message}`,
        category: 'empire',
        tone: evt.tone === 'good' ? 'good' : evt.tone === 'bad' ? 'bad' : 'neutral',
      });
    }
  }

  for (const member of state.hiredCrew ?? []) {
    if (member.status !== 'hired') continue;
    for (const evt of (member.recentEvents ?? []).slice(0, 1)) {
      pushUnique(entries, {
        id: `news_crew_${evt.id}`,
        day: evt.day,
        headline: `${member.name}: ${evt.message}`,
        category: 'empire',
        tone: evt.tone === 'good' ? 'good' : evt.tone === 'bad' ? 'bad' : 'neutral',
      });
    }
  }

  for (const msg of (state.messageLog ?? []).slice(0, 2)) {
    if (!msg || msg.length < 12) continue;
    pushUnique(entries, {
      id: `news_log_${msg.slice(0, 24)}_${player.day}`,
      day: player.day,
      headline: msg.length > 72 ? `${msg.slice(0, 69)}…` : msg,
      category: 'flavor',
      tone: 'neutral',
    });
  }

  if (player.heat >= 70) {
    pushUnique(entries, {
      id: `news_heat_${player.day}`,
      day: player.day,
      headline: `Police activity elevated in ${getAreaLabel(cityId, player.currentAreaId)}`,
      detail: 'Patrols increased. Lay low or move product carefully.',
      category: 'police',
      tone: 'urgent',
      sentiment: 'volatile',
    });
  }

  entries.sort((a, b) => b.day - a.day || a.id.localeCompare(b.id));
  return entries.slice(0, limit);
}

export function getTopPriceMover(
  state: GameState,
  areaKey: string
): { commodityId: CommodityId; name: string; deltaPct: number } | null {
  const prices = state.marketPrices[areaKey];
  const history = state.priceHistory?.[areaKey];
  if (!prices || !history) return null;

  let best: { commodityId: CommodityId; name: string; deltaPct: number } | null = null;
  for (const [id, price] of Object.entries(prices)) {
    const chain = history[id as CommodityId];
    if (!chain || chain.length < 2) continue;
    const prev = chain[chain.length - 2];
    if (prev <= 0) continue;
    const deltaPct = Math.round(((price - prev) / prev) * 100);
    if (!best || Math.abs(deltaPct) > Math.abs(best.deltaPct)) {
      best = {
        commodityId: id as CommodityId,
        name: COMMODITY_MAP[id as CommodityId]?.name ?? id,
        deltaPct,
      };
    }
  }
  return best;
}
