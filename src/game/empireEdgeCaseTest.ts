/**
 * Deterministic edge-case tests for Empire systems (raids, betrayal, payroll credits, routes).
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/empireEdgeCaseTest.ts
 */

declare const process: { cwd(): string };
declare function require(module: 'fs'): {
  readFileSync: (path: string, encoding: string) => string;
};
declare function require(module: 'path'): {
  join: (...parts: string[]) => string;
};

import { GameState } from '../types/game';
import { HiredCrewMember } from '../types/crew';
import { MAX_EMPIRE_EVENTS } from '../types/empire';
import { createDefaultPlayerProfile } from '../types/playerProfile';
import { PRODUCT_MAP } from '../data/products';
import { createInitialGameState } from './engine';
import { normalizeGameState } from './stateUtils';
import { normalizeMoneyFields } from './money';
import { tickCrewPayroll, tickCrewEmpire } from './crewSystem';
import { assignCrewMember, tickCrewManagement } from './crewManagementSystem';
import { tickBusinessesOnDayAdvance } from './businessSystem';
import { rollBusinessDailyEvents } from './businessManagementSystem';
import { rollPropertyDailyEvents } from './propertyManagementSystem';
import {
  appendEmpireEvent,
  createDefaultHiredCrewFields,
  createDefaultOwnedBusinessFields,
  createDefaultOwnedSafehouseFields,
} from './empireDefaults';
import { getStoreInventory, withStoreInventory } from './storeInventory';
import { grantProductCredits } from './consumableCredits';
import { useCrewLoyaltyCredit } from './consumableUseSystem';

const HARLEM = { currentCityId: 'new_york' as const, currentAreaId: 'new_york_harlem' as const };
const BIZ_ID = 'biz_ny_harlem_pawn';
const PROP_ID = 'sh_ny_harlem_motel';
const ROOT = process.cwd();

function readProjectFile(rel: string): string {
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertNonNegativeCashDebt(state: GameState, label: string): void {
  assert(state.player.cash >= 0, `${label}: cash negative (${state.player.cash})`);
  assert(state.player.debt >= 0, `${label}: debt negative (${state.player.debt})`);
}

function assertInRange(value: number, min: number, max: number, label: string): void {
  assert(value >= min && value <= max, `${label}: ${value} not in ${min}–${max}`);
}

/** Returns values sequentially; holds on last value when exhausted. */
function mockRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i] ?? values[values.length - 1] ?? 0.99;
    i += 1;
    return v;
  };
}

function withMockedRandom<T>(values: number[], fn: () => T): T {
  const original = Math.random;
  const iter = mockRandom(values);
  Math.random = iter;
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function harlemState(overrides: Partial<GameState> = {}): GameState {
  let state = normalizeGameState(createInitialGameState());
  return {
    ...state,
    ...overrides,
    player: normalizeMoneyFields({
      ...state.player,
      day: 5,
      cash: 10_000,
      cleanCash: 10_000,
      dirtyCash: 0,
      heat: 50,
      ...HARLEM,
      ...(overrides.player ?? {}),
    }),
  };
}

function makeCrew(
  id: string,
  role: HiredCrewMember['role'],
  overrides: Partial<HiredCrewMember> = {}
): HiredCrewMember {
  return createDefaultHiredCrewFields({
    id,
    templateId: `tpl_${id}`,
    name: `Test ${role}`,
    role,
    cityId: 'new_york',
    areaId: 'new_york_harlem',
    skill: 55,
    loyalty: overrides.loyalty ?? 60,
    salaryPerDay: 80,
    hireCost: 500,
    bonuses: {},
    riskTraits: [],
    status: 'hired',
    daysUnpaid: 0,
    hiredDay: 5,
    ...overrides,
  });
}

function testBusinessRaidRoll(): void {
  const before = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      heat: 90,
      cash: 500,
      cleanCash: 200,
      dirtyCash: 300,
      day: 8,
      ...HARLEM,
    }),
    ownedBusinesses: [createDefaultOwnedBusinessFields(BIZ_ID, 3)],
    activeWorldEvents: [],
  });

  const conditionBefore = before.ownedBusinesses![0].condition;
  const cashBefore = before.player.cash;

  // rollBusinessRaids (3 rolls) + rollBusinessDailyEvents skip (0.99)
  const after = withMockedRandom([0.1, 0, 0, 0.5, 0.99], () =>
    tickBusinessesOnDayAdvance(before, mockRandom([0.1, 0, 0, 0.5, 0.99]))
  );

  assert((after.businessRaids ?? []).length > 0, 'business raid recorded');
  const biz = after.ownedBusinesses!.find((b) => b.businessId === BIZ_ID)!;
  assert(biz.condition < conditionBefore, 'raid reduces condition');
  assert(after.player.cash <= cashBefore, 'raid does not increase cash');
  assertNonNegativeCashDebt(after, 'business raid');
}

