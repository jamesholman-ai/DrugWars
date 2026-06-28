/**
 * Regression smoke tests for Finance + Time Rules.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/financeSmokeTest.ts
 */
import { GameState } from '../types/game';
import { FinanceLogKind } from '../types/finance';
import {
  appendFinanceLog,
  getAreaMovesToday,
  MAX_FINANCE_LOG,
  payDebtTowardLoan,
  recordAreaMove,
} from './financeSystem';
import {
  borrowMoney,
  createInitialGameState,
  payDebt,
  stayHere,
  travelToArea,
  travelToCity,
} from './engine';
import { migrateGameState, SAVE_VERSION } from './saveStorage';
import { normalizeGameState } from './stateUtils';
import { normalizeMoneyFields } from './money';
import { RootStackParamList } from '../types/game';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertNonNegativeCashDebt(state: GameState, label: string): void {
  assert(state.player.cash >= 0, `${label}: cash negative (${state.player.cash})`);
  assert(state.player.debt >= 0, `${label}: debt negative (${state.player.debt})`);
  const p = normalizeMoneyFields(state.player);
  assert(
    (p.dirtyCash ?? 0) + (p.cleanCash ?? 0) === p.cash,
    `${label}: dirty+clean !== cash (${p.dirtyCash}+${p.cleanCash} vs ${p.cash})`
  );
}

function withStableRandom<T>(fn: () => T): T {
  const original = Math.random;
  Math.random = () => 0.99;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    ...overrides,
    player: normalizeMoneyFields({
      ...state.player,
      ...(overrides.player ?? {}),
    }),
  };
  return state;
}

function testFinanceLogOrderAndCap(): void {
  let state = baseState();
  for (let i = 0; i < 25; i++) {
    state = appendFinanceLog(state, 'debt_payment', 100, `entry ${i}`);
  }
  assert((state.financeLog ?? []).length === MAX_FINANCE_LOG, 'finance log capped at 20');
  assert(state.financeLog![0].message === 'entry 24', 'newest entry first');
  assert(state.financeLog![19].message === 'entry 5', 'oldest kept is entry 5');
}

function testDebtPaymentPresetsAndBounds(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 5000,
      cleanCash: 2000,
      dirtyCash: 3000,
      debt: 4500,
    }),
  });

  state = payDebt(state, 100);
  assert(state.player.debt === 4400, 'pay $100');
  assert(state.player.cash === 4900, 'cash reduced by 100');
  assertNonNegativeCashDebt(state, 'pay $100');

  state = payDebt(state, 500);
  assert(state.player.debt === 3900, 'pay $500');

  state = payDebt(state, 1000);
  assert(state.player.debt === 2900, 'pay $1000');

  state = payDebt(state, Math.floor(state.player.debt * 0.25));
  assert(state.player.debt === 2175, 'pay 25%');

  state = payDebt(state, Math.floor(state.player.debt * 0.5));
  assert(state.player.debt === 1088, 'pay 50% (floor)');

  const maxPay = Math.min(state.player.cash, state.player.debt);
  state = payDebt(state, maxPay);
  assert(state.player.debt === 0, 'pay all clears debt');
  assert(state.player.cash >= 0, 'cash non-negative after pay all');

  state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 500,
      cleanCash: 500,
      dirtyCash: 0,
      debt: 2000,
    }),
  });
  state = payDebt(state, 9999);
  assert(state.player.debt === 1500, 'cannot pay more than cash');
  assert(state.player.cash === 0, 'cash drained to zero not below');

  state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 10000,
      cleanCash: 10000,
      dirtyCash: 0,
      debt: 50,
    }),
  });
  state = payDebt(state, 500);
  assert(state.player.debt === 0, 'cannot pay more than debt');
  assert(state.player.cash === 9950, 'only debt amount taken');
}

function testCleanBeforeDirty(): void {
  const state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 1000,
      cleanCash: 400,
      dirtyCash: 600,
      debt: 800,
    }),
  });

  const after = payDebtTowardLoan(state, 550);
  assert(after.player.cleanCash === 0, 'clean cash spent first');
  assert(after.player.dirtyCash === 450, 'remainder from dirty');
  assert(after.player.cash === 450, 'total cash correct');
  assert(after.player.debt === 250, 'debt reduced correctly');
}

