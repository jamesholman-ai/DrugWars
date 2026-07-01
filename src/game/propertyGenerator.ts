import { PropertyListingMode, PropertyType, SafehouseDefinition } from '../types/safehouses';
import { CITY_AREA_MAP } from '../data/areas';
import {
  ALL_PROPERTY_TYPES,
  getPropertyTypeWeights,
  listingModeForTemplate,
  PROPERTY_TYPE_TEMPLATES,
  PropertyTypeTemplate,
  tierMinRank,
  tierMinReputation,
} from '../data/propertyTemplates';
import { getDistrictArchetype } from '../data/districtFlavor';
import { createSeededRandom } from '../utils/seededRandom';
import { hashCombine } from '../utils/hash';
import { clamp } from '../utils/random';

export function parseGeneratedPropertyId(
  id: string
): { cityId: string; areaId: string; type: PropertyType; seedIndex: number; mode: PropertyListingMode } | null {
  const parts = id.split('_');
  const modeRaw = parts[parts.length - 1];
  if (modeRaw !== 'rent' && modeRaw !== 'sale') return null;
  const seedIndex = Number(parts[parts.length - 2]);
  if (!Number.isFinite(seedIndex)) return null;

  const typesByLength = [...ALL_PROPERTY_TYPES].sort((a, b) => b.length - a.length);
  for (const type of typesByLength) {
    const typeParts = type.split('_');
    if (parts.length < typeParts.length + 4) continue;
    const typeSlice = parts.slice(-(typeParts.length + 2), -2);
    if (typeSlice.join('_') !== type) continue;
    if (parts[parts.length - typeParts.length - 3] !== 'prop') continue;

    const areaId = parts.slice(0, -(typeParts.length + 3)).join('_');
    const area = CITY_AREA_MAP[areaId];
    if (!area) return null;

    return {
      cityId: area.cityId,
      areaId,
      type,
      seedIndex,
      mode: modeRaw,
    };
  }
  return null;
}

function pickWeightedType(
  weights: Partial<Record<PropertyType, number>>,
  random: () => number
): PropertyType {
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [PropertyType, number][];
  if (entries.length === 0) return 'motel_room';
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

function generateName(template: PropertyTypeTemplate, seedIndex: number, random: () => number): string {
  const prefix = template.namePrefixes[Math.floor(random() * template.namePrefixes.length)] ?? 'Metro';
  const variant = seedIndex % 5;
  if (variant === 0) return `${prefix} ${template.label}`;
  if (variant === 1) return `${template.label} — ${prefix}`;
  return `${prefix} ${template.label.split(' ')[0]}`;
}

export function generatePropertyDefinition(
  cityId: string,
  areaId: string,
  seedIndex: number,
  runSeed: number
): SafehouseDefinition {
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, 'prop', seedIndex));
  const archetype = getDistrictArchetype(areaId);
  const type = pickWeightedType(getPropertyTypeWeights(archetype), rng);
  const template = PROPERTY_TYPE_TEMPLATES[type];
  const area = CITY_AREA_MAP[areaId];
  const riskMod = area?.riskModifier ?? 1;
  const variance = 0.85 + rng() * 0.3;
  const listingMode = listingModeForTemplate(template, seedIndex);

  const purchaseCost =
    listingMode === 'rent' ? 0 : Math.round(template.baseCost * variance * (0.9 + riskMod * 0.12));
  const rentPerDay = Math.round(template.baseRent * variance * (listingMode === 'rent' ? 1 : 0.85));
  const upkeepPerDay = Math.round(template.baseUpkeep * variance * (0.9 + riskMod * 0.08));

  const id = `${areaId}_prop_${type}_${seedIndex}_${listingMode}`;
  const tier = template.tier;
  const legacyTier =
    type === 'motel_room' || type === 'studio_apartment'
      ? 'motel_room'
      : type === 'warehouse'
        ? 'warehouse'
        : type === 'penthouse'
          ? 'penthouse'
          : type === 'private_compound' || type === 'estate'
            ? 'private_compound'
            : type === 'trap_house'
              ? 'trap_house'
              : type === 'nightclub_backroom'
                ? 'nightclub_backroom'
                : 'apartment';

  return {
    id,
    name: generateName(template, seedIndex, rng),
    tier: legacyTier,
    propertyType: type,
    category: template.category,
    listingMode,
    cityId,
    areaId,
    purchaseCost,
    rentPerDay: listingMode === 'rent' ? Math.max(35, rentPerDay || Math.round(template.baseRent * variance)) : rentPerDay,
    storageCapacity: Math.round(template.storage * variance),
    heatReductionPerDay: Math.max(0, Math.round(template.heat * (0.85 + rng() * 0.25))),
    robberyProtection: clamp(template.robbery * variance, 0.04, 0.35),
    policeRiskModifier: clamp(template.policeMod, 0.7, 1),
    upkeepPerDay: listingMode === 'rent' ? 0 : Math.max(25, upkeepPerDay),
    comfortLevel: clamp(Math.round(template.comfort * variance), 20, 95),
    secrecyLevel: clamp(Math.round(template.secrecy * variance), 20, 95),
    securityLevel: clamp(Math.round(template.security * variance), 20, 95),
    minRank: tierMinRank(tier),
    minReputation: tierMinReputation(tier) > 0 ? tierMinReputation(tier) : undefined,
    description: template.descriptions[Math.floor(rng() * template.descriptions.length)] ?? template.label,
  };
}
