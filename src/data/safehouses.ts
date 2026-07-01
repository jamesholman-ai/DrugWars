import { SafehouseDefinition, PropertyCategory, PropertyListingMode, PropertyType, SafehouseTier } from '../types/safehouses';
import { RankId } from '../types/progression';
import { PROPERTY_TYPE_LABELS } from './propertyTemplates';

function legacyTier(propertyType: PropertyType): SafehouseTier {
  if (propertyType === 'motel_room' || propertyType === 'studio_apartment') return 'motel_room';
  if (propertyType === 'warehouse') return 'warehouse';
  if (propertyType === 'penthouse') return 'penthouse';
  if (propertyType === 'private_compound' || propertyType === 'estate') return 'private_compound';
  if (propertyType === 'trap_house') return 'trap_house';
  if (propertyType === 'nightclub_backroom') return 'nightclub_backroom';
  return 'apartment';
}

function sh(
  id: string,
  name: string,
  propertyType: PropertyType,
  category: PropertyCategory,
  listingMode: PropertyListingMode,
  cityId: string,
  areaId: string,
  purchaseCost: number,
  rentPerDay: number,
  storage: number,
  heat: number,
  robbery: number,
  policeMod: number,
  upkeep: number,
  comfort: number,
  secrecy: number,
  security: number,
  description: string,
  unlock: { minRank?: RankId; minReputation?: number } = {}
): SafehouseDefinition {
  return {
    id,
    name,
    tier: legacyTier(propertyType),
    propertyType,
    category,
    listingMode,
    cityId,
    areaId,
    purchaseCost,
    rentPerDay,
    storageCapacity: storage,
    heatReductionPerDay: heat,
    robberyProtection: robbery,
    policeRiskModifier: policeMod,
    upkeepPerDay: upkeep,
    comfortLevel: comfort,
    secrecyLevel: secrecy,
    securityLevel: security,
    description,
    ...unlock,
  };
}

export const SAFEHOUSES: SafehouseDefinition[] = [
  sh('sh_ny_harlem_motel', 'Harlem Motel Room', 'motel_room', 'rentals', 'rent',
    'new_york', 'new_york_brooklyn', 0, 45, 25, 1, 0.08, 0.95, 0, 35, 40, 25,
    'Hourly motel. Low profile, low space.'),
  sh('sh_ny_harlem_studio', 'Harlem Studio', 'studio_apartment', 'homes', 'sale',
    'new_york', 'new_york_brooklyn', 2800, 75, 32, 1, 0.09, 0.94, 58, 48, 42, 32,
    'Cheap studio above a laundromat.'),
  sh('sh_miami_havana_apt', 'Little Havana Apartment', 'apartment', 'homes', 'sale',
    'miami', 'miami_little_havana', 3200, 95, 40, 2, 0.12, 0.92, 65, 55, 45, 38,
    'Second-floor walk-up behind a bodega.'),
  sh('sh_atl_zone6_trap', 'Zone 6 Trap House', 'trap_house', 'business_properties', 'sale',
    'atlanta', 'atlanta_zone_6', 4500, 0, 55, 2, 0.15, 0.9, 80, 40, 50, 35,
    'Boarded windows. Corners know not to ask questions.'),
  sh('sh_det_industrial_wh', 'Industrial Warehouse', 'warehouse', 'storage_sites', 'sale',
    'detroit', 'detroit_industrial', 9000, 180, 120, 3, 0.22, 0.88, 150, 45, 60, 55,
    'Rail-side storage. Serious bulk.', { minRank: 'hustler' }),
  sh('sh_vegas_strip_club', 'Strip Backroom', 'nightclub_backroom', 'business_properties', 'sale',
    'las_vegas', 'las_vegas_strip', 12000, 0, 80, 2, 0.2, 0.85, 200, 55, 52, 50,
    'Casino service corridor locker network.', { minRank: 'dealer' }),
  sh('sh_ny_downtown_pent', 'Midtown Penthouse', 'penthouse', 'homes', 'sale',
    'new_york', 'new_york_downtown', 22000, 0, 70, 4, 0.25, 0.8, 350, 85, 35, 60,
    'Skyline views. Heat melts upstairs.', { minRank: 'plug', minReputation: 40 }),
  sh('sh_miami_port_compound', 'Port Compound', 'private_compound', 'safehouses', 'sale',
    'miami', 'miami_port', 35000, 0, 200, 5, 0.3, 0.75, 500, 80, 70, 75,
    'Gated dockside estate. Cartel-grade storage.', { minRank: 'kingpin' }),
  sh('sh_la_hollywood_apt', 'Hollywood Apartment', 'apartment', 'homes', 'sale',
    'los_angeles', 'los_angeles_hollywood', 3800, 120, 45, 2, 0.1, 0.93, 70, 62, 42, 40,
    'Off-strip unit. Party crowd cover noise.'),
  sh('sh_chi_loop_motel', 'Loop Motel', 'motel_room', 'rentals', 'rent',
    'chicago', 'chicago_downtown', 0, 55, 30, 1, 0.08, 0.94, 0, 38, 38, 28,
    'Business district hourly rooms.'),
  sh('sh_london_flat', 'Central Flat', 'apartment', 'homes', 'sale',
    'london', 'london_central', 14000, 165, 60, 3, 0.18, 0.87, 280, 68, 48, 45,
    'Council flat with hidden floor safe.', { minRank: 'kingpin' }),
];

export const SAFEHOUSE_MAP = Object.fromEntries(
  SAFEHOUSES.map((s) => [s.id, s])
) as Record<string, SafehouseDefinition>;

export const SAFEHOUSE_TIER_LABELS: Record<SafehouseTier, string> = {
  motel_room: 'Motel Room',
  apartment: 'Apartment',
  trap_house: 'Trap House',
  warehouse: 'Warehouse',
  nightclub_backroom: 'Nightclub Backroom',
  penthouse: 'Penthouse',
  private_compound: 'Private Compound',
};

/** Display label for any property type (static or generated). */
export function getPropertyTypeLabel(def: SafehouseDefinition): string {
  return PROPERTY_TYPE_LABELS[def.propertyType] ?? SAFEHOUSE_TIER_LABELS[def.tier] ?? def.name;
}
