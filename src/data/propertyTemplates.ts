import {
  PropertyCategory,
  PropertyListingMode,
  PropertyType,
  SafehouseDefinition,
} from '../types/safehouses';
import { RankId } from '../types/progression';
import { TIER_MIN_RANK, TIER_MIN_REPUTATION } from './businessTemplates';
import { DistrictArchetype, getDistrictArchetype } from './districtFlavor';

export interface PropertyTypeTemplate {
  type: PropertyType;
  label: string;
  category: PropertyCategory;
  tier: number;
  baseCost: number;
  baseRent: number;
  baseUpkeep: number;
  storage: number;
  heat: number;
  robbery: number;
  policeMod: number;
  comfort: number;
  secrecy: number;
  security: number;
  archetypes: DistrictArchetype[];
  namePrefixes: string[];
  descriptions: string[];
}

const PREFIXES = ['Metro', 'Parkview', 'Riverside', 'Corner', 'Grand', 'Oak', 'Sunset', 'Harbor', 'Union', 'Cedar'];

function tpl(
  type: PropertyType,
  label: string,
  category: PropertyCategory,
  tier: number,
  cost: number,
  rent: number,
  upkeep: number,
  storage: number,
  heat: number,
  robbery: number,
  police: number,
  comfort: number,
  secrecy: number,
  security: number,
  archetypes: DistrictArchetype[],
  descriptions: string[]
): PropertyTypeTemplate {
  return {
    type,
    label,
    category,
    tier,
    baseCost: cost,
    baseRent: rent,
    baseUpkeep: upkeep,
    storage,
    heat,
    robbery,
    policeMod: police,
    comfort,
    secrecy,
    security,
    archetypes,
    namePrefixes: PREFIXES,
    descriptions,
  };
}

export const PROPERTY_TYPE_TEMPLATES: Record<PropertyType, PropertyTypeTemplate> = {
  motel_room: tpl('motel_room', 'Motel Room', 'rentals', 1, 0, 45, 0, 22, 1, 0.06, 0.96, 35, 40, 25, ['general', 'suburbs'], ['Hourly rate. Low profile.']),
  studio_apartment: tpl('studio_apartment', 'Studio Apartment', 'rentals', 1, 0, 75, 0, 30, 1, 0.08, 0.94, 45, 42, 30, ['college', 'downtown'], ['Compact unit above a shop.']),
  apartment: tpl('apartment', 'Apartment', 'homes', 2, 3200, 95, 55, 40, 2, 0.1, 0.93, 55, 45, 38, ['general', 'downtown'], ['Walk-up with a back stairwell.']),
  safehouse: tpl('safehouse', 'Safehouse', 'safehouses', 2, 4500, 0, 70, 50, 2, 0.14, 0.9, 50, 55, 45, ['general'], ['Reinforced doors. Quiet neighbors.']),
  trap_house: tpl('trap_house', 'Trap House', 'business_properties', 2, 4200, 0, 65, 48, 2, 0.12, 0.91, 40, 50, 35, ['industrial', 'college'], ['Boarded windows. Corner traffic.']),
  townhouse: tpl('townhouse', 'Townhouse', 'homes', 3, 8500, 140, 90, 55, 2, 0.12, 0.9, 62, 48, 42, ['suburbs', 'downtown'], ['Row house with a garage stash.']),
  condo: tpl('condo', 'Condo', 'homes', 3, 11000, 165, 110, 50, 2, 0.14, 0.88, 68, 42, 48, ['downtown'], ['Doorman building. Elevator access.']),
  suburban_house: tpl('suburban_house', 'Suburban House', 'homes', 3, 9500, 120, 85, 65, 2, 0.1, 0.92, 70, 38, 40, ['suburbs'], ['Quiet cul-de-sac. Lawn cover.']),
  luxury_apartment: tpl('luxury_apartment', 'Luxury Apartment', 'homes', 4, 16000, 220, 160, 55, 3, 0.18, 0.86, 78, 40, 55, ['downtown', 'club_district'], ['Concierge desk. Valet stash.']),
  penthouse: tpl('penthouse', 'Penthouse', 'homes', 5, 22000, 0, 320, 70, 4, 0.22, 0.82, 85, 35, 60, ['downtown'], ['Skyline views. Heat melts upstairs.']),
  warehouse: tpl('warehouse', 'Warehouse', 'storage_sites', 3, 9000, 180, 140, 120, 2, 0.2, 0.88, 45, 60, 55, ['industrial', 'harbor'], ['Rail-side bulk storage.']),
  private_compound: tpl('private_compound', 'Private Compound', 'safehouses', 5, 35000, 0, 480, 200, 5, 0.28, 0.78, 80, 70, 75, ['harbor', 'suburbs'], ['Gated estate. Cartel-grade storage.']),
  estate: tpl('estate', 'Estate', 'homes', 5, 42000, 0, 550, 150, 4, 0.25, 0.8, 88, 55, 70, ['suburbs', 'downtown'], ['Estate grounds. Old money cover.']),
  nightclub_backroom: tpl('nightclub_backroom', 'Club Backroom', 'business_properties', 3, 12000, 0, 190, 75, 2, 0.18, 0.86, 55, 52, 50, ['club_district'], ['Service corridor locker network.']),
};

export const ALL_PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_TEMPLATES) as PropertyType[];

export const PROPERTY_POOL_SIZE = 40;
export const PROPERTY_VISIBLE_MIN = 10;
export const PROPERTY_VISIBLE_MAX = 15;

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = Object.fromEntries(
  Object.values(PROPERTY_TYPE_TEMPLATES).map((t) => [t.type, t.label])
) as Record<PropertyType, string>;

export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  rentals: 'Rental',
  safehouses: 'Safehouse',
  homes: 'Home',
  business_properties: 'Business Property',
  storage_sites: 'Storage',
};

export function tierMinRank(tier: number): RankId {
  const key = Math.min(5, Math.max(1, tier)) as keyof typeof TIER_MIN_RANK;
  return TIER_MIN_RANK[key];
}

export function tierMinReputation(tier: number): number {
  const key = Math.min(5, Math.max(1, tier)) as keyof typeof TIER_MIN_REPUTATION;
  return TIER_MIN_REPUTATION[key];
}

export function getPropertyTypeWeights(archetype: DistrictArchetype): Partial<Record<PropertyType, number>> {
  const weights: Partial<Record<PropertyType, number>> = {};
  for (const template of Object.values(PROPERTY_TYPE_TEMPLATES)) {
    if (template.archetypes.includes(archetype) || template.archetypes.includes('general')) {
      weights[template.type] = (weights[template.type] ?? 0) + (template.archetypes.includes(archetype) ? 3 : 1);
    }
  }
  return weights;
}

export function listingModeForTemplate(
  template: PropertyTypeTemplate,
  seedIndex: number
): PropertyListingMode {
  if (template.category === 'rentals') return 'rent';
  if (template.tier <= 2 && seedIndex % 3 === 0) return 'rent';
  return 'sale';
}
