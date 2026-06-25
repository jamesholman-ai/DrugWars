import type { RankId } from './progression';

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