function testBusinessRaidDamageBounds(): void {
  const state = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      heat: 90,
      day: 8,
      ...HARLEM,
    }),
    ownedBusinesses: [createDefaultOwnedBusinessFields(BIZ_ID, 3)],
  });

  const afterLow = tickBusinessesOnDayAdvance(
    state,
    mockRandom([0.1, 0, 0, 0.99])
  );
  const damageLow = 100 - afterLow.ownedBusinesses![0].condition;
  assert(damageLow === 15, 'low damage roll yields 15');

  const afterHigh = tickBusinessesOnDayAdvance(
    state,
    mockRandom([0.1, 0, 0.6, 0.99])
  );
  const damageHigh = 100 - afterHigh.ownedBusinesses![0].condition;
  assert(damageHigh === 25, 'high damage roll yields 25');
  assertInRange(afterHigh.ownedBusinesses![0].condition, 0, 100, 'post-raid condition');
}

function testDirtyCashSeizureNonNegative(): void {
  const state = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 150,
      cleanCash: 0,
      dirtyCash: 150,
      day: 6,
      ...HARLEM,
    }),
    ownedBusinesses: [createDefaultOwnedBusinessFields(BIZ_ID, 2)],
  });

  // rollBusinessDailyEvents police audit: roll 0.01 < 0.04
  const after = withMockedRandom([0.01], () =>
    rollBusinessDailyEvents(state, mockRandom([0.01]))
  );

  assert(after.player.cash >= 0, 'audit seizure cannot make cash negative');
  assert((after.player.dirtyCash ?? 0) >= 0, 'dirty cash non-negative after audit');
  assertNonNegativeCashDebt(after, 'dirty seizure');
}

function testPropertyRobberyRoll(): void {
  const record = createDefaultOwnedSafehouseFields(PROP_ID, 2);
  const state = harlemState({
    ownedSafehouses: [
      {
        ...record,
        condition: 80,
        upgradeLevels: {
          locks: 0,
          hiddenCompartments: 1,
          storageExpansion: 0,
          escapeRoute: 1,
          safeRoom: 0,
          surveillance: 0,
          cleanerCrew: 0,
        },
      },
    ],
  });

  // secrecyLevel >= 2 skips neighbor branch; roll 0.02 triggers break-in
  const after = withMockedRandom([0.02], () =>
    rollPropertyDailyEvents(state, mockRandom([0.02]))
  );
  const prop = after.ownedSafehouses!.find((p) => p.safehouseId === PROP_ID)!;
  assert(prop.condition < 80, 'robbery attempt reduces condition');
  assertInRange(prop.condition, 20, 100, 'property condition floor after break-in');
  assert(
    (prop.recentEvents ?? []).some((e) => e.message.includes('Break-in')),
    'robbery writes recentEvents'
  );
}

function testPropertyGuardPreventsLoss(): void {
  const enforcer = makeCrew('guard_1', 'enforcer', { loyalty: 80, skill: 65 });
  let state = harlemState({
    ownedSafehouses: [
      {
        ...createDefaultOwnedSafehouseFields(PROP_ID, 2),
        condition: 85,
        assignedGuardCrewId: enforcer.id,
        upgradeLevels: {
          locks: 2,
          hiddenCompartments: 1,
          storageExpansion: 0,
          escapeRoute: 1,
          safeRoom: 0,
          surveillance: 0,
          cleanerCrew: 0,
        },
      },
    ],
    hiredCrew: [enforcer],
  });

  const conditionBefore = state.ownedSafehouses![0].condition;
  // secrecy >= 2 (locks upgrade alone is security not secrecy); roll 0.06 skips neighbor + break-in
  state = rollPropertyDailyEvents(state, mockRandom([0.06]));
  const prop = state.ownedSafehouses!.find((p) => p.safehouseId === PROP_ID)!;
  assert(prop.condition === conditionBefore, 'guard prevent path does not reduce condition');
  assert(
    (prop.recentEvents ?? []).some((e) => e.message.includes('prevented')),
    'guard prevention logged'
  );
}

