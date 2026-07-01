import type { InventoryItem } from './game';
import type { RankId } from './progression';
import type { EmpireEventEntry, PropertyUpgradeLevels } from './empire';

/** @deprecated Use PropertyType — kept for static catalog compatibility */
export type SafehouseTier =
  | 'motel_room'
  | 'apartment'
  | 'trap_house'
  | 'warehouse'
  | 'nightclub_backroom'
  | 'penthouse'
  | 'private_compound';

export type PropertyCategory =
  | 'rentals'
  | 'safehouses'
  | 'homes'
  | 'business_properties'
  | 'storage_sites';

export type PropertyType =
  | 'motel_room'
  | 'studio_apartment'
  | 'apartment'
  | 'safehouse'
  | 'trap_house'
  | 'townhouse'
  | 'condo'
  | 'suburban_house'
  | 'luxury_apartment'
  | 'penthouse'
  | 'warehouse'
  | 'private_compound'
  | 'estate'
  | 'nightclub_backroom';

export type RentOrOwn = 'rent' | 'own';

export type PropertyListingMode = 'rent' | 'sale';

export interface SafehouseDefinition {
  id: string;
  name: string;
  /** @deprecated Use propertyType */
  tier: SafehouseTier;
  propertyType: PropertyType;
  category: PropertyCategory;
  /** How this listing is offered in Find Place */
  listingMode: PropertyListingMode;
  cityId: string;
  areaId: string;
  purchaseCost: number;
  rentPerDay: number;
  storageCapacity: number;
  heatReductionPerDay: number;
  robberyProtection: number;
  policeRiskModifier: number;
  upkeepPerDay: number;
  /** Base comfort 0–100 */
  comfortLevel: number;
  /** Base secrecy 0–100 */
  secrecyLevel: number;
  /** Base security 0–100 */
  securityLevel: number;
  minRank?: RankId;
  minReputation?: number;
  description: string;
}

export interface OwnedSafehouse {
  safehouseId: string;
  purchasedDay: number;
  rentOrOwn: RentOrOwn;
  upkeepMissedDays: number;
  /** 0–100; drops when rent/upkeep unpaid */
  condition: number;
  /** 0–100 runtime comfort */
  comfortLevel: number;
  /** 0–100 runtime security */
  securityLevel: number;
  /** 0–100 runtime secrecy */
  secrecyLevel: number;
  assignedGuardCrewId?: string | null;
  upgradeLevels?: PropertyUpgradeLevels;
  recentEvents?: EmpireEventEntry[];
}

/** Stored inventory keyed by safehouse id. */
export type StoredInventoryBySafehouse = Record<string, InventoryItem[]>;
