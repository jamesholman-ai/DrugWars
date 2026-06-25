import { GameState } from '../types/game';
import { getNextRank, getRankProgress } from '../game/progression';

export function computeRankProgressPercent(state: GameState): number {
  const next = getNextRank(state.progression.rankId);
  if (!next) return 100;

  const { stats } = getRankProgress(state);
  const req = next.requirements;
  const ratios: number[] = [];

  if (req.reputation != null) {
    ratios.push(Math.min(1, stats.reputation / req.reputation));
  }
  if (req.netWorth != null) {
    ratios.push(Math.min(1, stats.netWorth / req.netWorth));
  }
  if (req.lifetimeProfit != null) {
    ratios.push(Math.min(1, stats.lifetimeProfit / req.lifetimeProfit));
  }
  if (req.daysSurvived != null) {
    ratios.push(Math.min(1, stats.daysSurvived / req.daysSurvived));
  }

  if (ratios.length === 0) return 0;
  return Math.round((ratios.reduce((sum, r) => sum + r, 0) / ratios.length) * 100);
}

export function heatLevelLabel(heat: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (heat >= 85) return 'Critical';
  if (heat >= 60) return 'High';
  if (heat >= 35) return 'Medium';
  return 'Low';
}

export function riskFromModifier(modifier: number): 'low' | 'medium' | 'high' {
  if (modifier >= 1.3) return 'high';
  if (modifier >= 1.0) return 'medium';
  return 'low';
}
