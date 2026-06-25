import type { CommodityId } from './game';
import type { RankId } from './progression';

export type CrewRole =
  | 'runner'
  | 'lookout'
  | 'enforcer'
  | 'smuggler'
  | 'accountant'
  | 'fixer'
  | 'dealer'
  | 'supplier_scout';

export type CrewStatus =
  | 'available'
  | 'hired'
  | 'injured'
  | 'arrested'
  | 'betrayed';

export interface CrewBonuses {
  carryCapacity?: number;
  policeEncounterReduction?: number;
  combatBonus?: number;
  travelRiskReduction?: number;
  debtInterestReduction?: number;
  heatReductionBonus?: number;
  bribeBonus?: number;
  salePriceBonus?: number;
  contractPayoutBonus?: number;
  supplierDiscountBonus?: number;
  supplierReliabilityBonus?: number;
}

export interface CrewRecruitOffer {
  id: string;
  templateId: string;
  name: string;
  role: CrewRole;
  cityId: string;
  areaId: string;
  skill: number;
  loyalty: number;
  salaryPerDay: number;
  hireCost: number;
  bonuses: CrewBonuses;
  riskTraits: string[];
  expiresDay: number;
  minRank?: RankId;
  minReputation?: number;
}

export interface HiredCrewMember {
  id: string;
  templateId: string;
  name: string;
  role: CrewRole;
  cityId: string;
  areaId: string;
  skill: number;
  loyalty: number;
  salaryPerDay: number;
  hireCost: number;
  bonuses: CrewBonuses;
  riskTraits: string[];
  status: CrewStatus;
  daysUnpaid: number;
  hiredDay: number;
}

export interface CrewHistoryEntry {
  crewId: string;
  name: string;
  event: string;
  day: number;
}
