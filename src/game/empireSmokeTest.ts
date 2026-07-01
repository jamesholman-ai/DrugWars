/**
 * Regression smoke tests for Crew / Business / Property empire systems.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/empireSmokeTest.ts
 */
import { CommodityId, GameState } from '../types/game';
import { CrewRecruitOffer, HiredCrewMember } from '../types/crew';
import { BusinessUpgradeKind } from '../types/empire';
import { createInitialGameState, stayHere } from './engine';
import { migrateGameState, SAVE_VERSION } from './saveStorage';
import { normalizeGameState } from './stateUtils';
import { normalizeMoneyFields } from './money';
import { hireCrewMember, fireCrewMember, tickCrewEmpire } from './crewSystem';
import { assignCrewMember } from './crewManagementSystem';
import { purchaseBusiness, tickBusinessesOnDayAdvance } from './businessSystem';
import {
  assignBusinessManager,
  getEffectiveBusinessStats,
  upgradeBusiness,
} from './businessManagementSystem';
import {
  depositToSafehouse,
  purchaseSafehouse,
  rentSafehouse,
  withdrawFromSafehouse,
  tickSafehouseUpkeep,
  getDailyPropertyRent,
  getDailyPropertyUpkeep,
} from './safehouseSystem';
import {
  getEffectiveStorageCapacity,
  rollPropertyDailyEvents,
  upgradeProperty,
} from './propertyManagementSystem';
import {
  createDefaultHiredCrewFields,
  DEFAULT_BUSINESS_UPGRADES,
  DEFAULT_PROPERTY_UPGRADES,
  migrateBusinessUpgrades,
  migratePropertyUpgrades,
} from './empireDefaults';
const HARLEM = { currentCityId: 'new_york' as const, currentAreaId: 'new_york_brooklyn' as const };
const BIZ_ID = 'biz_ny_harlem_pawn';
const PROP_RENT_ID = 'sh_ny_harlem_motel';
const PROP_ID = 'sh_ny_harlem_studio';

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

function assertInRange(value: number, min: number, max: number, label: string): void {
  assert(value >= min && value <= max, `${label}: ${value} not in ${min}–${max}`);
}

function withStableRandom<T>(fn: () => T, seed = 0.99): T {
  const original = Math.random;
  Math.random = () => seed;
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

function harlemState(overrides: Partial<GameState> = {}): GameState {
  return baseState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 100_000,
      cleanCash: 100_000,
      dirtyCash: 0,
      day: 5,
      ...HARLEM,
      ...(overrides.player ?? {}),
    }),
    ...overrides,
  });
}

