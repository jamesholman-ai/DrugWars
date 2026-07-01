import { RankId } from '../types/progression';
import { GameState } from '../types/game';
import { RANKS } from './progression';
import {
  DISTRICT_BUSINESS_VISIBLE_MAX,
  DISTRICT_BUSINESS_VISIBLE_MIN,
  DISTRICT_CREW_VISIBLE,
} from './businessTemplates';

export interface RankMechanicalBenefits {
  maxHiredCrew: number;
  maxActiveContracts: number;
  maxBusinessTier: number;
  maxCrewQualityTier: number;
  businessListingCount: number;
  crewRecruitCount: number;
  supplierTierUnlock: number;
  intelQualityBonus: number;
  travelCostReduction: number;
  heatManagementBonus: number;
  robberyRiskReduction: number;
  businessUpgradeTierUnlock: number;
  /** Human-readable unlock lines for UI. */
  unlocks: string[];
}

export const RANK_MECHANICAL_BENEFITS: Record<RankId, RankMechanicalBenefits> = {
  wannabe: {
    maxHiredCrew: 2,
    maxActiveContracts: 1,
    maxBusinessTier: 1,
    maxCrewQualityTier: 1,
    businessListingCount: DISTRICT_BUSINESS_VISIBLE_MIN,
    crewRecruitCount: 15,
    supplierTierUnlock: 1,
    intelQualityBonus: 0,
    travelCostReduction: 0,
    heatManagementBonus: 0,
    robberyRiskReduction: 0,
    businessUpgradeTierUnlock: 1,
    unlocks: [
      'New York, Miami, Atlanta markets',
      'Starter suppliers and street contracts',
      'Low-tier crew recruits (15 shown)',
      'Tier-1 business listings',
    ],
  },
  runner: {
    maxHiredCrew: 3,
    maxActiveContracts: 2,
    maxBusinessTier: 2,
    maxCrewQualityTier: 2,
    businessListingCount: 11,
    crewRecruitCount: 18,
    supplierTierUnlock: 2,
    intelQualityBonus: 0.05,
    travelCostReduction: 0.05,
    heatManagementBonus: 0,
    robberyRiskReduction: 0.02,
    businessUpgradeTierUnlock: 1,
    unlocks: [
      'Los Angeles & Chicago routes',
      'Basic property purchases',
      'Better crew candidate pool',
      'Small supplier trust boost',
      'Tier-2 business listings',
    ],
  },
  hustler: {
    maxHiredCrew: 4,
    maxActiveContracts: 2,
    maxBusinessTier: 2,
    maxCrewQualityTier: 3,
    businessListingCount: 12,
    crewRecruitCount: 20,
    supplierTierUnlock: 2,
    intelQualityBonus: 0.08,
    travelCostReduction: 0.08,
    heatManagementBonus: 1,
    robberyRiskReduction: 0.04,
    businessUpgradeTierUnlock: 2,
    unlocks: [
      'Detroit & Austin access',
      'Improved contract payouts',
      'More business listings per district',
      'Inventory upgrade tier 2',
      'Supplier deals improve',
    ],
  },
  dealer: {
    maxHiredCrew: 5,
    maxActiveContracts: 3,
    maxBusinessTier: 3,
    maxCrewQualityTier: 4,
    businessListingCount: 13,
    crewRecruitCount: 22,
    supplierTierUnlock: 3,
    intelQualityBonus: 0.12,
    travelCostReduction: 0.1,
    heatManagementBonus: 2,
    robberyRiskReduction: 0.08,
    businessUpgradeTierUnlock: 2,
    unlocks: [
      'Seattle & Boston access',
      'Mid-tier businesses unlock',
      '+1 crew slot (5 max)',
      'Better laundering fronts',
      'Lower small-time robbery risk',
    ],
  },
  plug: {
    maxHiredCrew: 6,
    maxActiveContracts: 3,
    maxBusinessTier: 4,
    maxCrewQualityTier: 5,
    businessListingCount: 14,
    crewRecruitCount: 23,
    supplierTierUnlock: 4,
    intelQualityBonus: 0.16,
    travelCostReduction: 0.12,
    heatManagementBonus: 3,
    robberyRiskReduction: 0.1,
    businessUpgradeTierUnlock: 3,
    unlocks: [
      'Las Vegas & San Francisco routes',
      'Cartel supplier access',
      'Warehouse & import businesses',
      'High-value contracts',
      'Improved intel quality',
    ],
  },
  shot_caller: {
    maxHiredCrew: 7,
    maxActiveContracts: 4,
    maxBusinessTier: 4,
    maxCrewQualityTier: 6,
    businessListingCount: 14,
    crewRecruitCount: 24,
    supplierTierUnlock: 4,
    intelQualityBonus: 0.2,
    travelCostReduction: 0.15,
    heatManagementBonus: 4,
    robberyRiskReduction: 0.12,
    businessUpgradeTierUnlock: 3,
    unlocks: [
      'Toronto access',
      'Premium crew recruits',
      'High-tier properties',
      'Business expansion upgrades',
      'Multi-city contract deals',
    ],
  },
  kingpin: {
    maxHiredCrew: 8,
    maxActiveContracts: 4,
    maxBusinessTier: 5,
    maxCrewQualityTier: 7,
    businessListingCount: DISTRICT_BUSINESS_VISIBLE_MAX,
    crewRecruitCount: 25,
    supplierTierUnlock: 5,
    intelQualityBonus: 0.25,
    travelCostReduction: 0.18,
    heatManagementBonus: 5,
    robberyRiskReduction: 0.15,
    businessUpgradeTierUnlock: 4,
    unlocks: [
      'London access',
      'Elite contracts & luxury fronts',
      'Top-tier businesses',
      'Heat management bonuses',
      'Maximum business listings',
    ],
  },
  empire_boss: {
    maxHiredCrew: 10,
    maxActiveContracts: 5,
    maxBusinessTier: 5,
    maxCrewQualityTier: 8,
    businessListingCount: DISTRICT_BUSINESS_VISIBLE_MAX,
    crewRecruitCount: DISTRICT_CREW_VISIBLE,
    supplierTierUnlock: 5,
    intelQualityBonus: 0.3,
    travelCostReduction: 0.22,
    heatManagementBonus: 6,
    robberyRiskReduction: 0.18,
    businessUpgradeTierUnlock: 5,
    unlocks: [
      'Paris & Amsterdam unlock',
      'Best businesses & top crew',
      'Endgame missions & prestige hooks',
      'Major city unlocks complete',
      'Maximum empire capacity',
    ],
  },
};

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

