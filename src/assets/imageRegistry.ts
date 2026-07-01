/**
 * Central artwork registry — the only API screens should use for city images.
 * Runtime art comes exclusively from bundled assets/art/cities/ PNGs.
 * No Unsplash, no reference crops, no placeholder gradients.
 */
import { GENERATED_IMAGES, GENERATED_IMAGE_META } from './generated/cityImages';
import { areaIdToDistrictSlug, cityIdToFolder } from './cityFolderMap';
import { getCityAmbient } from '../data/cityAmbient';
import { getTimeOfDayLabel, getWeatherLabel } from './cityArt';

export type ImageSourceProp = number;

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherCondition = 'clear' | 'rain' | 'fog' | 'snow' | 'storm';

export interface ArtVariant {
  timeOfDay?: TimeOfDay;
  weather?: WeatherCondition;
  event?: string;
}

export interface RegistryArt {
  source: ImageSourceProp;
  aspectRatio: number;
  nativeWidth: number;
  nativeHeight: number;
  tagline?: string;
}

const FALLBACK_CITY_ID = 'new_york';
const REFERENCE_KEY_PATTERN = /reference|mockup|art_bible|ui_reference|prompt_board/i;

export function isReferenceArtKey(key: string): boolean {
  return REFERENCE_KEY_PATTERN.test(key);
}

export function isRuntimeArtKey(key: string): boolean {
  return !isReferenceArtKey(key);
}

function warnReferenceSkipped(context: string, keys: string[]): void {
  if (!__DEV__ || keys.length === 0) return;
  console.warn(`[imageRegistry] Skipped reference-only art for ${context}:`, keys.join(', '));
}

