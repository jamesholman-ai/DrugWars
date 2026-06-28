import type { InventoryItem } from './game';
import type { RankId } from './progression';
import type { EmpireEventEntry, PropertyUpgradeLevels } from './empire';

export type SafehouseTier =
  | 'motel_room'
  | 'apartment'
  | 'trap_house'
  | 'warehouse'
  | 'nightclub_backroom'
  | 'penthouse'
  | 'private_compound';

export interface SafehouseDefinition {
  id: string;
  name: string;
  tier: SafehouseTier;
  cityId: string;
  areaId: string;
  purchaseCost: number;
  storageCapacity: number;
  heatReductionPerDay: number;
  /** 0–1 robbery weight reduction at this property. */
  robberyProtection: number;
  /** Multiplier on police risk when laying low here (< 1 = safer). */
  policeRiskModifier: number;
  upkeepPerDay: number;
  minRank?: RankId;
  minReputation?: number;
  description: string;
}

export interface OwnedSafehouse {
  safehouseId: string;
  purchasedDay: number;
  upkeepMissedDays: number;
  /** 0–100; drops when upkeep unpaid. */
  condition: number;
  assignedGuardCrewId?: string | null;
  upgradeLevels?: PropertyUpgradeLevels;
  recentEvents?: EmpireEventEntry[];
}

/** Stored inventory keyed by safehouse id. */
export type StoredInventoryBySafehouse = Record<string, InventoryItem[]>;