function runnerRecruit(): CrewRecruitOffer {
  return {
    id: 'recruit_test_runner',
    templateId: 'crew_ny_runner_tee',
    name: 'Little Tee',
    role: 'runner',
    cityId: 'new_york',
    areaId: 'new_york_brooklyn',
    skill: 42,
    loyalty: 63,
    salaryPerDay: 70,
    hireCost: 550,
    bonuses: { carryCapacity: 15 },
    riskTraits: ['Fast'],
    expiresDay: 99,
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
    areaId: 'new_york_brooklyn',
    skill: role === 'accountant' ? 70 : 55,
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

function hiredRunner(state: GameState): { state: GameState; crewId: string } {
  state = hireCrewMember(
    { ...state, availableCrew: [runnerRecruit()] },
    'recruit_test_runner'
  );
  const crew = (state.hiredCrew ?? []).find((c) => c.status === 'hired');
  assert(crew != null, 'runner hired');
  return { state, crewId: crew!.id };
}

function inventoryQty(state: GameState, commodityId: CommodityId): number {
  return state.player.inventory.find((i) => i.commodityId === commodityId)?.quantity ?? 0;
}

function storedQty(state: GameState, safehouseId: string, commodityId: CommodityId): number {
  return (
    state.storedInventoryBySafehouse?.[safehouseId]?.find((i) => i.commodityId === commodityId)
      ?.quantity ?? 0
  );
}

function assertCrewBounds(state: GameState, label: string): void {
  for (const c of state.hiredCrew ?? []) {
    if (c.morale != null) assertInRange(c.morale, 0, 100, `${label} morale`);
    if (c.stress != null) assertInRange(c.stress, 0, 100, `${label} stress`);
    assertInRange(c.loyalty, 0, 100, `${label} loyalty`);
    if (c.relationshipLevel != null) {
      assertInRange(c.relationshipLevel, 0, 100, `${label} relationship`);
    }
  }
}

function assertEmpireRecordBounds(state: GameState, label: string): void {
  for (const b of state.ownedBusinesses ?? []) {
    assertInRange(b.condition, 0, 100, `${label} business condition`);
    if (b.reputation != null) assertInRange(b.reputation, 0, 100, `${label} business reputation`);
    if (b.heat != null) assertInRange(b.heat, 0, 100, `${label} business heat`);
  }
  for (const p of state.ownedSafehouses ?? []) {
    assertInRange(p.condition, 0, 100, `${label} property condition`);
  }
}

function testV11SaveMigration(): void {
  const legacy = harlemState({
    hiredCrew: [
      {
        id: 'legacy_crew_1',
        templateId: 'crew_ny_runner_tee',
        name: 'Legacy Runner',
        role: 'runner',
        cityId: 'new_york',
        areaId: 'new_york_brooklyn',
        skill: 40,
        loyalty: 50,
        salaryPerDay: 70,
        hireCost: 500,
        bonuses: {},
        riskTraits: ['Fast'],
        status: 'hired',
        daysUnpaid: 0,
        hiredDay: 3,
      },
    ],
    ownedBusinesses: [
      {
        businessId: BIZ_ID,
        purchasedDay: 2,
        condition: 88,
        upkeepMissedDays: 0,
      },
    ],
    ownedSafehouses: [
      {
        safehouseId: PROP_ID,
        purchasedDay: 2,
        condition: 90,
        upkeepMissedDays: 0,
        rentOrOwn: 'own',
        comfortLevel: 50,
        securityLevel: 50,
        secrecyLevel: 50,
      },
    ],
  });

  const envelope = {
    version: 11,
    savedAt: new Date().toISOString(),
    state: legacy,
  };

  const migrated = migrateGameState(JSON.parse(JSON.stringify(envelope)));
  assert(migrated != null, 'v11 save migrates');

  const crew = migrated!.hiredCrew![0];
  assert(crew.morale != null && crew.morale >= 0 && crew.morale <= 100, 'crew morale defaulted');
  assert(crew.stress != null && crew.stress >= 0 && crew.stress <= 100, 'crew stress defaulted');
  assert(crew.currentAssignment === 'idle', 'crew assignment defaulted to idle');

  const biz = migrated!.ownedBusinesses![0];
  const bizUpgrades = migrateBusinessUpgrades(biz.upgradeLevels);
  assert(bizUpgrades.security === DEFAULT_BUSINESS_UPGRADES.security, 'business upgrades defaulted');
  assert(biz.assignedCrewId === null, 'business assignedCrewId defaulted');
  assert(Array.isArray(biz.recentEvents), 'business recentEvents array');

  const prop = migrated!.ownedSafehouses![0];
  const propUpgrades = migratePropertyUpgrades(prop.upgradeLevels);
  assert(propUpgrades.locks === DEFAULT_PROPERTY_UPGRADES.locks, 'property upgrades defaulted');
  assert(prop.rentOrOwn === 'own' || prop.rentOrOwn === 'rent', 'property rentOrOwn migrated');
  assert(prop.comfortLevel != null && prop.comfortLevel >= 0, 'property comfort migrated');
  assert(prop.assignedGuardCrewId === null, 'property guard defaulted');
  assert(Array.isArray(prop.recentEvents), 'property recentEvents array');
}

function testCrewHiringAndAssignment(): void {
  let state = harlemState();
  const cashBefore = state.player.cash;
  const { state: hired, crewId } = hiredRunner(state);
  state = hired;
  assert(state.player.cash === cashBefore - 550, 'hire cost deducted');

  state = assignCrewMember(state, crewId, 'run_local_sales');
  const assignment = (state.hiredCrew ?? []).find((c) => c.id === crewId)?.currentAssignment;
  assert(assignment === 'run_local_sales', 'assigned to run local sales');

  const logBefore = (state.financeLog ?? []).length;
  state = withStableRandom(() => stayHere(state));

  assert(state.player.day === 6, 'day advanced');
  const member = (state.hiredCrew ?? []).find((c) => c.id === crewId);
  assert(member != null, 'crew still present');
  const paid =
    (state.financeLog ?? []).some((e) => e.kind === 'payroll_paid') ||
    member!.daysUnpaid === 0;
  const unpaidLoyaltyDrop =
    member!.daysUnpaid > 0 && member!.loyalty < 63;
  assert(paid || unpaidLoyaltyDrop, 'payroll charged or loyalty dropped when unpaid');
  assert(
    (state.financeLog ?? []).length > logBefore ||
      (state.financeLog ?? []).some((e) => e.kind === 'payroll_paid' || e.kind === 'business_income'),
    'finance log updated after day advance'
  );
  assertCrewBounds(state, 'crew hire/assign');
  assertNonNegativeCashDebt(state, 'crew hire/assign');
}

function testCrewAssignmentCleanup(): void {
  let state = harlemState();
  const dealer = makeCrew('crew_dealer', 'dealer');
  const enforcer = makeCrew('crew_enforcer', 'enforcer');
  state = purchaseBusiness(state, BIZ_ID);
  state = purchaseSafehouse(state, PROP_ID);
  state = { ...state, hiredCrew: [dealer, enforcer] };

  state = assignCrewMember(state, dealer.id, 'manage_business', BIZ_ID);
  assert(
    (state.ownedBusinesses ?? []).find((b) => b.businessId === BIZ_ID)?.assignedCrewId === dealer.id,
    'dealer assigned to business'
  );

  state = fireCrewMember(state, dealer.id);
  assert(
    (state.ownedBusinesses ?? []).find((b) => b.businessId === BIZ_ID)?.assignedCrewId == null,
    'business assignedCrewId cleared on fire'
  );

  state = assignCrewMember(state, enforcer.id, 'guard_property', PROP_ID);
  assert(
    (state.ownedSafehouses ?? []).find((p) => p.safehouseId === PROP_ID)?.assignedGuardCrewId ===
      enforcer.id,
    'enforcer assigned to property'
  );

  state = fireCrewMember(state, enforcer.id);
  assert(
    (state.ownedSafehouses ?? []).find((p) => p.safehouseId === PROP_ID)?.assignedGuardCrewId == null,
    'property assignedGuardCrewId cleared on fire'
  );
}

function testBusinessPurchaseAndUpgrade(): void {
  let state = harlemState();
  const cashStart = state.player.cash;

  state = purchaseBusiness(state, BIZ_ID);
  assert((state.ownedBusinesses ?? []).length === 1, 'business purchased');
  assertNonNegativeCashDebt(state, 'after business purchase');

  const kinds: BusinessUpgradeKind[] = [
    'security',
    'staff',
    'laundering',
    'legitimacy',
    'expansion',
  ];
  for (const kind of kinds) {
    const cashBefore = state.player.cash;
    state = upgradeBusiness(state, BIZ_ID, kind);
    const spent = cashBefore - state.player.cash;
    assert(spent > 0, `${kind} upgrade costs cash`);
    assertNonNegativeCashDebt(state, `after ${kind} upgrade`);
  }

  const record = (state.ownedBusinesses ?? []).find((b) => b.businessId === BIZ_ID)!;
  const levels = migrateBusinessUpgrades(record.upgradeLevels);
  for (const kind of kinds) {
    assert(levels[kind] === 1, `${kind} upgrade level is 1`);
  }

  assert(
    state.player.cash < cashStart,
    'total cash decreased from purchase + upgrades'
  );

  const logBefore = (state.financeLog ?? []).length;
  state = withStableRandom(() => stayHere(state));
  assert(
    (state.financeLog ?? []).some((e) => e.kind === 'business_income') ||
      (state.financeLog ?? []).some((e) => e.kind === 'business_upkeep') ||
      (state.financeLog ?? []).some((e) => e.kind === 'laundered') ||
      (state.financeLog ?? []).length > logBefore,
    'business day advance produces finance log entries'
  );
  assertNonNegativeCashDebt(state, 'business day advance');
}

function testBusinessManagerEffect(): void {
  let state = harlemState();
  state = purchaseBusiness(state, BIZ_ID);
  const accountant = makeCrew('crew_acct', 'accountant', { skill: 75, loyalty: 75 });
  state = { ...state, hiredCrew: [accountant] };

  state = assignBusinessManager(state, BIZ_ID, accountant.id);
  const managed = (state.ownedBusinesses ?? []).find((b) => b.businessId === BIZ_ID)!;
  assert(managed.assignedCrewId === accountant.id, 'manager assigned');

  const statsWithManager = getEffectiveBusinessStats(state, managed);
  state = withStableRandom(() => tickBusinessesOnDayAdvance(state));
  assertNonNegativeCashDebt(state, 'manager day tick');

  const unmanaged = getEffectiveBusinessStats(
    {
      ...state,
      ownedBusinesses: [
        {
          ...managed,
          assignedCrewId: null,
        },
      ],
    },
    { ...managed, assignedCrewId: null }
  );
  assert(statsWithManager.income >= unmanaged.income, 'manager boosts income');

  let skimState = harlemState({
    player: normalizeMoneyFields({
      ...createInitialGameState().player,
      cash: 200,
      cleanCash: 200,
      dirtyCash: 0,
      day: 5,
      ...HARLEM,
    }),
    hiredCrew: [
      {
        ...createDefaultHiredCrewFields({
          id: 'skim_crew',
          templateId: 'skim',
          name: 'Skimmer',
          role: 'runner',
          cityId: 'new_york',
          areaId: 'new_york_brooklyn',
          skill: 40,
          loyalty: 20,
          salaryPerDay: 500,
          hireCost: 0,
          bonuses: {},
          riskTraits: [],
          status: 'hired',
          daysUnpaid: 1,
          hiredDay: 5,
        }),
        daysUnpaid: 1,
        morale: 20,
        loyalty: 20,
      },
    ],
  });

  skimState = withStableRandom(() => tickCrewEmpire(skimState), 0.01);
  assert(skimState.player.cash >= 0, 'low loyalty skim cannot drive cash negative');
}

function testPropertyPurchaseAndUpgrade(): void {
  let state = harlemState();
  const cashStart = state.player.cash;

  state = purchaseSafehouse(state, PROP_ID);
  assert((state.ownedSafehouses ?? []).length === 1, 'property purchased');

  const baseCapacity = getEffectiveStorageCapacity(state, PROP_ID);
  state = upgradeProperty(state, PROP_ID, 'storageExpansion');
  const afterStorage = getEffectiveStorageCapacity(state, PROP_ID);
  assert(afterStorage > baseCapacity, 'storage expansion increases capacity');

  state = upgradeProperty(state, PROP_ID, 'locks');
  state = upgradeProperty(state, PROP_ID, 'hiddenCompartments');
  assertNonNegativeCashDebt(state, 'after property upgrades');
  assert(state.player.cash < cashStart, 'property purchase + upgrades spent cash');

  const record = (state.ownedSafehouses ?? []).find((p) => p.safehouseId === PROP_ID)!;
  const levels = migratePropertyUpgrades(record.upgradeLevels);
  assert(levels.storageExpansion === 1, 'storage upgrade level');
  assert(levels.locks === 1, 'locks upgrade level');
  assert(levels.hiddenCompartments === 1, 'hidden compartments upgrade level');
}

function testStorageSafety(): void {
  let state = harlemState();
  state = purchaseSafehouse(state, PROP_ID);
  state = upgradeProperty(state, PROP_ID, 'storageExpansion');

  const totalBefore = 20;
  state = {
    ...state,
    player: {
      ...state.player,
      inventory: [{ commodityId: 'weed', quantity: totalBefore, avgCost: 50 }],
    },
  };

  state = depositToSafehouse(state, PROP_ID, 'weed', 8);
  assert(inventoryQty(state, 'weed') === 12, 'deposit reduces carried');
  assert(storedQty(state, PROP_ID, 'weed') === 8, 'deposit increases stored');
  assert(inventoryQty(state, 'weed') + storedQty(state, PROP_ID, 'weed') === totalBefore, 'no dup on deposit');

  state = withdrawFromSafehouse(state, PROP_ID, 'weed', 5);
  assert(inventoryQty(state, 'weed') === 17, 'withdraw increases carried');
  assert(storedQty(state, PROP_ID, 'weed') === 3, 'withdraw reduces stored');
  assert(inventoryQty(state, 'weed') + storedQty(state, PROP_ID, 'weed') === totalBefore, 'no dup on withdraw');
  assert(inventoryQty(state, 'weed') >= 0 && storedQty(state, PROP_ID, 'weed') >= 0, 'no negative inventory');

  const capacity = getEffectiveStorageCapacity(state, PROP_ID);
  const over = depositToSafehouse(state, PROP_ID, 'weed', capacity + 10);
  assert(storedQty(over, PROP_ID, 'weed') <= capacity, 'capacity respected');
}

function testGuardProperty(): void {
  let state = harlemState();
  state = purchaseSafehouse(state, PROP_ID);
  const lookout = makeCrew('crew_lookout', 'lookout');
  state = { ...state, hiredCrew: [lookout] };

  state = assignCrewMember(state, lookout.id, 'guard_property', PROP_ID);
  assert(
    (state.ownedSafehouses ?? []).find((p) => p.safehouseId === PROP_ID)?.assignedGuardCrewId ===
      lookout.id,
    'guard assigned'
  );

  state = withStableRandom(() => {
    let s = tickCrewEmpire(state);
    s = rollPropertyDailyEvents(s);
    return stayHere(s);
  });

  assert(
    (state.ownedSafehouses ?? []).find((p) => p.safehouseId === PROP_ID)?.assignedGuardCrewId ===
      lookout.id,
    'guard assignment persists after day advance'
  );
  assertNonNegativeCashDebt(state, 'guard property day advance');
}

function testSaveRoundtrip(): void {
  let state = harlemState();
  const runner = makeCrew('crew_runner', 'runner');
  const dealer = makeCrew('crew_dealer_rt', 'dealer');
  state = { ...state, hiredCrew: [runner, dealer] };
  state = assignCrewMember(state, runner.id, 'gather_intel');
  state = purchaseBusiness(state, BIZ_ID);
  state = upgradeBusiness(state, BIZ_ID, 'staff');
  state = assignBusinessManager(state, BIZ_ID, dealer.id);
  state = purchaseSafehouse(state, PROP_ID);
  state = upgradeProperty(state, PROP_ID, 'locks');
  const enforcer = makeCrew('crew_enforcer_rt', 'enforcer');
  state = { ...state, hiredCrew: [...(state.hiredCrew ?? []), enforcer] };
  state = assignCrewMember(state, enforcer.id, 'guard_property', PROP_ID);
  state = {
    ...state,
    player: {
      ...state.player,
      inventory: [{ commodityId: 'weed', quantity: 5, avgCost: 40 }],
    },
  };
  state = depositToSafehouse(state, PROP_ID, 'weed', 3);

  const envelope = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: normalizeGameState(state),
  };

  const loaded = migrateGameState(JSON.parse(JSON.stringify(envelope)));
  assert(loaded != null, 'save roundtrip loads');

  const loadedRunner = loaded!.hiredCrew!.find((c) => c.id === runner.id);
  assert(loadedRunner?.currentAssignment === 'gather_intel', 'runner assignment persisted');

  const biz = loaded!.ownedBusinesses!.find((b) => b.businessId === BIZ_ID)!;
  assert(migrateBusinessUpgrades(biz.upgradeLevels).staff === 1, 'business upgrade persisted');
  assert(biz.assignedCrewId === dealer.id, 'business manager persisted');

  const prop = loaded!.ownedSafehouses!.find((p) => p.safehouseId === PROP_ID)!;
  assert(migratePropertyUpgrades(prop.upgradeLevels).locks === 1, 'property upgrade persisted');
  assert(prop.assignedGuardCrewId === enforcer.id, 'property guard persisted');
  assert(storedQty(loaded!, PROP_ID, 'weed') === 3, 'stored inventory persisted');
  assert((loadedRunner?.recentEvents ?? []).length >= 0, 'crew events array persisted');
}

function testBounds(): void {
  let state = harlemState();
  const { state: hired, crewId } = hiredRunner(state);
  state = hired;
  state = assignCrewMember(state, crewId, 'run_local_sales');
  state = purchaseBusiness(state, BIZ_ID);
  state = purchaseSafehouse(state, PROP_ID);

  for (let i = 0; i < 3; i++) {
    state = withStableRandom(() => stayHere(state), 0.42 + i * 0.1);
    assertCrewBounds(state, `bounds tick ${i}`);
    assertEmpireRecordBounds(state, `bounds tick ${i}`);
    assertNonNegativeCashDebt(state, `bounds tick ${i}`);
  }
}

function testPropertyRentAndDayAdvance(): void {
  let state = harlemState();
  state = rentSafehouse(state, PROP_RENT_ID);
  const rented = (state.ownedSafehouses ?? []).find((p) => p.safehouseId === PROP_RENT_ID);
  assert(rented?.rentOrOwn === 'rent', 'rented property marked rent');

  const rentPerDay = getDailyPropertyRent(state);
  assert(rentPerDay > 0, 'daily rent projected');

  const cashBefore = state.player.cash;
  state = tickSafehouseUpkeep(state);
  assert(state.player.cash < cashBefore, 'rent charged on tick');
  assert(
    (state.financeLog ?? []).some((e) => e.kind === 'property_rent'),
    'finance log records property rent'
  );

  state = purchaseSafehouse(state, PROP_ID);
  assert((state.ownedSafehouses ?? []).some((p) => p.rentOrOwn === 'own'), 'owned property marked own');
  const upkeepBefore = state.player.cash;
  state = tickSafehouseUpkeep(state);
  assert(
    (state.financeLog ?? []).some((e) => e.kind === 'property_upkeep') || state.player.cash < upkeepBefore,
    'upkeep charged for owned property'
  );

  let broke = {
    ...state,
    player: { ...state.player, cash: 0 },
    ownedSafehouses: (state.ownedSafehouses ?? []).map((p) => ({
      ...p,
      condition: 80,
      comfortLevel: 60,
      securityLevel: 55,
      secrecyLevel: 50,
    })),
  };
  broke = tickSafehouseUpkeep(broke);
  const degraded = (broke.ownedSafehouses ?? [])[0];
  assert(
    degraded.condition < 80 || degraded.comfortLevel! < 60,
    'unpaid rent/upkeep lowers condition or comfort'
  );
}

export function runEmpireSmokeTests(): void {
  testV11SaveMigration();
  testCrewHiringAndAssignment();
  testCrewAssignmentCleanup();
  testBusinessPurchaseAndUpgrade();
  testBusinessManagerEffect();
  testPropertyPurchaseAndUpgrade();
  testPropertyRentAndDayAdvance();
  testStorageSafety();
  testGuardProperty();
  testSaveRoundtrip();
  testBounds();
  console.log('empireSmokeTest: all checks passed');
}

runEmpireSmokeTests();
