/**
 * Preloads bundled city artwork for current location and travel targets.
 */
import {
  getArtVariantFromGameState,
  getCityMaster,
  getDistrictImage,
  RegistryArt,
} from './imageRegistry';
import { CITIES } from '../data/locations';

const preloadCache = new Set<string>();

async function preloadOne(art: RegistryArt, cacheKey: string): Promise<void> {
  if (preloadCache.has(cacheKey)) return;
  preloadCache.add(cacheKey);
  void art.source;
}

export async function preloadRegistryArt(art: RegistryArt, cacheKey: string): Promise<void> {
  preloadOne(art, cacheKey);
}

export async function preloadCityArt(
  cityId: string,
  areaId?: string,
  day = 1
): Promise<void> {
  const variant = getArtVariantFromGameState(cityId, day);
  const tasks: Promise<void>[] = [
    preloadRegistryArt(getCityMaster(cityId, variant), `${cityId}:master`),
  ];
  if (areaId) {
    tasks.push(
      preloadRegistryArt(getDistrictImage(cityId, areaId, variant), `${cityId}:district:${areaId}`)
    );
  }
  await Promise.all(tasks);
}

export async function preloadCityArtBundle(
  currentCityId: string,
  currentAreaId: string,
  day: number,
  extraCityIds: string[] = []
): Promise<void> {
  const ids = new Set<string>([currentCityId, ...extraCityIds]);
  await Promise.all([...ids].map((id) => preloadCityArt(id, id === currentCityId ? currentAreaId : undefined, day)));
}

let travelWarmDone = false;

export async function preloadTravelDestinations(day: number): Promise<void> {
  if (travelWarmDone) return;
  travelWarmDone = true;
  const sample = CITIES.slice(0, 4).map((c) => c.id);
  await Promise.all(sample.map((id) => preloadCityArt(id, undefined, day)));
}

export function clearArtPreloadCache(): void {
  preloadCache.clear();
  travelWarmDone = false;
}
