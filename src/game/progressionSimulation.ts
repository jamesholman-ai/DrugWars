/**
 * Lightweight progression curve estimate for balance tuning.
 */
import { createInitialGameState, stayHere } from './engine';
import { normalizeGameState } from './stateUtils';
import { getNetWorth } from './economy';
import { getCurrentRank } from './progression';

const SESSION_TARGETS = [
  { label: '10 min (~15 days)', days: 15 },
  { label: '1 hour (~60 days)', days: 60 },
  { label: '5 hours (~300 days)', days: 300 },
  { label: '20 hours (~1200 days)', days: 1200 },
];

function simulatePassiveDays(days: number) {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    player: {
      ...state.player,
      reputation: Math.min(100, 8 + Math.floor(days / 8)),
    },
    progression: {
      ...state.progression,
      lifetimeProfit: days * 120,
    },
  };

  for (let i = 0; i < days; i++) {
    state = stayHere(state);
    if (state.player.isGameOver) break;
  }

  return state;
}

export function runProgressionSimulation(): string[] {
  const lines: string[] = ['Progression simulation (passive day-advance baseline)'];
  for (const target of SESSION_TARGETS) {
    const state = simulatePassiveDays(target.days);
    const netWorth = getNetWorth(state.player, state.marketPrices);
    const rank = getCurrentRank(state);
    lines.push(
      `${target.label}: day ${state.player.day}, rank ${rank.name}, cash $${state.player.cash}, net $${netWorth}, debt $${state.player.debt}`
    );
  }
  return lines;
}
