import { AreaId } from './game';

export type RankId =
  | 'wannabe'
  | 'runner'
  | 'hustler'
  | 'dealer'
  | 'plug'
  | 'shot_caller'
  | 'kingpin'
  | 'empire_boss';

export type ReputationTierId =
  | 'unknown'
  | 'noticed'
  | 'connected'
  | 'feared'
  | 'respected'
  | 'untouchable';

export interface RankRequirements {
  reputation?: number;
  netWorth?: number;
  lifetimeProfit?: number;
  daysSurvived?: number;
}

export interface RankDefinition {
  id: RankId;
  name: string;
  description: string;
  requirements: RankRequirements;
  benefits: string[];
}

export interface ReputationTierDefinition {
  id: ReputationTierId;
  name: string;
  minReputation: number;
}

export interface CityUnlockRequirements {
  rankId?: RankId;
  reputation?: number;
  cash?: number;
  netWorth?: number;
  daysSurvived?: number;
}

/** @deprecated Use CityUnlockRequirements */
export type LocationUnlockRequirements = CityUnlockRequirements;

export interface StashHouseDefinition {
  id: string;
  cityId: string;
  areaId: AreaId;
  name: string;
  description: string;
  cost: number;
  capacityBonus: number;
  /** 0–1 reduction in robbery event weight at this stash. */
  robberyReduction: number;
  extraHeatDecay: number;
}

export interface InventoryUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  capacityBonus: number;
  order: number;
}

export interface ProgressionState {
  rankId: RankId;
  lifetimeProfit: number;
  unlockedCities: string[];
  /** @deprecated Migrated to unlockedCities */
  unlockedLocations?: string[];
  ownedStashHouses: string[];
  purchasedInventoryUpgrades: string[];
}
