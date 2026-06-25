import {
  ActiveWorldEvent,
  AreaId,
  CommodityId,
  GameState,
  MarketPrices,
  WorldEventSeverity,
} from '../types/game';
import { EventType } from '../types/events';
import { COMMODITIES } from '../data/commodities';
import { getAllAreaKeys, getPlayerAreaKey, parseAreaKey } from '../data/locations';
import { isAirportArea } from '../data/areas';
import {
  MAX_ACTIVE_WORLD_EVENTS,
  SEVERITY_WEIGHTS,
  WORLD_EVENT_ROLL_CHANCE,
  WORLD_EVENT_TEMPLATES,
  WorldEventTemplate,
} from '../data/worldEvents';
import { randomInt } from '../utils/random';
import { weightedPick } from '../utils/weightedRandom';
import { withMessages } from './messages';

export function eventAppliesToLocation(
  event: ActiveWorldEvent,
  areaKey: string
): boolean {
  if (event.affectedLocations.length === 0) return true;
  if (event.affectedLocations.includes(areaKey)) return true;

  const parsed = parseAreaKey(areaKey);
  if (!parsed) return false;

  return event.affectedLocations.some((loc) => {
    if (loc === parsed.areaId || loc === parsed.cityId) return true;
    if (loc.endsWith(`:${parsed.areaId}`)) return true;
    return loc === areaKey;
  });
}

export function eventAppliesToCommodity(
  event: ActiveWorldEvent,
  commodityId: CommodityId
): boolean {
  return (
    event.affectedCommodities.length === 0 ||
    event.affectedCommodities.includes(commodityId)
  );
}

export function eventAppliesToPrice(
  event: ActiveWorldEvent,
  areaKey: string,
  commodityId: CommodityId
): boolean {
  if (event.priceMultiplier === 1) return false;
  if (event.affectedCommodities.length === 0) return false;
  return (
    eventAppliesToLocation(event, areaKey) &&
    eventAppliesToCommodity(event, commodityId)
  );
}

function getActiveEvents(state: GameState): ActiveWorldEvent[] {
  return state.activeWorldEvents ?? [];
}

export function capActiveWorldEvents(events: ActiveWorldEvent[]): ActiveWorldEvent[] {
  return events.slice(0, MAX_ACTIVE_WORLD_EVENTS);
}

export function daysRemaining(event: ActiveWorldEvent, currentDay: number): number {
  return Math.max(0, event.expiresDay - currentDay);
}

export function purgeExpiredWorldEvents(state: GameState): GameState {
  const day = state.player.day;
  const current = getActiveEvents(state);
  const active = capActiveWorldEvents(
    current.filter((ev) => ev.expiresDay > day)
  );

  if (
    active.length === current.length &&
    active.every((ev, index) => ev.id === current[index]?.id)
  ) {
    return state;
  }

  return { ...state, activeWorldEvents: active };
}

function pickSeverity(random: () => number): WorldEventSeverity {
  const picked = weightedPick(
    SEVERITY_WEIGHTS.map((s) => ({ item: s.severity, weight: s.weight })),
    random
  );
  return picked ?? 'low';
}

