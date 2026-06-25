import { CommodityId } from './game';
import { RankId } from './progression';

export type MissionStatus = 'available' | 'active' | 'completed' | 'failed';

export type MissionType =
  | 'trade_run'
  | 'supplier_job'
  | 'buyer_delivery'
  | 'heat_reduction'
  | 'crew_recruitment'
  | 'safehouse_purchase'
  | 'business_purchase'
  | 'territory_influence'
  | 'debt_payment'
  | 'survival_challenge';

export type DailyObjectiveType =
  | 'make_profit'
  | 'travel_city'
  | 'complete_deal'
  | 'lower_heat'
  | 'sell_drug'
  | 'visit_supplier'
  | 'pay_debt'
  | 'avoid_police'
  | 'deposit_safehouse';

export interface MissionRequirement {
  /** Progress key tracked in mission instance progress map. */
  key: string;
  target: number;
  commodityId?: CommodityId;
  cityId?: string;
  areaId?: string;
  minRank?: RankId;
  minReputation?: number;
}

export interface MissionReward {
  cash?: number;
  reputation?: number;
  supplierTrust?: number;
  crewLoyalty?: number;
  heatReduction?: number;
  priceTipCommodity?: CommodityId;
  priceTipCityId?: string;
  priceTipDirection?: 'buy' | 'sell';
}

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  requirements: MissionRequirement[];
  rewards: MissionReward;
  deadlineDays?: number;
  chainId?: string;
  nextMissionId?: string;
  arcOrder?: number;
}

export interface MissionInstance {
  id: string;
  status: MissionStatus;
  progress: Record<string, number>;
  startedDay: number;
  deadlineDay?: number;
  claimed: boolean;
  completedDay?: number;
}

export interface DailyObjective {
  id: string;
  type: DailyObjectiveType;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewards: MissionReward;
  claimed: boolean;
  generatedDay: number;
  commodityId?: CommodityId;
  cityId?: string;
}

export interface PriceTip {
  id: string;
  commodityId: CommodityId;
  cityId: string;
  direction: 'buy' | 'sell';
  expiresDay: number;
}

export type MissionEvent =
  | { kind: 'sell'; quantity: number; profit: number; commodityId: CommodityId }
  | { kind: 'buy_supplier'; amount: number }
  | { kind: 'fulfill_contract'; payout: number }
  | { kind: 'travel_city'; cityId: string }
  | { kind: 'travel_area' }
  | { kind: 'pay_debt'; amount: number }
  | { kind: 'hire_crew' }
  | { kind: 'purchase_safehouse' }
  | { kind: 'purchase_business' }
  | { kind: 'deposit_safehouse'; quantity: number }
  | { kind: 'visit_supplier' }
  | { kind: 'police_encounter' }
  | { kind: 'day_start' }
  | { kind: 'profit_today'; amount: number };

export interface MissionProgressFlags {
  /** Cumulative debt paid toward mission tracking. */
  debtPaidTotal?: number;
  /** Profit earned today for daily objectives. */
  profitToday?: number;
  /** Whether a police encounter fired today. */
  policeEncounterToday?: boolean;
  /** Heat at start of day for lower_heat objective. */
  heatStartOfDay?: number;
  /** Cities visited today. */
  citiesVisitedToday?: string[];
  /** Deals completed today (contracts + supplier). */
  dealsToday?: number;
}
