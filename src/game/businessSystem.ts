import { GameState } from '../types/game';
import {
  BusinessHistoryEntry,
  BusinessRaidRecord,
  DaySummary,
  OwnedBusiness,
} from '../types/businesses';
import { RankId } from '../types/progression';
import { BUSINESSES, BUSINESS_MAP, BUSINESS_REPAIR_COST } from '../data/businesses';
import { RANKS } from '../data/progression';
import { isCityUnlocked } from './progression';
import { withMessage, withMessages } from './messages';
import { applyProgressionAfterAction } from './progression';
import { clamp } from '../utils/random';
import {
  addCleanMoney,
  launderMoney,
  normalizeMoneyFields,
  seizeDirtyMoney,
  spendMoney,
} from './money';
import { trackMissionEvent } from './missionSystem';
import { getDailyPayroll } from './crewBonuses';
import { getDailySafehouseUpkeep } from './safehouseSystem';
import {
  getStoreInventory,
  hasBusinessRaidProtection,
  withStoreInventory,
} from './storeInventory';

const MAX_HISTORY = 25;
const MAX_RAIDS = 10;

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function conditionMult(condition: number): number {
  if (condition <= 0) return 0;
  return clamp(condition / 100, 0.1, 1);
}

export function meetsBusinessUnlock(state: GameState, def: typeof BUSINESSES[0]): boolean {
  if (!isCityUnlocked(state, def.cityId)) return false;
  if (def.requiredRank && rankIndex(state.progression.rankId) < rankIndex(def.requiredRank)) {
    return false;
  }
  if (def.requiredReputation != null && state.player.reputation < def.requiredReputation) {
    return false;
  }
  return true;
}

export function isBusinessOwned(state: GameState, businessId: string): boolean {
  return (state.ownedBusinesses ?? []).some((b) => b.businessId === businessId);
}

export function getBusinessesAtLocation(state: GameState, cityId: string, areaId: string) {
  return BUSINESSES.filter((b) => b.cityId === cityId && b.areaId === areaId);
}

export function getOwnedBusinessRecord(
  state: GameState,
  businessId: string
): OwnedBusiness | undefined {
  return (state.ownedBusinesses ?? []).find((b) => b.businessId === businessId);
}

export function getTotalPassiveIncome(state: GameState): number {
  let total = 0;
  for (const owned of state.ownedBusinesses ?? []) {
    const def = BUSINESS_MAP[owned.businessId];
    if (!def || owned.condition <= 0) continue;
    total += Math.round(def.dailyIncome * conditionMult(owned.condition));
  }
  return total;
}

export function getTotalLaunderingCapacity(state: GameState): number {
  let total = 0;
  for (const owned of state.ownedBusinesses ?? []) {
    const def = BUSINESS_MAP[owned.businessId];
    if (!def || owned.condition <= 0) continue;
    total += Math.round(def.launderingCapacityPerDay * conditionMult(owned.condition));
  }
  return total;
}

export function getTotalBusinessUpkeep(state: GameState): number {
  let total = 0;
  for (const owned of state.ownedBusinesses ?? []) {
    const def = BUSINESS_MAP[owned.businessId];
    if (!def || owned.condition <= 0) continue;
    total += def.upkeepPerDay;
  }
  return total;
}

export function getTotalBusinessHeatReduction(state: GameState): number {
  let total = 0;
  for (const owned of state.ownedBusinesses ?? []) {
    const def = BUSINESS_MAP[owned.businessId];
    if (!def || owned.condition <= 0) continue;
    total += Math.round(def.heatReductionPerDay * conditionMult(owned.condition));
  }
  return total;
}

export function getAverageBusinessRisk(state: GameState): number {
  const owned = state.ownedBusinesses ?? [];
  if (owned.length === 0) return 0;
  let sum = 0;
  let count = 0;
  for (const o of owned) {
    const def = BUSINESS_MAP[o.businessId];
    if (!def) continue;
    sum += def.riskLevel;
    count++;
  }
  return count ? Math.round((sum / count) * 10) / 10 : 0;
}

