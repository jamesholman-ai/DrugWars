import { CommodityId, GameState } from '../types/game';
import { COMMODITIES } from '../data/commodities';
import { CITY_AREA_MAP } from '../data/areas';
import { getDistrictArchetype, DistrictArchetype } from '../data/districtFlavor';
import { CITY_MAP, getPlayerAreaKey } from '../data/locations';
import { getRunSeed } from './businessPoolSystem';
import { getActiveWorldEventsForLocation } from './worldEvents';
import { hashCombine } from '../utils/hash';
import { createSeededRandom } from '../utils/seededRandom';

/** Base drug pools by district archetype — overlap within cities, not identical. */
const ARCHETYPE_DRUG_POOLS: Record<DistrictArchetype, CommodityId[]> = {
  downtown: ['cocaine', 'ecstasy', 'weed', 'mdma', 'heroin', 'speed', 'ketamine'],
  harbor: ['cocaine', 'heroin', 'meth', 'hashish', 'opium', 'crack', 'morphine'],
  industrial: ['meth', 'crack', 'heroin', 'pcp', 'speed', 'cocaine'],
  club_district: ['ecstasy', 'cocaine', 'ketamine', 'mushrooms', 'lsd', 'mdma'],
  college: ['weed', 'lsd', 'mushrooms', 'ecstasy', 'mdma', 'speed'],
  suburbs: ['weed', 'crack', 'heroin', 'ecstasy', 'speed', 'mdma'],
  airport: ['cocaine', 'heroin', 'mdma', 'ketamine', 'morphine'],
  general: ['weed', 'cocaine', 'crack', 'heroin', 'ecstasy', 'meth'],
};

export const MARKET_PERSONALITY_LABELS: Record<DistrictArchetype, string> = {
  downtown: 'Finance & nightlife mix',
  harbor: 'Import bulk lanes',
  industrial: 'Warehouse & rail trade',
  club_district: 'Party & VIP demand',
  college: 'Campus party circuit',
  suburbs: 'Residential street trade',
  airport: 'Courier & transit hub',
  general: 'Mixed street market',
};

const SHORTAGE_EVENT_TYPES = new Set([
  'market_shortage',
  'local_shortage',
  'city_shortage',
  'regional_shortage',
  'bad_batch',
  'dea_raid',
  'gang_war_supply_block',
  'port_seizure',
  'airport_lockdown',
]);

const SURPLUS_EVENT_TYPES = new Set([
  'market_crash',
  'supplier_flood',
  'local_surplus',
  'city_surplus',
  'police_warehouse_break_in',
  'cartel_dumping_product',
  'smuggling_route_opened',
]);

function validPoolForArea(areaId: string): CommodityId[] {
  const arch = getDistrictArchetype(areaId);
  const area = CITY_AREA_MAP[areaId];
  const base = new Set<CommodityId>(ARCHETYPE_DRUG_POOLS[arch] ?? ARCHETYPE_DRUG_POOLS.general);

  if (area?.demandModifiers) {
    for (const [drug, mod] of Object.entries(area.demandModifiers)) {
      if ((mod ?? 1) >= 1.05) base.add(drug as CommodityId);
    }
  }

  const city = CITY_MAP[area?.cityId ?? ''];
  if (city) {
    for (const d of city.specialtyDrugs) base.add(d);
    for (const d of city.demandDrugs) base.add(d);
  }

  return [...base].filter((id) => COMMODITIES.some((c) => c.id === id));
}

function pickDailySubset(
  pool: CommodityId[],
  rng: () => number,
  minCount: number,
  maxCount: number
): CommodityId[] {
  if (pool.length === 0) return [];
  const target = minCount + Math.floor(rng() * (maxCount - minCount + 1));
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(target, shuffled.length));
}

export function getMarketPersonality(areaId: string): string {
  return MARKET_PERSONALITY_LABELS[getDistrictArchetype(areaId)] ?? 'Mixed street market';
}

/** Deterministic daily buy list for an area — not persisted. */
export function getDailyAreaAvailability(
  state: GameState,
  cityId: string,
  areaId: string,
  day: number = state.player.day
): CommodityId[] {
  const pool = validPoolForArea(areaId);
  const runSeed = getRunSeed(state);
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, day, 'market-avail'));
  let available = pickDailySubset(pool, rng, 4, 7);

  const areaKey = `${cityId}:${areaId}`;
  const events = getActiveWorldEventsForLocation(state, areaKey);

  for (const event of events) {
    if (SHORTAGE_EVENT_TYPES.has(event.type)) {
      for (const drug of event.affectedCommodities) {
        available = available.filter((d) => d !== drug);
      }
    }
    if (SURPLUS_EVENT_TYPES.has(event.type)) {
      for (const drug of event.affectedCommodities) {
        if (!available.includes(drug)) available.push(drug);
      }
    }
  }

  return [...new Set(available)];
}

export function isDrugAvailableToBuy(
  state: GameState,
  commodityId: CommodityId,
  cityId: string = state.player.currentCityId,
  areaId: string = state.player.currentAreaId
): boolean {
  return getDailyAreaAvailability(state, cityId, areaId).includes(commodityId);
}

/** Local buyers exist if drug is in today's availability, has demand boost, or surplus event. */
export function hasLocalBuyers(
  state: GameState,
  commodityId: CommodityId,
  cityId: string = state.player.currentCityId,
  areaId: string = state.player.currentAreaId
): boolean {
  if (isDrugAvailableToBuy(state, commodityId, cityId, areaId)) return true;

  const area = CITY_AREA_MAP[areaId];
  const demand = area?.demandModifiers[commodityId] ?? 1;
  if (demand >= 1.08) return true;

  const areaKey = `${cityId}:${areaId}`;
  for (const event of getActiveWorldEventsForLocation(state, areaKey)) {
    if (
      SURPLUS_EVENT_TYPES.has(event.type) &&
      (event.affectedCommodities.length === 0 || event.affectedCommodities.includes(commodityId))
    ) {
      return true;
    }
    if (
      (event.type === 'market_boom' || event.type === 'festival_demand_surge') &&
      event.affectedCommodities.includes(commodityId)
    ) {
      return true;
    }
  }

  return false;
}

export function getPlayerDailyAvailability(state: GameState): CommodityId[] {
  return getDailyAreaAvailability(
    state,
    state.player.currentCityId,
    state.player.currentAreaId
  );
}

export function getAreaMarketEventTag(
  state: GameState,
  commodityId: CommodityId
): string | undefined {
  const areaKey = getPlayerAreaKey(state.player);
  for (const event of getActiveWorldEventsForLocation(state, areaKey)) {
    if (!event.affectedCommodities.includes(commodityId) && event.affectedCommodities.length > 0) {
      continue;
    }
    if (SHORTAGE_EVENT_TYPES.has(event.type)) return 'SHORTAGE';
    if (SURPLUS_EVENT_TYPES.has(event.type)) return 'SURPLUS';
    if (event.type === 'market_boom' || event.type === 'festival_demand_surge') return 'DEMAND SURGE';
    if (event.type === 'market_crash') return 'PRICE DROP';
    if (event.type === 'market_shortage') return 'SHORTAGE';
  }
  return undefined;
}

export function availabilityDiffersByArea(state: GameState, cityId: string, day?: number): boolean {
  const areas = Object.values(CITY_AREA_MAP).filter((a) => a.cityId === cityId);
  if (areas.length < 2) return false;
  const d = day ?? state.player.day;
  const sets = areas.map((a) =>
    getDailyAreaAvailability(state, cityId, a.id, d).sort().join(',')
  );
  return new Set(sets).size > 1;
}
