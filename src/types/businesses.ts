import type { RankId } from './progression';
import type { BusinessUpgradeLevels, EmpireEventEntry } from './empire';

export type BusinessType =
  | 'pawn_shop'
  | 'car_wash'
  | 'bar'
  | 'nightclub'
  | 'strip_club'
  | 'tow_yard'
  | 'laundromat'
  | 'used_car_lot'
  | 'shipping_company'
  | 'casino_room'
  | 'real_estate_office'
  | 'import_warehouse';

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
  businessIncome: number;
  businessUpkeep: number;
  laundered: number;
  heatReduced: number;
  raids: string[];
}