export function purchaseBusiness(state: GameState, businessId: string): GameState {
  const def = BUSINESS_MAP[businessId];
  if (!def) return withMessage(state, 'Unknown business.');

  if (isBusinessOwned(state, businessId)) {
    return withMessage(state, 'You already own this business.');
  }

  if (!meetsBusinessUnlock(state, def)) {
    return withMessage(state, 'Requirements not met for this business.');
  }

  const { player } = state;
  if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
    return withMessage(state, 'Must be on-site to purchase this business.');
  }

  const afterSpend = spendMoney(player, def.purchaseCost, true);
  if (!afterSpend) {
    return withMessage(
      state,
      `Need $${def.purchaseCost} (clean cash preferred). You have $${player.cash}.`
    );
  }

  const owned: OwnedBusiness = {
    businessId,
    purchasedDay: player.day,
    condition: 100,
    upkeepMissedDays: 0,
  };

  const history: BusinessHistoryEntry[] = [
    ...(state.businessHistory ?? []),
    { businessId, name: def.name, event: 'Purchased', day: player.day },
  ].slice(-MAX_HISTORY);

  return applyProgressionAfterAction(
    trackMissionEvent(
      withMessage(
        {
          ...state,
          player: afterSpend,
          ownedBusinesses: [...(state.ownedBusinesses ?? []), owned],
          businessHistory: history,
        },
        `Acquired ${def.name} for $${def.purchaseCost}. Income $${def.dailyIncome}/day · Launder $${def.launderingCapacityPerDay}/day.`
      ),
      { kind: 'purchase_business' }
    )
  );
}

export function repairBusiness(state: GameState, businessId: string): GameState {
  const owned = getOwnedBusinessRecord(state, businessId);
  const def = BUSINESS_MAP[businessId];
  if (!owned || !def) return withMessage(state, 'Business not found.');

  if (owned.condition >= 100) {
    return withMessage(state, `${def.name} is in good condition.`);
  }

  const afterSpend = spendMoney(state.player, BUSINESS_REPAIR_COST, true);
  if (!afterSpend) {
    return withMessage(state, `Repair costs $${BUSINESS_REPAIR_COST}.`);
  }

  const next = (state.ownedBusinesses ?? []).map((b) =>
    b.businessId === businessId
      ? { ...b, condition: clamp(b.condition + 35, 0, 100), upkeepMissedDays: 0 }
      : b
  );

  return withMessage(
    { ...state, player: afterSpend, ownedBusinesses: next },
    `Repaired ${def.name} (+35 condition).`
  );
}

function rollBusinessRaids(
  state: GameState,
  random: () => number
): { state: GameState; raids: string[]; dirtySeized: number } {
  const owned = state.ownedBusinesses ?? [];
  if (owned.length === 0) return { state, raids: [], dirtySeized: 0 };

  if (hasBusinessRaidProtection(state)) {
    return { state, raids: [], dirtySeized: 0 };
  }

  const heat = state.player.heat;
  const crackdown = state.activeWorldEvents.some((e) => e.type === 'police_crackdown');
  let raidChance = 0;
  if (heat >= 85) raidChance = 0.22;
  else if (heat >= 70) raidChance = 0.12;
  else if (heat >= 55) raidChance = 0.05;
  if (crackdown) raidChance += 0.15;

  if (random() > raidChance) return { state, raids: [], dirtySeized: 0 };

  const target = owned[Math.floor(random() * owned.length)];
  const def = BUSINESS_MAP[target.businessId];
  if (!def) return { state, raids: [], dirtySeized: 0 };

  const damage = random() < 0.5 ? 15 : 25;
  const seized = Math.min(
    state.player.dirtyCash ?? 0,
    Math.round(400 + def.riskLevel * 120 * random())
  );

  let player = seizeDirtyMoney(state.player, seized);
  player = {
    ...player,
    heat: clamp(player.heat + Math.round(def.riskLevel * 1.5), 0, 100),
  };

  const nextOwned = (state.ownedBusinesses ?? []).map((b) =>
    b.businessId === target.businessId
      ? {
          ...b,
          condition: clamp(b.condition - damage, 0, 100),
          upkeepMissedDays: b.upkeepMissedDays + 1,
        }
      : b
  );

  const raid: BusinessRaidRecord = {
    id: `raid_${state.player.day}_${target.businessId}`,
    businessId: target.businessId,
    day: state.player.day,
    description: `${def.name} hit by ${crackdown ? 'crackdown' : 'raid'}`,
    dirtySeized: seized,
    conditionDamage: damage,
  };

  const msg = `${def.name} raided! Condition −${damage}${seized > 0 ? ` · Dirty cash seized $${seized}` : ''}.`;

  return {
    state: {
      ...state,
      player,
      ownedBusinesses: nextOwned,
      businessRaids: [...(state.businessRaids ?? []), raid].slice(-MAX_RAIDS),
      businessHistory: [
        ...(state.businessHistory ?? []),
        { businessId: target.businessId, name: def.name, event: msg, day: state.player.day },
      ].slice(-MAX_HISTORY),
    },
    raids: [msg],
    dirtySeized: seized,
  };
}

