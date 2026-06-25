import { GameState, TerritoryOwner } from '../types/game';
import { CITY_AREAS, getAreasForCity } from '../data/areas';
import { CITIES, getAreaKey } from '../data/locations';
import { clamp } from '../utils/random';

export function inferDefaultOwner(area: {
  policePresence: number;
  cartelInfluence: number;
  rivalInfluence: number;
}): TerritoryOwner {
  if (area.policePresence >= 65) return 'police_controlled';
  if (area.cartelInfluence >= 55) return 'cartel';
  if (area.rivalInfluence >= 55) return 'rival_gang';
  return 'neutral';
}

export function createDefaultAreaOwnership(): Record<string, TerritoryOwner> {
  const ownership: Record<string, TerritoryOwner> = {};
  for (const area of CITY_AREAS) {
    ownership[getAreaKey(area.cityId, area.id)] = inferDefaultOwner(area);
  }
  return ownership;
}

export function createDefaultLocalHeat(): Record<string, number> {
  const heat: Record<string, number> = {};
  for (const city of CITIES) {
    heat[city.id] = Math.round(10 + city.riskModifier * 8);
  }
  return heat;
}

export function getAreaOwnership(
  state: GameState,
  cityId: string,
  areaId: string
): TerritoryOwner {
  return state.areaOwnership?.[getAreaKey(cityId, areaId)] ?? 'neutral';
}

export function getLocalCityHeat(state: GameState, cityId: string): number {
  return clamp(state.localHeatByCity?.[cityId] ?? 0, 0, 100);
}

/** Police encounters blend local city heat with personal heat. */
export function getEffectivePoliceHeat(state: GameState, cityId: string): number {
  const local = getLocalCityHeat(state, cityId);
  return clamp(Math.round(local * 0.65 + state.player.heat * 0.35), 0, 100);
}

export function adjustLocalHeat(
  state: GameState,
  cityId: string,
  delta: number
): Record<string, number> {
  const current = { ...(state.localHeatByCity ?? createDefaultLocalHeat()) };
  current[cityId] = clamp((current[cityId] ?? 0) + delta, 0, 100);
  return current;
}

const OWNER_LABELS: Record<TerritoryOwner, string> = {
  neutral: 'Neutral',
  rival_gang: 'Rival Gang',
  cartel: 'Cartel',
  police_controlled: 'Police',
  player_controlled: 'Your Crew',
};

export function getDisplayTerritoryOwner(owner: TerritoryOwner): TerritoryOwner {
  if (owner === 'player_controlled') return 'neutral';
  return owner;
}

export function formatOwnerLabel(owner: TerritoryOwner): string {
  return OWNER_LABELS[getDisplayTerritoryOwner(owner)];
}

export function formatDemandHint(
  demandModifiers: Partial<Record<string, number>>,
  limit = 2
): string {
  const hot = Object.entries(demandModifiers)
    .filter((entry): entry is [string, number] => {
      const mod = entry[1];
      return typeof mod === 'number' && mod >= 1.08;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, mod]) => `${id} +${Math.round((mod - 1) * 100)}%`);

  return hot.length ? hot.join(', ') : 'Balanced';
}

/** Small flavor event when entering a new area (no day advance). */
export function rollAreaFlavorMessage(state: GameState, areaName: string, owner: TerritoryOwner): string | null {
  const roll = Math.random();
  if (roll > 0.22) return null;

  if (owner === 'police_controlled') {
    return `Entering ${areaName} — patrols active. Keep your head down.`;
  }
  if (owner === 'cartel') {
    return `Entering ${areaName} — cartel eyes on the block.`;
  }
  if (owner === 'rival_gang') {
    return `Entering ${areaName} — rival crew holds this turf.`;
  }
  if (owner === 'player_controlled') {
    return `Entering ${areaName} — your people control this strip.`;
  }
  return `Entering ${areaName} — streets are watching.`;
}

export function migrateAreaOwnership(raw: unknown): Record<string, TerritoryOwner> {
  const defaults = createDefaultAreaOwnership();
  if (typeof raw !== 'object' || raw === null) return defaults;

  const valid: TerritoryOwner[] = [
    'neutral',
    'rival_gang',
    'cartel',
    'police_controlled',
    'player_controlled',
  ];

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && valid.includes(value as TerritoryOwner)) {
      defaults[key] = value as TerritoryOwner;
    }
  }
  return defaults;
}

export function migrateLocalHeatByCity(
  raw: unknown,
  playerHeat: number
): Record<string, number> {
  const defaults = createDefaultLocalHeat();
  if (typeof raw !== 'object' || raw === null) {
    if (playerHeat > 0) {
      defaults.new_york = clamp(playerHeat, 0, 100);
    }
    return defaults;
  }

  for (const [cityId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      defaults[cityId] = clamp(value, 0, 100);
    }
  }
  return defaults;
}

export function ensureAreaBelongsToCity(cityId: string, areaId: string): boolean {
  return getAreasForCity(cityId).some((a) => a.id === areaId);
}