function testCrewBetrayalTheftRoll(): void {
  const member = makeCrew('betrayer', 'runner', {
    loyalty: 30,
    daysUnpaid: 1,
    salaryPerDay: 200,
  });

  const state = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 100,
      cleanCash: 100,
      dirtyCash: 0,
      day: 7,
      ...HARLEM,
    }),
    hiredCrew: [member],
  });

  const after = withMockedRandom([0.1], () => tickCrewPayroll(state));
  const updated = after.hiredCrew!.find((c) => c.id === member.id)!;
  assert(updated.status === 'betrayed', 'unpaid low-loyalty crew can betray');
  assert(after.player.cash >= 0, 'betrayal theft cannot make cash negative');
}

function testCrewArrestPath(): void {
  const member = makeCrew('arrested', 'runner', {
    loyalty: 50,
    daysUnpaid: 2,
    salaryPerDay: 500,
  });

  const state = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 0,
      cleanCash: 0,
      dirtyCash: 0,
      day: 9,
      ...HARLEM,
    }),
    hiredCrew: [member],
  });

  const after = withMockedRandom([0.1], () => tickCrewPayroll(state));
  const updated = after.hiredCrew!.find((c) => c.id === member.id)!;
  assert(updated.status === 'arrested', 'long unpaid crew can be arrested');
  assert(updated.daysUnpaid >= 3, 'days unpaid incremented toward arrest');
}

function testLowLoyaltyHighStressQuit(): void {
  const member = {
    ...makeCrew('quitter', 'runner', { loyalty: 30 }),
    stress: 90,
    morale: 25,
    daysUnpaid: 0,
  };

  const state = harlemState({ hiredCrew: [member] });
  const after = tickCrewManagement(state, mockRandom([0.01]));
  const updated = after.hiredCrew!.find((c) => c.id === member.id)!;
  assert(updated.status === 'betrayed', 'high stress + low loyalty can quit/walk out');
  assert(
    (updated.recentEvents ?? []).some((e) => e.message.includes('stress')),
    'quit writes recentEvents'
  );
}

function testHighLoyaltyBonus(): void {
  const member = {
    ...makeCrew('loyal', 'dealer', { loyalty: 85 }),
    morale: 80,
    stress: 10,
    daysUnpaid: 0,
  };

  const state = harlemState({ hiredCrew: [member] });
  const after = tickCrewManagement(state, mockRandom([0.01]));
  const updated = after.hiredCrew!.find((c) => c.id === member.id)!;
  assert(updated.loyalty >= 85, 'high loyalty crew can earn loyalty bonus');
  assert(
    (updated.recentEvents ?? []).some((e) => e.message.includes('extra mile')),
    'loyalty bonus writes recentEvents'
  );
}

function testAssignmentWritesRecentEvents(): void {
  const member = makeCrew('assignee', 'runner');
  let state = harlemState({ hiredCrew: [member] });
  state = assignCrewMember(state, member.id, 'gather_intel');
  const updated = state.hiredCrew!.find((c) => c.id === member.id)!;
  assert(updated.currentAssignment === 'gather_intel', 'assignment set');
  assert((updated.recentEvents ?? []).length > 0, 'assignment appends recentEvents');
}

function testEventTimelineCap(): void {
  let events = appendEmpireEvent(undefined, 1, 'event a');
  for (let i = 0; i < 20; i++) {
    events = appendEmpireEvent(events, i + 2, `event ${i}`);
  }
  assert(events.length === MAX_EMPIRE_EVENTS, `events capped at ${MAX_EMPIRE_EVENTS}`);
}