export function tickBusinessesOnDayAdvance(
  state: GameState,
  random: () => number = Math.random
): GameState {
  const owned = state.ownedBusinesses ?? [];
  if (owned.length === 0) {
    return { ...state, lastDaySummary: buildPartialSummary(state, {}) };
  }

  let player = normalizeMoneyFields(state.player);
  let storeInv = getStoreInventory(state);
  const upkeepCovered = storeInv.businessUpkeepCredits > 0;
  if (upkeepCovered) {
    storeInv = { ...storeInv, businessUpkeepCredits: storeInv.businessUpkeepCredits - 1 };
  }

  let totalIncome = 0;
  let totalUpkeep = 0;
  let totalLaundered = 0;
  let totalHeatReduced = 0;
  let nextOwned: OwnedBusiness[] = [];
  const logLines: string[] = [];

  for (const record of owned) {
    const def = BUSINESS_MAP[record.businessId];
    if (!def) {
      nextOwned.push(record);
      continue;
    }

    if (record.condition <= 0) {
      nextOwned.push(record);
      continue;
    }

    const mult = conditionMult(record.condition);
    const upkeep = def.upkeepPerDay;
    totalUpkeep += upkeep;

    let condition = record.condition;
    let missed = record.upkeepMissedDays;

    if (upkeepCovered) {
      missed = 0;
      condition = clamp(condition + 1, 0, 100);
    } else if (player.cash >= upkeep) {
      player = spendMoney(player, upkeep, true) ?? player;
      missed = 0;
      condition = clamp(condition + 1, 0, 100);
    } else {
      missed += 1;
      condition = clamp(condition - 10, 0, 100);
      logLines.push(`${def.name}: upkeep unpaid (−10 condition).`);
    }

    const income = Math.round(def.dailyIncome * mult);
    if (income > 0) {
      player = addCleanMoney(player, income);
      totalIncome += income;
    }

    const launderCap = Math.round(def.launderingCapacityPerDay * mult);
    if (launderCap > 0 && (player.dirtyCash ?? 0) > 0) {
      const launderAmt = Math.min(launderCap, player.dirtyCash ?? 0);
      player = launderMoney(player, launderAmt);
      totalLaundered += launderAmt;
    }

    const heatDrop = Math.round(def.heatReductionPerDay * mult);
    if (heatDrop > 0) {
      player = { ...player, heat: clamp(player.heat - heatDrop, 0, 100) };
      totalHeatReduced += heatDrop;
    }

    nextOwned.push({
      ...record,
      condition,
      upkeepMissedDays: missed,
    });
  }

  let updated: GameState = withStoreInventory(
    {
      ...state,
      player,
      ownedBusinesses: nextOwned,
    },
    storeInv
  );

  if (upkeepCovered) {
    logLines.push('Business upkeep covered by store credit.');
  }

  const raidResult = rollBusinessRaids(updated, random);
  updated = raidResult.state;
  logLines.push(...raidResult.raids);

  const summary: DaySummary = {
    day: state.player.day,
    payroll: getDailyPayroll(state),
    safehouseUpkeep: getDailySafehouseUpkeep(state),
    businessIncome: totalIncome,
    businessUpkeep: totalUpkeep,
    laundered: totalLaundered,
    heatReduced: totalHeatReduced,
    raids: raidResult.raids,
  };

  updated = { ...updated, lastDaySummary: summary };

  const summaryLines = [
    totalIncome > 0 ? `Business income +$${totalIncome} (clean).` : null,
    totalUpkeep > 0 ? `Business upkeep −$${totalUpkeep}.` : null,
    totalLaundered > 0 ? `Laundered $${totalLaundered} dirty → clean.` : null,
    totalHeatReduced > 0 ? `Fronts reduced heat −${totalHeatReduced}.` : null,
    ...logLines,
  ].filter((l): l is string => l != null);

  if (summaryLines.length > 0) {
    updated = withMessages(updated, summaryLines);
  }

  return updated;
}

