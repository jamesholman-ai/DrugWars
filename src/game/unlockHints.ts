import { BusinessDefinition } from '../types/businesses';
import { CrewRecruitOffer, CrewRole } from '../types/crew';
import { GameState } from '../types/game';
import { RankId } from '../types/progression';
import { TIER_MIN_RANK, BusinessTier } from '../data/businessTemplates';
import { RANK_MAP, RANKS } from '../data/progression';
import {
  getCrewSkillCapForRank,
  getMaxBusinessTier,
  getMaxCrewQualityTier,
  getMaxHiredCrew,
  getRankBenefits,
  getRankBenefitsForState,
} from '../data/rankBenefits';
import { formatMoney } from '../utils/format';
import { getNextRank, isCityUnlocked } from './progression';
import { isBusinessOwned, meetsBusinessUnlock } from './businessSystem';

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function rankName(rankId: RankId): string {
  return RANK_MAP[rankId]?.name ?? rankId;
}

export function meetsCrewRecruitUnlock(state: GameState, offer: CrewRecruitOffer): boolean {
  if (!isCityUnlocked(state, offer.cityId)) return false;
  if (offer.minRank && rankIndex(state.progression.rankId) < rankIndex(offer.minRank)) {
    return false;
  }
  if (offer.minReputation != null && state.player.reputation < offer.minReputation) {
    return false;
  }
  return true;
}

export function hasOpenCrewSlot(state: GameState): boolean {
  const active = (state.hiredCrew ?? []).filter((c) => c.status === 'hired').length;
  return active < getMaxHiredCrew(state);
}

export function canAffordCrewRecruit(state: GameState, offer: CrewRecruitOffer): boolean {
  return state.player.cash >= offer.hireCost;
}

export function canHireCrewRecruit(state: GameState, offer: CrewRecruitOffer): boolean {
  return meetsCrewRecruitUnlock(state, offer) && hasOpenCrewSlot(state) && canAffordCrewRecruit(state, offer);
}

export function getBusinessLockHints(state: GameState, def: BusinessDefinition): string[] {
  const hints: string[] = [];
  const { player, progression } = state;
  const tier = def.tier ?? 1;
  const maxTier = getMaxBusinessTier(state);

  if (tier > maxTier) {
    const tierKey = Math.min(5, Math.max(1, tier)) as BusinessTier;
    hints.push(`Requires ${rankName(TIER_MIN_RANK[tierKey])} rank`);
  }
  if (def.requiredRank && rankIndex(progression.rankId) < rankIndex(def.requiredRank)) {
    hints.push(`Requires ${rankName(def.requiredRank)} rank`);
  }
  if (def.requiredReputation != null && player.reputation < def.requiredReputation) {
    hints.push(`Requires ${def.requiredReputation} reputation`);
  }
  if (player.cash < def.purchaseCost) {
    hints.push(`Requires ${formatMoney(def.purchaseCost)} cash`);
  }

  return [...new Set(hints)];
}

export function isBusinessRankLocked(state: GameState, def: BusinessDefinition): boolean {
  return !meetsBusinessUnlock(state, def);
}

export function isBusinessCashLocked(state: GameState, def: BusinessDefinition): boolean {
  return meetsBusinessUnlock(state, def) && state.player.cash < def.purchaseCost;
}

export function getBusinessesUnlockedAtNextRank(
  state: GameState,
  businesses: BusinessDefinition[]
): BusinessDefinition[] {
  const nextRank = getNextRank(state.progression.rankId);
  if (!nextRank) return [];

  const nextBenefits = getRankBenefits(nextRank.id);

  return businesses.filter((def) => {
    if (isBusinessOwned(state, def.id)) return false;
    if (meetsBusinessUnlock(state, def)) return false;

    const tier = def.tier ?? 1;
    const tierUnlocks =
      tier > getMaxBusinessTier(state) && tier <= nextBenefits.maxBusinessTier;
    const rankUnlocks =
      def.requiredRank != null &&
      rankIndex(state.progression.rankId) < rankIndex(def.requiredRank) &&
      rankIndex(nextRank.id) >= rankIndex(def.requiredRank);
    const repOk =
      def.requiredReputation == null || state.player.reputation >= def.requiredReputation;

    return repOk && (tierUnlocks || rankUnlocks);
  });
}