function pickSubset<T>(pool: T[], count: number, random: () => number): T[] {
  if (count <= 0 || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function spawnWorldEvent(
  template: WorldEventTemplate,
  startDay: number,
  random: () => number
): ActiveWorldEvent {
  const severity = pickSeverity(random);
  const duration = template.durationBySeverity[severity];

  let affectedLocations: string[] = [];
  if (template.maxAffectedLocations === 0) {
    affectedLocations = [];
  } else if (template.locationPool.length === 1) {
    affectedLocations = [...template.locationPool];
  } else {
    const count = randomInt(1, template.maxAffectedLocations);
    affectedLocations = pickSubset(template.locationPool, count, random);
  }

  let affectedCommodities: CommodityId[] = [];
  if (template.maxAffectedCommodities === 0) {
    affectedCommodities = [];
  } else {
    const count = randomInt(1, template.maxAffectedCommodities);
    affectedCommodities = pickSubset(template.commodityPool, count, random);
  }

  return {
    id: `we_${startDay}_${template.type}_${randomInt(1000, 9999)}`,
    type: template.type,
    title: template.title,
    description: template.description,
    affectedLocations,
    affectedCommodities,
    durationDays: duration,
    priceMultiplier: template.priceMultiplierBySeverity[severity],
    heatMultiplier: template.heatMultiplierBySeverity[severity],
    eventWeightModifiers: template.eventWeightModifiersBySeverity[severity],
    startDay,
    expiresDay: startDay + duration,
    severity,
  };
}

function pickSpawnTemplate(
  state: GameState,
  random: () => number
): WorldEventTemplate | null {
  const activeTypes = new Set(getActiveEvents(state).map((e) => e.type));
  const candidates = WORLD_EVENT_TEMPLATES.filter((t) => !activeTypes.has(t.type));
  if (candidates.length === 0) return null;

  return weightedPick(
    candidates.map((t) => ({ item: t, weight: t.spawnWeight })),
    random
  );
}

export function maybeRollWorldEvent(
  state: GameState,
  random: () => number = Math.random
): GameState {
  const current = getActiveEvents(state);
  if (current.length >= MAX_ACTIVE_WORLD_EVENTS) {
    return state;
  }
  if (random() > WORLD_EVENT_ROLL_CHANCE) {
    return state;
  }

  const template = pickSpawnTemplate(state, random);
  if (!template) {
    return state;
  }

  const event = spawnWorldEvent(template, state.player.day, random);
  const severityLabel = event.severity.toUpperCase();

  return withMessages(
    {
      ...state,
      activeWorldEvents: capActiveWorldEvents([...current, event]),
    },
    [
      `WORLD EVENT — ${event.title} (${severityLabel})`,
      `${event.description} (${event.durationDays} days)`,
    ]
  );
}

export function tickWorldEventsOnDayAdvance(
  state: GameState,
  random: () => number = Math.random
): GameState {
  let updated = purgeExpiredWorldEvents(state);
  updated = maybeRollWorldEvent(updated, random);
  return updated;
}

export function applyWorldEventsToPrices(
  prices: MarketPrices,
  events: ActiveWorldEvent[]
): MarketPrices {
  if (events.length === 0) {
    return prices;
  }

  const next: MarketPrices = { ...prices };
  const areaKeys = Object.keys(prices).length > 0 ? Object.keys(prices) : getAllAreaKeys();

  for (const areaKey of areaKeys) {
    next[areaKey] = { ...(next[areaKey] ?? {}) } as Record<CommodityId, number>;
    for (const commodity of COMMODITIES) {
      const base = prices[areaKey]?.[commodity.id] ?? next[areaKey][commodity.id] ?? 0;
      if (base <= 0) continue;
      let combinedMultiplier = 1;

      for (const event of events) {
        if (eventAppliesToPrice(event, areaKey, commodity.id)) {
          combinedMultiplier *= event.priceMultiplier;
        }
      }

      next[areaKey][commodity.id] = Math.max(1, Math.round(base * combinedMultiplier));
    }
  }

  return next;
}

export function getCombinedHeatMultiplier(
  state: GameState,
  areaKey?: string
): number {
  const loc = areaKey ?? getPlayerAreaKey(state.player);
  let mult = 1;

  for (const event of getActiveEvents(state)) {
    if (event.heatMultiplier === 1) continue;
    if (eventAppliesToLocation(event, loc)) {
      mult *= event.heatMultiplier;
    }
  }

  return mult;
}

export function getWorldEventWeightMultiplier(
  state: GameState,
  eventType: EventType
): number {
  let mult = 1;

  for (const event of getActiveEvents(state)) {
    const mod = event.eventWeightModifiers[eventType as keyof typeof event.eventWeightModifiers];
    if (mod != null && mod !== 1) {
      mult *= mod;
    }
  }

  return mult;
}

export function isTravelBlocked(
  state: GameState,
  areaKey: string
): { blocked: boolean; reason?: string } {
  const parsed = parseAreaKey(areaKey);
  if (!parsed || !isAirportArea(parsed.areaId)) {
    return { blocked: false };
  }

  for (const event of getActiveEvents(state)) {
    if (event.type !== 'airport_lockdown') continue;
    if (eventAppliesToLocation(event, areaKey)) {
      return {
        blocked: true,
        reason: 'Airport lockdown — terminal sealed. Try again when it lifts.',
      };
    }
  }
  return { blocked: false };
}

export function getActiveWorldEventsForLocation(
  state: GameState,
  areaKey: string
): ActiveWorldEvent[] {
  return getActiveEvents(state).filter((ev) =>
    eventAppliesToLocation(ev, areaKey)
  );
}

export function scalePositiveHeat(delta: number, multiplier: number): number {
  if (delta <= 0 || multiplier === 1) return delta;
  return Math.round(delta * multiplier);
}