export function getRankBenefits(rankId: RankId): RankMechanicalBenefits {
  return RANK_MECHANICAL_BENEFITS[rankId] ?? RANK_MECHANICAL_BENEFITS.wannabe;
}

export function getRankBenefitsForState(state: GameState): RankMechanicalBenefits {
  return getRankBenefits(state.progression.rankId);
}

export function getMaxHiredCrew(state: GameState): number {
  return getRankBenefitsForState(state).maxHiredCrew;
}

export function getMaxActiveContracts(state: GameState): number {
  return getRankBenefitsForState(state).maxActiveContracts;
}

export function getMaxBusinessTier(state: GameState): number {
  return getRankBenefitsForState(state).maxBusinessTier;
}

export function getMaxCrewQualityTier(state: GameState): number {
  return getRankBenefitsForState(state).maxCrewQualityTier;
}

export function formatRankUnlockSummary(rankId: RankId): string {
  return getRankBenefits(rankId).unlocks.slice(0, 3).join(', ');
}

export function compareRankRankings(a: RankId, b: RankId): number {
  return rankIndex(a) - rankIndex(b);
}

export function getCrewSkillCapForRank(rankId: RankId): number {
  const tier = getRankBenefits(rankId).maxCrewQualityTier;
  return 35 + tier * 8;
}

export function getEffectiveTravelCostMultiplier(state: GameState): number {
  const reduction = getRankBenefitsForState(state).travelCostReduction;
  return Math.max(0.7, 1 - reduction);
}

export function getEffectiveRobberyMultiplier(state: GameState, baseMultiplier: number): number {
  const reduction = getRankBenefitsForState(state).robberyRiskReduction;
  return Math.max(0.35, baseMultiplier * (1 - reduction));
}