export function getCrewRecruitLockHints(state: GameState, offer: CrewRecruitOffer): string[] {
  const hints: string[] = [];

  if (offer.minRank && rankIndex(state.progression.rankId) < rankIndex(offer.minRank)) {
    hints.push(`Requires ${rankName(offer.minRank)} rank`);
  }
  if (offer.minReputation != null && state.player.reputation < offer.minReputation) {
    hints.push(`Requires ${offer.minReputation} reputation`);
  }
  if (!hasOpenCrewSlot(state)) {
    hints.push('Requires open crew slot');
  }
  if (!canAffordCrewRecruit(state, offer)) {
    hints.push(`Requires ${formatMoney(offer.hireCost)} cash`);
  }

  return [...new Set(hints)];
}

export function getCrewQualityTierLabel(tier: number): string {
  if (tier <= 1) return 'Street tier';
  if (tier <= 3) return 'Mid tier';
  if (tier <= 5) return 'Pro tier';
  if (tier <= 7) return 'Elite tier';
  return 'Legend tier';
}

export function getRankUpMechanicalUnlocks(previousRankId: RankId, newRankId: RankId): string[] {
  const prev = getRankBenefits(previousRankId);
  const next = getRankBenefits(newRankId);
  const lines: string[] = [];

  if (next.maxBusinessTier > prev.maxBusinessTier) {
    lines.push(`Business tier ${next.maxBusinessTier} fronts`);
  }
  if (next.maxHiredCrew > prev.maxHiredCrew) {
    const delta = next.maxHiredCrew - prev.maxHiredCrew;
    lines.push(`+${delta} crew slot${delta > 1 ? 's' : ''} (${next.maxHiredCrew} max)`);
  }
  if (next.maxCrewQualityTier > prev.maxCrewQualityTier) {
    lines.push(`Recruit quality: ${getCrewQualityTierLabel(next.maxCrewQualityTier)}`);
  }
  if (next.maxActiveContracts > prev.maxActiveContracts) {
    lines.push(`${next.maxActiveContracts} active contract slots`);
  }
  if (next.intelQualityBonus > prev.intelQualityBonus) {
    const delta = Math.round((next.intelQualityBonus - prev.intelQualityBonus) * 100);
    lines.push(`Intel quality +${delta}%`);
  }

  return lines;
}

export function formatBusinessTierSummary(state: GameState): {
  currentTier: number;
  nextTier: number | null;
  nextRankName: string | null;
  crewQualityLabel: string;
  crewSkillCap: number;
} {
  const benefits = getRankBenefitsForState(state);
  const nextRank = getNextRank(state.progression.rankId);
  return {
    currentTier: benefits.maxBusinessTier,
    nextTier: nextRank ? getRankBenefits(nextRank.id).maxBusinessTier : null,
    nextRankName: nextRank?.name ?? null,
    crewQualityLabel: getCrewQualityTierLabel(benefits.maxCrewQualityTier),
    crewSkillCap: getCrewSkillCapForRank(state.progression.rankId),
  };
}

export function percentileThreshold(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * percentile);
  return sorted[idx] ?? 0;
}

export function filterBusinessesByChip(
  state: GameState,
  businesses: BusinessDefinition[],
  filter: 'all' | 'affordable' | 'locked' | 'owned' | 'high_income' | 'laundering'
): BusinessDefinition[] {
  const incomes = businesses.map((b) => b.dailyIncome);
  const launders = businesses.map((b) => b.launderingCapacityPerDay);
  const incomeThreshold = Math.max(120, percentileThreshold(incomes, 0.65));
  const launderThreshold = Math.max(200, percentileThreshold(launders, 0.65));

  switch (filter) {
    case 'affordable':
      return businesses.filter(
        (def) =>
          !isBusinessOwned(state, def.id) &&
          meetsBusinessUnlock(state, def) &&
          state.player.cash >= def.purchaseCost
      );
    case 'locked':
      return businesses.filter(
        (def) => !isBusinessOwned(state, def.id) && isBusinessRankLocked(state, def)
      );
    case 'owned':
      return businesses.filter((def) => isBusinessOwned(state, def.id));
    case 'high_income':
      return businesses.filter((def) => def.dailyIncome >= incomeThreshold);
    case 'laundering':
      return businesses.filter((def) => def.launderingCapacityPerDay >= launderThreshold);
    default:
      return businesses;
  }
}

export function filterCrewRecruitsByChip(
  state: GameState,
  recruits: CrewRecruitOffer[],
  filter: 'all' | 'affordable' | 'locked' | 'role',
  roleFilter?: CrewRole
): CrewRecruitOffer[] {
  switch (filter) {
    case 'affordable':
      return recruits.filter((r) => canHireCrewRecruit(state, r));
    case 'locked':
      return recruits.filter((r) => !meetsCrewRecruitUnlock(state, r) || !hasOpenCrewSlot(state));
    case 'role':
      return roleFilter ? recruits.filter((r) => r.role === roleFilter) : recruits;
    default:
      return recruits;
  }
}
