import { GameState } from '../types/game';
import { BusinessDefinition, DistrictListing } from '../types/businesses';
import { BUSINESSES, BUSINESS_MAP } from '../data/businesses';
import {
  DISTRICT_BUSINESS_POOL_SIZE,
  DISTRICT_BUSINESS_VISIBLE_MAX,
  DISTRICT_BUSINESS_VISIBLE_MIN,
} from '../data/businessTemplates';
import { getRankBenefitsForState } from '../data/rankBenefits';
import { getAreaKey } from '../data/locations';
import { createSeededRandom } from '../utils/seededRandom';
import { hashCombine } from '../utils/hash';
import { clamp } from '../utils/random';
import {
  generateBusinessDefinition,
  parseGeneratedBusinessId,
} from './businessGenerator';

const definitionCache = new Map<string, BusinessDefinition>();

function cacheDefinition(def: BusinessDefinition): BusinessDefinition {
  definitionCache.set(def.id, def);
  return def;
}

export function getRunSeed(state: GameState): number {
  if (state.runSeed != null && state.runSeed > 0) return state.runSeed;
  return hashCombine('fallback', state.player.day, state.progression.lifetimeProfit);
}

export function resolveBusinessDefinition(
  businessId: string,
  runSeed: number
): BusinessDefinition | undefined {
  const staticDef = BUSINESS_MAP[businessId];
  if (staticDef) return staticDef;

  const cached = definitionCache.get(businessId);
  if (cached) return cached;

  const parsed = parseGeneratedBusinessId(businessId);
  if (!parsed) return undefined;

  return cacheDefinition(
    generateBusinessDefinition(parsed.cityId, parsed.areaId, parsed.seedIndex, runSeed)
  );
}

export function getBusinessDef(state: GameState, businessId: string): BusinessDefinition | undefined {
  return resolveBusinessDefinition(businessId, getRunSeed(state));
}

function listingKey(cityId: string, areaId: string): string {
  return getAreaKey(cityId, areaId);
}

function shuffleIndices(count: number, random: () => number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function computeVisibleBusinessIds(
  cityId: string,
  areaId: string,
  runSeed: number,
  day: number,
  listingCount: number,
  ownedIds: string[]
): string[] {
  const poolSize = DISTRICT_BUSINESS_POOL_SIZE;
  const count = clamp(listingCount, DISTRICT_BUSINESS_VISIBLE_MIN, DISTRICT_BUSINESS_VISIBLE_MAX);
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, 'visible', day));
  const indices = shuffleIndices(poolSize, rng);

  const visible: string[] = [];
  const used = new Set<string>();

  for (const index of indices) {
    if (visible.length >= count) break;
    const def = generateBusinessDefinition(cityId, areaId, index, runSeed);
    if (used.has(def.id)) continue;
    used.add(def.id);
    cacheDefinition(def);
    visible.push(def.id);
  }

  for (const ownedId of ownedIds) {
    const parsed = parseGeneratedBusinessId(ownedId);
    if (parsed && parsed.cityId === cityId && parsed.areaId === areaId && !used.has(ownedId)) {
      visible.push(ownedId);
      used.add(ownedId);
    }
    if (BUSINESS_MAP[ownedId]?.cityId === cityId && BUSINESS_MAP[ownedId]?.areaId === areaId) {
      if (!used.has(ownedId)) {
        visible.push(ownedId);
        used.add(ownedId);
      }
    }
  }

  return visible;
}

export function refreshBusinessListings(
  state: GameState,
  options: { force?: boolean } = {}
): GameState {
  const { player } = state;
  const key = listingKey(player.currentCityId, player.currentAreaId);
  const listings = { ...(state.districtBusinessListings ?? {}) };
  const existing = listings[key];
  const runSeed = getRunSeed(state);
  const benefits = getRankBenefitsForState(state);

  const ownedAtLocation = (state.ownedBusinesses ?? [])
    .map((b) => b.businessId)
    .filter((id) => {
      const def = resolveBusinessDefinition(id, runSeed);
      return def?.cityId === player.currentCityId && def?.areaId === player.currentAreaId;
    });

  if (!options.force && existing && existing.refreshDay === player.day) {
    return state;
  }

  const visibleIds = computeVisibleBusinessIds(
    player.currentCityId,
    player.currentAreaId,
    runSeed,
    player.day,
    benefits.businessListingCount,
    ownedAtLocation
  );

  listings[key] = { refreshDay: player.day, visibleIds };

  return { ...state, districtBusinessListings: listings };
}

export function refreshAllBusinessListingsOnDayAdvance(state: GameState): GameState {
  return refreshBusinessListings({ ...state, districtBusinessListings: {} }, { force: true });
}

export function getBusinessesAtLocationFromPool(
  state: GameState,
  cityId: string,
  areaId: string
): BusinessDefinition[] {
  const runSeed = getRunSeed(state);
  const key = listingKey(cityId, areaId);
  let listing = state.districtBusinessListings?.[key];

  if (
    !listing &&
    cityId === state.player.currentCityId &&
    areaId === state.player.currentAreaId
  ) {
    const refreshed = refreshBusinessListings(state);
    listing = refreshed.districtBusinessListings?.[key];
  }

  const staticLocal = BUSINESSES.filter((b) => b.cityId === cityId && b.areaId === areaId);
  const generatedIds = listing?.visibleIds ?? [];

  const generated = generatedIds
    .map((id) => resolveBusinessDefinition(id, runSeed))
    .filter((d): d is BusinessDefinition => d != null && d.cityId === cityId && d.areaId === areaId);

  const merged = new Map<string, BusinessDefinition>();
  for (const def of [...staticLocal, ...generated]) {
    merged.set(def.id, def);
  }

  return [...merged.values()];
}

export function warmBusinessCache(state: GameState): void {
  const runSeed = getRunSeed(state);
  for (const owned of state.ownedBusinesses ?? []) {
    resolveBusinessDefinition(owned.businessId, runSeed);
  }
}

export function createInitialRunSeed(): number {
  return (Date.now() % 1_000_000_000) + Math.floor(Math.random() * 9999);
}

export function migrateDistrictBusinessListings(raw: unknown): Record<string, DistrictListing> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const result: Record<string, DistrictListing> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (typeof entry.refreshDay !== 'number' || !Array.isArray(entry.visibleIds)) continue;
    result[key] = {
      refreshDay: entry.refreshDay,
      visibleIds: entry.visibleIds.filter((id): id is string => typeof id === 'string'),
    };
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