function testMissionProgressOnDebtPayment(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 3000,
      cleanCash: 3000,
      dirtyCash: 0,
      debt: 2000,
    }),
    dailyObjectives: [
      {
        id: 'test_pay_debt',
        type: 'pay_debt',
        title: 'Pay debt',
        description: 'test objective',
        target: 2000,
        progress: 0,
        generatedDay: createInitialGameState().player.day,
        rewards: { cash: 100 },
        claimed: false,
      },
    ],
  });

  state = payDebt(state, 750);
  const objective = (state.dailyObjectives ?? []).find((o) => o.id === 'test_pay_debt');
  assert(objective?.progress === 750, 'daily pay_debt objective progress increments');
}

function testBorrowing(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 1000,
      cleanCash: 1000,
      dirtyCash: 0,
      debt: 1000,
    }),
  });

  state = borrowMoney(state, 1000);
  assert(state.player.debt === 2000, 'debt increases');
  assert(state.player.cash === 2000, 'cash increases');
  assert(state.player.cleanCash === 1000, 'clean cash unchanged after borrow');
  assert(state.player.dirtyCash === 1000, 'borrowed cash tracked as dirty');
  assertNonNegativeCashDebt(state, 'borrow');
  assert(
    (state.financeLog ?? []).some((e) => e.kind === 'borrow'),
    'borrow logged'
  );

  const invalid = borrowMoney(state, 999);
  assert(invalid.player.debt === state.player.debt, 'invalid borrow rejected');
}

function testStayHereAdvancesOneDayWithEffects(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      day: 5,
      cash: 10000,
      cleanCash: 5000,
      dirtyCash: 5000,
      debt: 4000,
    }),
    ownedBusinesses: [
      { businessId: 'biz_ny_harlem_pawn', purchasedDay: 1, condition: 100, upkeepMissedDays: 0 },
    ],
    ownedSafehouses: [
      { safehouseId: 'sh_ny_harlem_motel', purchasedDay: 1, condition: 80, upkeepMissedDays: 0 },
    ],
    hiredCrew: [],
    areaMovesToday: 2,
    lastAreaMoveDay: 5,
  });

  const cashBefore = state.player.cash;
  const debtBefore = state.player.debt;

  state = withStableRandom(() => stayHere(state));

  assert(state.player.day === 6, 'stay advances exactly 1 day');
  assert(state.player.debt > debtBefore, 'interest applied');
  assert(state.player.cash !== cashBefore, 'payroll/upkeep/income changed cash');
  assert(state.areaMovesToday === 0, 'areaMovesToday reset after day advance');
  assert(state.lastAreaMoveDay === 6, 'lastAreaMoveDay updated');
  assert(state.lastDaySummary != null, 'day summary recorded');
  assertNonNegativeCashDebt(state, 'stay here');
}

function testStayHereLaundersDirtyCash(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      day: 4,
      cash: 5000,
      cleanCash: 1000,
      dirtyCash: 4000,
      debt: 3000,
    }),
    ownedBusinesses: [
      { businessId: 'biz_ny_harlem_pawn', purchasedDay: 1, condition: 100, upkeepMissedDays: 0 },
    ],
  });

  const dirtyBefore = state.player.dirtyCash ?? 0;
  state = withStableRandom(() => stayHere(state));
  assert(
    (state.player.dirtyCash ?? 0) < dirtyBefore,
    'stay here triggers business laundering'
  );
  assert((state.lastDaySummary?.laundered ?? 0) > 0, 'laundering recorded in day summary');
}

