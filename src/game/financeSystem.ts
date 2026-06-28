import { GameState } from '../types/game';
import { FinanceLogEntry, FinanceLogKind } from '../types/finance';
import { getAccountantDebtReduction } from './crewBonuses';
import { DAILY_DEBT_INTEREST } from './debtConstants';
import { spendMoney, normalizeMoneyFields } from './money';
import { withMessage } from './messages';
import { ACTION_FEEDBACK } from './empireFlavorText';
import { clamp } from '../utils/random';
import { trackMissionEvent } from './missionSystem';
import { applyProgressionAfterAction } from './progression';

export const MAX_FINANCE_LOG = 20;
export const AREA_MOVES_BEFORE_DAY_ADVANCE = 3;

function uniqueFinanceId(day: number, kind: string): string {
  return `fin_${day}_${kind}_${Math.floor(Math.random() * 1e6)}`;
}

export function createDefaultFinanceFields(day = 1): {
  areaMovesToday: number;
  lastAreaMoveDay: number;
  financeLog: FinanceLogEntry[];
} {
  return {
    areaMovesToday: 0,
    lastAreaMoveDay: day,
    financeLog: [],
  };
}

export function migrateFinanceLog(raw: unknown): FinanceLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is FinanceLogEntry => {
      if (!e || typeof e !== 'object') return false;
      const entry = e as FinanceLogEntry;
      return (
        typeof entry.id === 'string' &&
        typeof entry.day === 'number' &&
        typeof entry.kind === 'string' &&
        typeof entry.amount === 'number' &&
        typeof entry.message === 'string'
      );
    })
    .slice(0, MAX_FINANCE_LOG);
}

export function appendFinanceLog(
  state: GameState,
  kind: FinanceLogKind,
  amount: number,
  message: string
): GameState {
  if (amount <= 0 && kind !== 'debt_interest') {
    return state;
  }
  const entry: FinanceLogEntry = {
    id: uniqueFinanceId(state.player.day, kind),
    day: state.player.day,
    kind,
    amount: Math.max(0, Math.floor(amount)),
    message,
  };
  const financeLog = [entry, ...(state.financeLog ?? [])].slice(0, MAX_FINANCE_LOG);
  return { ...state, financeLog };
}

export function resetAreaMovesOnDayAdvance(state: GameState): GameState {
  return {
    ...state,
    areaMovesToday: 0,
    lastAreaMoveDay: state.player.day,
  };
}

export function getEffectiveDebtInterestRate(state: GameState): number {
  return DAILY_DEBT_INTEREST * (1 - getAccountantDebtReduction(state));
}

export function getNextDayInterest(state: GameState): number {
  if (state.player.debt <= 0) return 0;
  return Math.floor(state.player.debt * getEffectiveDebtInterestRate(state));
}

export function getAreaMovesToday(state: GameState): number {
  if ((state.lastAreaMoveDay ?? state.player.day) !== state.player.day) {
    return 0;
  }
  return Math.max(0, state.areaMovesToday ?? 0);
}

export function recordAreaMove(state: GameState): {
  state: GameState;
  movesToday: number;
  triggersDayAdvance: boolean;
} {
  const day = state.player.day;
  const sameDay = (state.lastAreaMoveDay ?? day) === day;
  const movesToday = sameDay ? getAreaMovesToday(state) + 1 : 1;
  const triggersDayAdvance = movesToday >= AREA_MOVES_BEFORE_DAY_ADVANCE;
  return {
    state: {
      ...state,
      areaMovesToday: movesToday,
      lastAreaMoveDay: day,
    },
    movesToday,
    triggersDayAdvance,
  };
}

export function payDebtTowardLoan(state: GameState, amount: number): GameState {
  if (amount <= 0 || state.player.isGameOver) {
    return state;
  }

  if (state.player.debt <= 0) {
    return withMessage(state, 'You have no debt. Clean slate.');
  }

  const payment = Math.min(Math.floor(amount), state.player.cash, state.player.debt);
  if (payment <= 0) {
    return withMessage(state, 'No cash available to pay debt.');
  }

  const afterSpend = spendMoney(state.player, payment, true);
  if (!afterSpend) {
    return withMessage(state, 'No cash available to pay debt.');
  }

  const remaining = Math.max(0, state.player.debt - payment);
  const repGain = payment >= 1000 ? 3 : payment >= 500 ? 2 : 1;

  let updated: GameState = {
    ...state,
    player: normalizeMoneyFields({
      ...afterSpend,
      debt: remaining,
      reputation: clamp(state.player.reputation + repGain, 0, 100),
    }),
  };

  updated = appendFinanceLog(
    updated,
    'debt_payment',
    payment,
    `Paid $${payment.toLocaleString()} toward debt.`
  );

  updated = withMessage(updated, `${ACTION_FEEDBACK.debtPaid(payment)} Remaining $${updated.player.debt.toLocaleString()}.`);

  updated = trackMissionEvent(updated, { kind: 'pay_debt', amount: payment });
  return applyProgressionAfterAction(updated);
}

export function logDebtInterest(state: GameState, interest: number): GameState {
  if (interest <= 0) return state;
  return appendFinanceLog(
    state,
    'debt_interest',
    interest,
    `Debt interest +$${interest.toLocaleString()}.`
  );
}
