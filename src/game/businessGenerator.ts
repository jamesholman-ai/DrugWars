import { BusinessDefinition, BusinessType } from '../types/businesses';
import { BALANCE } from '../data/balanceConfig';
import {
  ALL_BUSINESS_TYPES,
  BUSINESS_TYPE_TEMPLATES,
  BusinessTypeTemplate,
  TIER_MIN_RANK,
  TIER_MIN_REPUTATION,
  getBusinessTypeWeights,
} from '../data/businessTemplates';
import { getDistrictArchetype } from '../data/districtFlavor';
import { CITY_AREA_MAP } from '../data/areas';
import { createSeededRandom } from '../utils/seededRandom';
import { hashCombine } from '../utils/hash';
import { clamp } from '../utils/random';

export function parseGeneratedBusinessId(
  id: string
): { cityId: string; areaId: string; type: BusinessType; seedIndex: number } | null {
  const parts = id.split('_');
  const seedIndex = Number(parts[parts.length - 1]);
  if (!Number.isFinite(seedIndex)) return null;

  const typesByLength = [...ALL_BUSINESS_TYPES].sort((a, b) => b.length - a.length);
  for (const type of typesByLength) {
    const typeParts = type.split('_');
    if (parts.length < typeParts.length + 2) continue;
    const typeSlice = parts.slice(-(typeParts.length + 1), -1);
    if (typeSlice.join('_') !== type) continue;

    const areaId = parts.slice(0, -(typeParts.length + 1)).join('_');
    const area = CITY_AREA_MAP[areaId];
    if (!area) return null;

    return {
      cityId: area.cityId,
      areaId,
      type,
      seedIndex,
    };
  }

  return null;
}

function pickWeightedType(
  weights: Partial<Record<BusinessType, number>>,
  random: () => number
): BusinessType {
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [BusinessType, number][];
  if (entries.length === 0) return 'corner_store';

  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

function generateBusinessName(template: BusinessTypeTemplate, seedIndex: number, random: () => number): string {
  const prefix = template.namePrefixes[Math.floor(random() * template.namePrefixes.length)] ?? 'Metro';
  const suffix = template.nameSuffixes[Math.floor(random() * template.nameSuffixes.length)] ?? 'Co.';
  const variant = seedIndex % 7;
  if (variant === 0) return `${prefix} ${template.label}`;
  if (variant === 1) return `${template.label} — ${prefix}`;
  if (variant === 2) return `${prefix} ${suffix}`;
  return `${prefix} ${template.label.split(' ')[0]} ${suffix}`;
}

export function generateBusinessDefinition(
  cityId: string,
  areaId: string,
  seedIndex: number,
  runSeed: number
): BusinessDefinition {
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, 'biz', seedIndex));
  const archetype = getDistrictArchetype(areaId);
  const weights = getBusinessTypeWeights(archetype);
  const type = pickWeightedType(weights, rng);
  const template = BUSINESS_TYPE_TEMPLATES[type];
  const area = CITY_AREA_MAP[areaId];
  const riskMod = area?.riskModifier ?? 1;
  const variance = 0.82 + rng() * 0.36;

  const purchaseCost = Math.round(
    template.baseCost * BALANCE.businessCostScale * variance * (0.9 + riskMod * 0.15)
  );
  const dailyIncome = Math.round(
    template.baseIncome * BALANCE.businessIncomeScale * variance * (1.05 - riskMod * 0.08)
  );
  const launderingCapacityPerDay = Math.round(
    template.baseLaunder * BALANCE.launderingScale * variance * (0.95 + riskMod * 0.05)
  );
  const upkeepPerDay = Math.round(
    template.baseUpkeep * BALANCE.upkeepScale * variance * (0.9 + riskMod * 0.1)
  );
  const heatReductionPerDay = Math.max(0, Math.round(template.baseHeatReduction * (0.85 + rng() * 0.3)));
  const riskLevel = clamp(Math.round(template.baseRisk * (0.85 + riskMod * 0.12)), 1, 10);

  const id = `${areaId}_${type}_${seedIndex}`;
  const description = template.descriptions[Math.floor(rng() * template.descriptions.length)] ?? template.label;

  return {
    id,
    name: generateBusinessName(template, seedIndex, rng),
    type,
    cityId,
    areaId,
    purchaseCost,
    dailyIncome,
    launderingCapacityPerDay,
    heatReductionPerDay,
    riskLevel,
    upkeepPerDay,
    requiredRank: TIER_MIN_RANK[template.tier],
    requiredReputation: TIER_MIN_REPUTATION[template.tier],
    description,
    tier: template.tier,
  };
}

export function generateDistrictBusinessPool(
  cityId: string,
  areaId: string,
  runSeed: number,
  poolSize: number
): BusinessDefinition[] {
  const pool: BusinessDefinition[] = [];
  const seenTypes = new Set<string>();

  for (let i = 0; i < poolSize; i++) {
    let def = generateBusinessDefinition(cityId, areaId, i, runSeed);
    let attempts = 0;
    while (seenTypes.has(`${def.type}_${Math.floor(def.purchaseCost / 500)}`) && attempts < 8) {
      def = generateBusinessDefinition(cityId, areaId, i + attempts * 997, runSeed);
      attempts++;
    }
    seenTypes.add(`${def.type}_${Math.floor(def.purchaseCost / 500)}`);
    pool.push(def);
  }

  return pool;
}