function testAreaMovesTimeRules(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      day: 3,
      cash: 50000,
      cleanCash: 50000,
      dirtyCash: 0,
      currentCityId: 'new_york',
      currentAreaId: 'new_york_downtown',
    }),
    areaMovesToday: 0,
    lastAreaMoveDay: 3,
  });

  const dayStart = state.player.day;

  state = withStableRandom(() => travelToArea(state, 'new_york_harlem'));
  assert(state.player.day === dayStart, 'area move 1 does not advance day');
  assert(getAreaMovesToday(state) === 1, 'area move count 1');

  state = withStableRandom(() => travelToArea(state, 'new_york_brooklyn'));
  assert(state.player.day === dayStart, 'area move 2 does not advance day');
  assert(getAreaMovesToday(state) === 2, 'area move count 2');

  state = withStableRandom(() => travelToArea(state, 'new_york_queens'));
  assert(state.player.day === dayStart + 1, 'area move 3 advances exactly 1 day');
  assert(state.areaMovesToday === 0, 'areaMovesToday reset after 3rd move day advance');
  assertNonNegativeCashDebt(state, 'after 3 area moves');
}

function testCityTravelAdvancesOneDay(): void {
  let state = baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      day: 10,
      cash: 50000,
      cleanCash: 50000,
      dirtyCash: 0,
      currentCityId: 'new_york',
      currentAreaId: 'new_york_downtown',
    }),
    progression: {
      ...createInitialGameState().progression,
      unlockedCities: ['new_york', 'miami', 'los_angeles', 'atlanta', 'detroit', 'chicago'],
    },
  });

  const dayStart = state.player.day;
  state = withStableRandom(() => travelToCity(state, 'miami'));
  assert(state.player.day === dayStart + 1, 'city travel advances exactly 1 day');
  assert(state.player.currentCityId === 'miami', 'arrived in miami');
  assertNonNegativeCashDebt(state, 'city travel');
}

function testSaveMigrationV11(): void {
  const legacy = baseState({
    financeLog: undefined,
    areaMovesToday: undefined,
    lastAreaMoveDay: undefined,
  });
  delete (legacy as { areaMovesToday?: number }).areaMovesToday;
  delete (legacy as { lastAreaMoveDay?: number }).lastAreaMoveDay;
  delete (legacy as { financeLog?: unknown }).financeLog;

  const envelope = {
    version: 10,
    savedAt: new Date().toISOString(),
    state: legacy,
  };

  const migrated = migrateGameState(envelope);
  assert(migrated != null, 'v10 save migrates');
  assert(Array.isArray(migrated!.financeLog), 'financeLog initialized');
  assert(migrated!.financeLog!.length === 0, 'financeLog empty default');
  assert(migrated!.areaMovesToday === 0, 'areaMovesToday default');
  assert(migrated!.lastAreaMoveDay === migrated!.player.day, 'lastAreaMoveDay default');
}

function testSaveRoundtripPreservesFinanceFields(): void {
  let state = baseState({
    areaMovesToday: 2,
    lastAreaMoveDay: 7,
    financeLog: [
      {
        id: 'fin_test_1',
        day: 7,
        kind: 'debt_payment' as FinanceLogKind,
        amount: 500,
        message: 'Paid $500 toward debt.',
      },
    ],
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      day: 7,
    }),
  });

  const envelope = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: normalizeGameState(state),
  };

  const loaded = migrateGameState(JSON.parse(JSON.stringify(envelope)));
  assert(loaded != null, 'save roundtrip loads');
  assert(loaded!.areaMovesToday === 2, 'areaMovesToday preserved');
  assert(loaded!.lastAreaMoveDay === 7, 'lastAreaMoveDay preserved');
  assert(loaded!.financeLog!.length === 1, 'financeLog preserved');
  assert(loaded!.financeLog![0].amount === 500, 'finance log entry preserved');
}

function testNavigationTypes(): void {
  const routes: (keyof RootStackParamList)[] = ['Finance', 'Game', 'Progress', 'Travel'];
  assert(routes.includes('Finance'), 'Finance route in RootStackParamList');
}

export function runFinanceSmokeTests(): void {
  testNavigationTypes();
  testFinanceLogOrderAndCap();
  testDebtPaymentPresetsAndBounds();
  testCleanBeforeDirty();
  testMissionProgressOnDebtPayment();
  testBorrowing();
  testStayHereAdvancesOneDayWithEffects();
  testStayHereLaundersDirtyCash();
  testAreaMovesTimeRules();
  testCityTravelAdvancesOneDay();
  testSaveMigrationV11();
  testSaveRoundtripPreservesFinanceFields();
  console.log('financeSmokeTest: all checks passed');
}

runFinanceSmokeTests();