function buildPartialSummary(state: GameState, extra: Partial<DaySummary>): DaySummary {
  return {
    day: state.player.day,
    payroll: getDailyPayroll(state),
    safehouseUpkeep: getDailySafehouseUpkeep(state),
    businessIncome: 0,
    businessUpkeep: 0,
    laundered: 0,
    heatReduced: 0,
    raids: [],
    ...extra,
  };
}

export function createDefaultBusinessState(): {
  ownedBusinesses: OwnedBusiness[];
  businessHistory: BusinessHistoryEntry[];
  businessRaids: BusinessRaidRecord[];
  lastDaySummary: DaySummary | null;
} {
  return {
    ownedBusinesses: [],
    businessHistory: [],
    businessRaids: [],
    lastDaySummary: null,
  };
}

export function migrateOwnedBusinesses(raw: unknown): OwnedBusiness[] {
  if (!Array.isArray(raw)) return [];
  const result: OwnedBusiness[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.businessId === 'string' ? e.businessId : '';
    if (!BUSINESS_MAP[id]) continue;
    result.push({
      businessId: id,
      purchasedDay: typeof e.purchasedDay === 'number' ? e.purchasedDay : 1,
      condition: typeof e.condition === 'number' ? clamp(e.condition, 0, 100) : 100,
      upkeepMissedDays: typeof e.upkeepMissedDays === 'number' ? e.upkeepMissedDays : 0,
    });
  }
  return result;
}

export function migrateBusinessHistory(raw: unknown): BusinessHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e, i) => ({
      businessId: typeof e.businessId === 'string' ? e.businessId : `biz_${i}`,
      name: typeof e.name === 'string' ? e.name : 'Business',
      event: typeof e.event === 'string' ? e.event : '',
      day: typeof e.day === 'number' ? e.day : 1,
    }))
    .slice(-MAX_HISTORY);
}

export function migrateBusinessRaids(raw: unknown): BusinessRaidRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e, i) => ({
      id: typeof e.id === 'string' ? e.id : `raid_${i}`,
      businessId: typeof e.businessId === 'string' ? e.businessId : '',
      day: typeof e.day === 'number' ? e.day : 1,
      description: typeof e.description === 'string' ? e.description : 'Raid',
      dirtySeized: typeof e.dirtySeized === 'number' ? e.dirtySeized : 0,
      conditionDamage: typeof e.conditionDamage === 'number' ? e.conditionDamage : 0,
    }))
    .slice(-MAX_RAIDS);
}

export function migrateDaySummary(raw: unknown): DaySummary | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  return {
    day: typeof e.day === 'number' ? e.day : 1,
    payroll: typeof e.payroll === 'number' ? e.payroll : 0,
    safehouseUpkeep: typeof e.safehouseUpkeep === 'number' ? e.safehouseUpkeep : 0,
    businessIncome: typeof e.businessIncome === 'number' ? e.businessIncome : 0,
    businessUpkeep: typeof e.businessUpkeep === 'number' ? e.businessUpkeep : 0,
    laundered: typeof e.laundered === 'number' ? e.laundered : 0,
    heatReduced: typeof e.heatReduced === 'number' ? e.heatReduced : 0,
    raids: Array.isArray(e.raids) ? e.raids.filter((r): r is string => typeof r === 'string') : [],
  };
}
