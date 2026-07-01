import { GameState } from '../types/game';
import { DistrictListing } from '../types/businesses';
import { SafehouseDefinition } from '../types/safehouses';
import { SAFEHOUSES, SAFEHOUSE_MAP } from '../data/safehouses';
import {
  PROPERTY_VISIBLE_MAX,
  PROPERTY_VISIBLE_MIN,
  PROPERTY_POOL_SIZE,
} from '../data/propertyTemplates';
import { getRunSeed } from './businessPoolSystem';
import { getAreaKey } from '../data/locations';
import { createSeededRandom } from '../utils/seededRandom';
import { hashCombine } from '../utils/hash';
import { clamp } from '../utils/random';
import { generatePropertyDefinition, parseGeneratedPropertyId } from './propertyGenerator';

const definitionCache = new Map<string, SafehouseDefinition>();

function cacheDefinition(def: SafehouseDefinition): SafehouseDefinition {
  definitionCache.set(def.id, def);
  return def;
}

export function resolvePropertyDefinition(
  propertyId: string,
  runSeed: number
): SafehouseDefinition | undefined {
  const staticDef = SAFEHOUSE_MAP[propertyId];
  if (staticDef) return staticDef;

  const cached = definitionCache.get(propertyId);
  if (cached) return cached;

  const parsed = parseGeneratedPropertyId(propertyId);
  if (!parsed) return undefined;

  return cacheDefinition(
    generatePropertyDefinition(parsed.cityId, parsed.areaId, parsed.seedIndex, runSeed)
  );
}

export function getPropertyDef(state: GameState, propertyId: string): SafehouseDefinition | undefined {
  return resolvePropertyDefinition(propertyId, getRunSeed(state));
}

function computeVisiblePropertyIds(
  state: GameState,
  cityId: string,
  areaId: string,
  day: number,
  count: number,
  occupiedIds: string[]
): string[] {
  const runSeed = getRunSeed(state);
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, 'prop-visible', day));
  const indices = Array.from({ length: PROPERTY_POOL_SIZE }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const visible: string[] = [];
  const used = new Set<string>();

  for (const index of indices) {
    if (visible.length >= count) break;
    const def = generatePropertyDefinition(cityId, areaId, index, runSeed);
    if (used.has(def.id)) continue;
    used.add(def.id);
    cacheDefinition(def);
    visible.push(def.id);
  }

  for (const id of occupiedIds) {
    if (!used.has(id)) visible.push(id);
  }

  return visible;
}

export function refreshPropertyListings(
  state: GameState,
  options: { force?: boolean } = {}
): GameState {
  const { player } = state;
  const key = getAreaKey(player.currentCityId, player.currentAreaId);
  const listings = { ...(state.districtPropertyListings ?? {}) };
  const existing = listings[key];

  const occupied = (state.ownedSafehouses ?? [])
    .map((o) => o.safehouseId)
    .filter((id) => {
      const def = resolvePropertyDefinition(id, getRunSeed(state));
      return def?.cityId === player.currentCityId && def?.areaId === player.currentAreaId;
    });

  if (!options.force && existing && existing.refreshDay === player.day) {
    return state;
  }

  const count = clamp(12, PROPERTY_VISIBLE_MIN, PROPERTY_VISIBLE_MAX);
  listings[key] = {
    refreshDay: player.day,
    visibleIds: computeVisiblePropertyIds(
      state,
      player.currentCityId,
      player.currentAreaId,
      player.day,
      count,
      occupied
    ),
  };

  return { ...state, districtPropertyListings: listings };
}

export function getPropertiesAtLocationFromPool(
  state: GameState,
  cityId: string,
  areaId: string
): SafehouseDefinition[] {
  const runSeed = getRunSeed(state);
  const key = getAreaKey(cityId, areaId);
  let listing = state.districtPropertyListings?.[key];

  if (
    !listing &&
    cityId === state.player.currentCityId &&
    areaId === state.player.currentAreaId
  ) {
    const refreshed = refreshPropertyListings(state);
    listing = refreshed.districtPropertyListings?.[key];
  }

  const staticLocal = SAFEHOUSES.filter((s) => s.cityId === cityId && s.areaId === areaId);
  const generatedIds = listing?.visibleIds ?? [];
  const generated = generatedIds
    .map((id) => resolvePropertyDefinition(id, runSeed))
    .filter((d): d is SafehouseDefinition => d != null && d.cityId === cityId && d.areaId === areaId);

  const merged = new Map<string, SafehouseDefinition>();
  for (const def of [...staticLocal, ...generated]) {
    merged.set(def.id, def);
  }
  return [...merged.values()];
}

export function warmPropertyCache(state: GameState): void {
  const runSeed = getRunSeed(state);
  for (const owned of state.ownedSafehouses ?? []) {
    resolvePropertyDefinition(owned.safehouseId, runSeed);
  }
}

export function migrateDistrictPropertyListings(raw: unknown): Record<string, DistrictListing> | undefined {
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
