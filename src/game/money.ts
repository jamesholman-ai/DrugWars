import { GameState, PlayerState } from '../types/game';

/** Ensures dirty/clean tracking exists and matches total cash. */
export function normalizeMoneyFields(player: PlayerState): PlayerState {
  const cash = Math.max(0, player.cash);
  let dirty = player.dirtyCash ?? 0;
  let clean = player.cleanCash ?? 0;

  if (dirty + clean === 0 && cash > 0) {
    dirty = cash;
    clean = 0;
  }

  if (dirty + clean > cash) {
    const ratio = cash / (dirty + clean);
    dirty = Math.floor(dirty * ratio);
    clean = Math.max(0, cash - dirty);
  } else if (dirty + clean < cash) {
    dirty += cash - (dirty + clean);
  }

  return {
    ...player,
    cash,
    dirtyCash: Math.max(0, dirty),
    cleanCash: Math.max(0, clean),
  };
}

export function addDirtyMoney(player: PlayerState, amount: number): PlayerState {
  if (amount <= 0) return player;
  const p = normalizeMoneyFields(player);
  return normalizeMoneyFields({
    ...p,
    cash: p.cash + amount,
    dirtyCash: (p.dirtyCash ?? 0) + amount,
  });
}

export function addCleanMoney(player: PlayerState, amount: number): PlayerState {
  if (amount <= 0) return player;
  const p = normalizeMoneyFields(player);
  return normalizeMoneyFields({
    ...p,
    cash: p.cash + amount,
    cleanCash: (p.cleanCash ?? 0) + amount,
  });
}

export function launderMoney(player: PlayerState, amount: number): PlayerState {
  const p = normalizeMoneyFields(player);
  const move = Math.min(amount, p.dirtyCash ?? 0);
  if (move <= 0) return p;
  return normalizeMoneyFields({
    ...p,
    dirtyCash: (p.dirtyCash ?? 0) - move,
    cleanCash: (p.cleanCash ?? 0) + move,
  });
}

export function seizeDirtyMoney(player: PlayerState, amount: number): PlayerState {
  const p = normalizeMoneyFields(player);
  const seized = Math.min(amount, p.dirtyCash ?? 0, p.cash);
  return normalizeMoneyFields({
    ...p,
    cash: p.cash - seized,
    dirtyCash: (p.dirtyCash ?? 0) - seized,
  });
}

/** Spend money preferring clean cash when preferClean is true. Returns null if insufficient. */
export function spendMoney(
  player: PlayerState,
  amount: number,
  preferClean = true
): PlayerState | null {
  if (amount <= 0) return player;
  const p = normalizeMoneyFields(player);
  if (p.cash < amount) return null;

  let remaining = amount;
  let clean = p.cleanCash ?? 0;
  let dirty = p.dirtyCash ?? 0;

  if (preferClean) {
    const fromClean = Math.min(remaining, clean);
    clean -= fromClean;
    remaining -= fromClean;
  }

  if (remaining > 0) {
    const fromDirty = Math.min(remaining, dirty);
    dirty -= fromDirty;
    remaining -= fromDirty;
  }

  if (remaining > 0) return null;

  return normalizeMoneyFields({
    ...p,
    cash: p.cash - amount,
    cleanCash: clean,
    dirtyCash: dirty,
  });
}

export function getTotalCash(state: GameState): number {
  return normalizeMoneyFields(state.player).cash;
}
