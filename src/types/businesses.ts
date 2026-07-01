import type { RankId } from './progression';
import type { BusinessUpgradeLevels, EmpireEventEntry } from './empire';

export type BusinessType =
  | 'pawn_shop'
  | 'laundromat'
  | 'bar'
  | 'nightclub'
  | 'strip_club'
  | 'tow_yard'
  | 'used_car_lot'
  | 'auto_repair_shop'
  | 'car_wash'
  | 'vape_shop'
  | 'corner_store'
  | 'bodega'
  | 'food_truck_lot'
  | 'restaurant'
  | 'warehouse'
  | 'import_warehouse'
  | 'storage_facility'
  | 'shipping_office'
  | 'shipping_company'
  | 'taxi_company'
  | 'security_company'
  | 'real_estate_office'
  | 'apartment_building'
  | 'motel'
  | 'private_club'
  | 'casino_room'
  | 'recording_studio'
  | 'event_venue'
  | 'clothing_store'
  | 'jewelry_store'
  | 'electronics_shop'
  | 'gym'
  | 'barber_shop'
  | 'tattoo_parlor'
  | 'trucking_company'
  | 'marina_dock'
  | 'port_office'
  | 'freight_broker'
  | 'logistics_company'
  | 'courier_service'
  | 'cleaning_company'
  | 'construction_company'
  | 'night_market_stall'
  | 'art_gallery'
  | 'luxury_lounge'
  | 'parking_garage'
  | 'check_cashing_store'
  | 'bail_bonds_office'
  | 'private_parking_lot'
  | 'car_rental_office'
  | 'smoke_shop';

export interface BusinessDefinition {
  id: string;
  name: string;
  type: BusinessType;
  cityId: string;
  areaId: string;
  purchaseCost: number;
  dailyIncome: number;
  launderingCapacityPerDay: number;
  heatReductionPerDay: number;
  riskLevel: number;
  upkeepPerDay: number;
  requiredRank?: RankId;
  requiredReputation?: number;
  description: string;
  /** Generated fronts only — business tier 1–5. */
  tier?: number;
}

export interface OwnedBusiness {
  businessId: string;
  purchasedDay: number;
  condition: number;
  upkeepMissedDays: number;
  /** 0–100 local front reputation. */
  reputation?: number;
  /** 0–100 scrutiny on this front. */
  heat?: number;
  assignedCrewId?: string | null;
  upgradeLevels?: BusinessUpgradeLevels;
  recentEvents?: EmpireEventEntry[];
}

export interface BusinessHistoryEntry {
  businessId: string;
  name: string;
  event: string;
  day: number;
}

export interface BusinessRaidRecord {
  id: string;
  businessId: string;
  day: number;
  description: string;
  dirtySeized: number;
  conditionDamage: number;
}

export interface DaySummary {
  day: number;
  payroll: number;
  safehouseUpkeep: number;
  propertyRent: number;
  businessIncome: number;
  businessUpkeep: number;
  laundered: number;
  heatReduced: number;
  raids: string[];
}

export interface DistrictListing {
  refreshDay: number;
  visibleIds: string[];
}