function slugForCity(cityId: string): string {
  const folder = cityIdToFolder(cityId);
  if (!folder) return cityId.replace(/-/g, '_');
  return folder
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

function metaForKey(key: string): { width: number; height: number } {
  return GENERATED_IMAGE_META[key] ?? { width: 16, height: 9 };
}

function aspectRatioForKey(key: string): number {
  const { width, height } = metaForKey(key);
  return height > 0 ? width / height : 16 / 9;
}

function resolveKey(key: string | undefined): number | undefined {
  if (!key || !isRuntimeArtKey(key)) {
    if (key && isReferenceArtKey(key)) warnReferenceSkipped('resolveKey', [key]);
    return undefined;
  }
  return GENERATED_IMAGES[key];
}

function pickVariantKey(
  slug: string,
  category: string,
  variant?: ArtVariant
): string | undefined {
  const time = variant?.timeOfDay;
  const weather = variant?.weather;
  const event = variant?.event;

  const candidates: string[] = [];
  if (time && weather && event) {
    candidates.push(`${slug}__${category}__${time}_${weather}_${event}`);
  }
  if (time && weather) candidates.push(`${slug}__${category}__${time}_${weather}`);
  if (time && event) candidates.push(`${slug}__${category}__${time}_${event}`);
  if (weather && event) candidates.push(`${slug}__${category}__${weather}_${event}`);
  if (time) candidates.push(`${slug}__${category}__${time}`);
  if (weather) candidates.push(`${slug}__${category}__${weather}`);
  if (event) candidates.push(`${slug}__${category}__event_${event}`);

  for (const c of candidates) {
    if (resolveKey(c) != null) return c;
  }

  const prefix = `${slug}__${category}__`;
  const allMatches = Object.keys(GENERATED_IMAGES).filter((k) => k.startsWith(prefix));
  const skipped = allMatches.filter((k) => isReferenceArtKey(k));
  const matches = allMatches.filter(isRuntimeArtKey).sort();

  if (skipped.length > 0) warnReferenceSkipped(`${slug}/${category}`, skipped);

  if (matches.length > 0) return matches[0];
  return undefined;
}

function masterKeyForSlug(slug: string): string {
  return `${slug}__master`;
}

function resolveMasterKey(cityId: string): string {
  const slug = slugForCity(cityId);
  const direct = masterKeyForSlug(slug);
  if (resolveKey(direct) != null) return direct;

  const variant = pickVariantKey(slug, 'master');
  if (variant) return variant;

  const fallbackSlug = slugForCity(FALLBACK_CITY_ID);
  return masterKeyForSlug(fallbackSlug);
}

function toRegistryArt(key: string, cityId: string): RegistryArt {
  const { width, height } = metaForKey(key);
  const moduleId = resolveKey(key);
  if (moduleId == null) {
    const fallbackKey = masterKeyForSlug(slugForCity(FALLBACK_CITY_ID));
    const fallbackMod = resolveKey(fallbackKey)!;
    const fbMeta = metaForKey(fallbackKey);
    return {
      source: fallbackMod,
      aspectRatio: aspectRatioForKey(fallbackKey),
      nativeWidth: fbMeta.width,
      nativeHeight: fbMeta.height,
      tagline: getCityAmbient(cityId).tagline,
    };
  }
  return {
    source: moduleId,
    aspectRatio: aspectRatioForKey(key),
    nativeWidth: width,
    nativeHeight: height,
    tagline: getCityAmbient(cityId).tagline,
  };
}

function resolveCategory(cityId: string, category: string, variant?: ArtVariant): RegistryArt {
  const slug = slugForCity(cityId);
  const key = pickVariantKey(slug, category, variant);
  if (key) return toRegistryArt(key, cityId);
  return getCityMaster(cityId, variant);
}

export function getCityMaster(cityId: string, variant?: ArtVariant): RegistryArt {
  const slug = slugForCity(cityId);
  const key =
    pickVariantKey(slug, 'master', variant) ??
    pickVariantKey(slug, 'master') ??
    resolveMasterKey(cityId);
  return toRegistryArt(key, cityId);
}

export function getDistrictImage(
  cityId: string,
  districtId: string,
  variant?: ArtVariant
): RegistryArt {
  const slug = slugForCity(cityId);
  const districtSlug = areaIdToDistrictSlug(cityId, districtId);

  const districtCandidates = [
    `${slug}__districts__${districtSlug}`,
    ...Object.keys(GENERATED_IMAGES).filter(
      (k) =>
        isRuntimeArtKey(k) &&
        k.startsWith(`${slug}__districts__`) &&
        k.includes(districtSlug)
    ),
  ];

  for (const candidate of districtCandidates) {
    if (resolveKey(candidate) != null) return toRegistryArt(candidate, cityId);
  }

  const mod = pickVariantKey(slug, 'districts', variant);
  if (mod) return toRegistryArt(mod, cityId);

  return getCityMaster(cityId, variant);
}

export function getTravelCard(cityId: string, variant?: ArtVariant): RegistryArt {
  return resolveCategory(cityId, 'travel', variant);
}

export function getCommandHeader(cityId: string, variant?: ArtVariant): RegistryArt {
  return resolveCategory(cityId, 'command', variant);
}

export function getLoadingImage(cityId: string, seed = 0, variant?: ArtVariant): RegistryArt {
  const slug = slugForCity(cityId);
  const loadingKeys = Object.keys(GENERATED_IMAGES)
    .filter((k) => isRuntimeArtKey(k) && k.startsWith(`${slug}__loading__`))
    .sort();
  if (loadingKeys.length > 0) {
    const key = loadingKeys[Math.abs(seed) % loadingKeys.length];
    return toRegistryArt(key, cityId);
  }
  const mod = pickVariantKey(slug, 'loading', variant);
  if (mod) return toRegistryArt(mod, cityId);
  return getCityMaster(cityId, variant);
}

export function getCinematicImage(
  cityId: string,
  areaId: string,
  day: number,
  variant?: ArtVariant
): RegistryArt {
  const slug = slugForCity(cityId);
  const timeOfDay = variant?.timeOfDay ?? timeLabelToVariant(getTimeOfDayLabel(day));
  const weather = variant?.weather ?? weatherLabelToVariant(getWeatherLabel(cityId));
  const merged: ArtVariant = { ...variant, timeOfDay, weather };

  const cinematicKeys = Object.keys(GENERATED_IMAGES)
    .filter((k) => isRuntimeArtKey(k) && k.startsWith(`${slug}__cinematic__`))
    .sort();
  if (cinematicKeys.length > 0) {
    const key = cinematicKeys[Math.abs(day) % cinematicKeys.length];
    return toRegistryArt(key, cityId);
  }

  const mod = pickVariantKey(slug, 'cinematic', merged);
  if (mod) return toRegistryArt(mod, cityId);

  return getCityMaster(cityId, merged);
}

function timeLabelToVariant(label: string): TimeOfDay {
  const lower = label.toLowerCase() as TimeOfDay;
  if (['morning', 'afternoon', 'evening', 'night'].includes(lower)) return lower;
  return 'night';
}

function weatherLabelToVariant(label: string): WeatherCondition {
  const map: Record<string, WeatherCondition> = {
    clear: 'clear',
    overcast: 'fog',
    dry: 'clear',
    rain: 'rain',
    fog: 'fog',
    snow: 'snow',
    storm: 'storm',
  };
  return map[label.toLowerCase()] ?? 'clear';
}

export function getArtVariantFromGameState(cityId: string, day: number): ArtVariant {
  return {
    timeOfDay: timeLabelToVariant(getTimeOfDayLabel(day)),
    weather: weatherLabelToVariant(getWeatherLabel(cityId)),
  };
}

export { getTimeOfDayLabel, getWeatherLabel } from './cityArt';