function testStoreCreditPayrollIsolated(): void {
  const member = makeCrew('paid_crew', 'runner', { salaryPerDay: 120 });
  const payroll = 120;

  let state = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 0,
      cleanCash: 0,
      dirtyCash: 0,
      day: 10,
      ...HARLEM,
    }),
    hiredCrew: [member],
  });

  state = withStoreInventory(state, {
    ...getStoreInventory(state),
    payrollCredits: 1,
  });

  const creditsBefore = getStoreInventory(state).payrollCredits;
  assert(creditsBefore === 1, 'payroll credit banked before tick');

  state = tickCrewEmpire(state);

  assert(getStoreInventory(state).payrollCredits === 0, 'payroll credit consumed on day tick');
  assert(state.player.cash === 0, 'store credit payroll does not drain cash');
  const updated = state.hiredCrew!.find((c) => c.id === member.id)!;
  assert(updated.daysUnpaid === 0, 'crew treated as paid when credit used');
  assert(
    (state.financeLog ?? []).some(
      (e) => e.kind === 'store_effect' && e.message.includes('store credit')
    ),
    'finance log records store credit payroll'
  );
  assertNonNegativeCashDebt(state, 'store credit payroll');

  // Consumable grants payrollDays into bank — credit not consumed until day tick
  let profile = createDefaultPlayerProfile();
  profile = grantProductCredits(profile, 'crew_loyalty_medium');
  let withCrew = harlemState({ hiredCrew: [member] });
  const cashBeforeUse = withCrew.player.cash;
  const useResult = useCrewLoyaltyCredit(profile, withCrew, 'medium');
  assert(useResult.ok, 'crew loyalty medium consumable applies with hired crew');
  assert(
    getStoreInventory(useResult.state).payrollCredits === 1,
    'consumable grants 1 payroll credit (payrollDays: 1)'
  );
  assert(useResult.state.player.cash === cashBeforeUse, 'consumable use does not pay payroll immediately');
  assert(
    useResult.profile.consumables.crewLoyaltyCreditsMedium === 0,
    'profile credit consumed on use'
  );
  assert(
    PRODUCT_MAP.crew_loyalty_medium.effects.payrollDays === 1,
    'crew_loyalty_medium product defines payrollDays'
  );
}

function testEmpireRouteStaticValidation(): void {
  const appSrc = readProjectFile('App.tsx');
  assert(appSrc.includes('name="CrewDetail"'), 'App registers CrewDetail');
  assert(appSrc.includes('name="BusinessDetail"'), 'App registers BusinessDetail');
  assert(appSrc.includes('name="PropertyDetail"'), 'App registers PropertyDetail');

  const crewScreen = readProjectFile('src/screens/CrewScreen.tsx');
  assert(
    crewScreen.includes("navigate('CrewDetail', { crewId:"),
    'CrewScreen navigates with crewId'
  );

  const bizScreen = readProjectFile('src/screens/BusinessesScreen.tsx');
  assert(
    bizScreen.includes("navigate('BusinessDetail', { businessId:"),
    'BusinessesScreen navigates with businessId'
  );

  const propScreen = readProjectFile('src/screens/SafehousesScreen.tsx');
  assert(
    propScreen.includes("navigate('PropertyDetail', { safehouseId:"),
    'SafehousesScreen navigates with safehouseId'
  );

  const crewDetail = readProjectFile('src/screens/CrewDetailScreen.tsx');
  const bizDetail = readProjectFile('src/screens/BusinessDetailScreen.tsx');
  const propDetail = readProjectFile('src/screens/PropertyDetailScreen.tsx');

  assert(crewDetail.includes('Crew member not found'), 'CrewDetail safe empty state');
  assert(bizDetail.includes('Business not found'), 'BusinessDetail safe empty state');
  assert(propDetail.includes('Property not found'), 'PropertyDetail safe empty state');

  const gameTypes = readProjectFile('src/types/game.ts');
  assert(gameTypes.includes('CrewDetail: { crewId: string }'), 'CrewDetail route typed');
  assert(gameTypes.includes('BusinessDetail: { businessId: string }'), 'BusinessDetail route typed');
  assert(gameTypes.includes('PropertyDetail: { safehouseId: string }'), 'PropertyDetail route typed');
}

export function runEmpireEdgeCaseTests(): void {
  testBusinessRaidRoll();
  testBusinessRaidDamageBounds();
  testDirtyCashSeizureNonNegative();
  testPropertyRobberyRoll();
  testPropertyGuardPreventsLoss();
  testCrewBetrayalTheftRoll();
  testCrewArrestPath();
  testLowLoyaltyHighStressQuit();
  testHighLoyaltyBonus();
  testAssignmentWritesRecentEvents();
  testEventTimelineCap();
  testStoreCreditPayrollIsolated();
  testEmpireRouteStaticValidation();
  console.log('empireEdgeCaseTest: all checks passed');
}

runEmpireEdgeCaseTests();
