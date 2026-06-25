import { GameState } from '../types/game';
import { TutorialState } from '../types/tutorial';
import { TUTORIAL_STEP_COUNT } from '../data/tutorial';
import { ActiveWorldEvent, CommodityId } from '../types/game';
import { getPlayerAreaKey } from '../data/locations';
import { applyWorldEventsToPrices } from './worldEvents';

export function createDefaultTutorial(completed = false): TutorialState {
  return { completed, skipped: false, step: 0 };
}

export function isTutorialActive(state: GameState): boolean {
  const t = state.tutorial;
  if (!t) return false;
  return !t.completed && !t.skipped;
}

export function advanceTutorialStep(state: GameState): GameState {
  const t = state.tutorial ?? createDefaultTutorial(false);
  if (t.completed || t.skipped) return state;

  const next = t.step + 1;
  if (next >= TUTORIAL_STEP_COUNT) {
    return {
      ...state,
      tutorial: { ...t, step: TUTORIAL_STEP_COUNT, completed: true },
    };
  }
  return { ...state, tutorial: { ...t, step: next } };
}

export function skipTutorial(state: GameState): GameState {
  return {
    ...state,
    tutorial: {
      ...(state.tutorial ?? createDefaultTutorial(false)),
      skipped: true,
      completed: true,
    },
  };
}

export function migrateTutorial(raw: unknown, hasExistingProgress: boolean): TutorialState {
  if (typeof raw === 'object' && raw !== null) {
    const e = raw as Record<string, unknown>;
    return {
      completed: e.completed === true || e.skipped === true,
      skipped: e.skipped === true,
      step: typeof e.step === 'number' ? e.step : 0,
    };
  }
  // Legacy saves: do not force tutorial on returning players.
  return createDefaultTutorial(hasExistingProgress);
}

/** Day-1 demand surge so new players see a profitable sell opportunity quickly. */
export function applyFirstSessionMarketBoost(state: GameState): GameState {
  if (state.player.day > 1) return state;

  const areaKey = getPlayerAreaKey(state.player);
  const boom: ActiveWorldEvent = {
    id: 'we_starter_boom',
    type: 'market_boom',
    title: 'Street Demand Surge',
    description: 'Buyers are paying premium in your district. Good day to flip product.',
    affectedLocations: [areaKey],
    affectedCommodities: ['weed', 'ecstasy'] as CommodityId[],
    durationDays: 3,
    priceMultiplier: 1.32,
    heatMultiplier: 1,
    eventWeightModifiers: {},
    startDay: 1,
    expiresDay: 4,
    severity: 'medium',
  };

  const events = [...(state.activeWorldEvents ?? []), boom];
  return {
    ...state,
    activeWorldEvents: events,
    marketPrices: applyWorldEventsToPrices(state.marketPrices, events),
    messageLog: [
      'Local demand spike — weed & ecstasy prices elevated for 3 days.',
      ...(state.messageLog ?? []),
    ].slice(0, 20),
  };
}
