import { GameState } from '../types/game';
import { OwnedBusiness } from '../types/businesses';
import { BusinessUpgradeKind } from '../types/empire';
import { getBusinessDef } from './businessPoolSystem';
import {
  BUSINESS_UPGRADE_LABELS,
  getBusinessUpgradeCost,
} from '../data/empireCatalog';
import {
  appendEmpireEvent,
  migrateBusinessUpgrades,
  normalizeOwnedBusiness,
} from './empireDefaults';
import { getAssignedManagerForBusiness } from './crewManagementSystem';
import { assignCrewMember } from './crewManagementSystem';
import { withMessage, withMessages } from './messages';
import { clamp, randomInt } from '../utils/random';
import { spendMoney, addCleanMoney } from './money';
import { appendFinanceLog } from './financeSystem';
import { applyProgressionAfterAction } from './progression';
import { ACTION_FEEDBACK, maybeAppendBusinessFlavor } from './empireFlavorText';

function conditionMult(condition: number): number {
  return clamp(condition / 100, 0.1, 1);
}

export function getBusinessRecord(state: GameState, businessId: string): OwnedBusiness | undefined {
  return (state.ownedBusinesses ?? []).find((b) => b.businessId === businessId);
}

export function getEffectiveBusinessStats(state: GameState, record: OwnedBusiness) {
  const def = getBusinessDef(state, record.businessId);
  if (!def) {
    return {
      income: 0,
      upkeep: 0,
      launderCap: 0,
      heatDrop: 0,
      raidRiskMod: 1,
      reputation: 0,
      heat: 0,
    };
  }
  const upgrades = migrateBusinessUpgrades(record.upgradeLevels);
  const mult = conditionMult(record.condition);
  const manager = getAssignedManagerForBusiness(state, record.businessId);
  const managerBoost =
    manager && manager.status === 'hired' ? 1 + manager.skill / 200 : 1;

  const staffMult = 1 + upgrades.staff * 0.12;
  const launderMult = 1 + upgrades.laundering * 0.15;
  const expansionMult = 1 + upgrades.expansion * 0.18;

  return {
    income: Math.round(def.dailyIncome * mult * staffMult * expansionMult * managerBoost),
    upkeep: Math.round(def.upkeepPerDay * (1 + upgrades.expansion * 0.25)),
    launderCap: Math.round(def.launderingCapacityPerDay * mult * launderMult * managerBoost),
    heatDrop: Math.round(def.heatReductionPerDay * mult * (1 + upgrades.legitimacy * 0.1)),
    raidRiskMod: Math.max(0.45, 1 - upgrades.security * 0.12 - (manager ? 0.08 : 0)),
    reputation: record.reputation ?? 55,
    heat: record.heat ?? 12,
  };
}

export function upgradeBusiness(
  state: GameState,
  businessId: string,
  kind: BusinessUpgradeKind
): GameState {
  const record = getBusinessRecord(state, businessId);
  const def = getBusinessDef(state, businessId);
  if (!record || !def) return withMessage(state, 'Business not found.');
  if (record.condition <= 0) return withMessage(state, 'Repair the business first.');

  const upgrades = migrateBusinessUpgrades(record.upgradeLevels);
  const current = upgrades[kind];
  if (current >= 3) return withMessage(state, `${BUSINESS_UPGRADE_LABELS[kind]} is maxed.`);

  const cost = getBusinessUpgradeCost(kind, current + 1);
  const afterSpend = spendMoney(state.player, cost, true);
  if (!afterSpend) return withMessage(state, `Need $${cost} for ${BUSINESS_UPGRADE_LABELS[kind]}.`);

  const nextLevels = { ...upgrades, [kind]: current + 1 };
  const nextOwned = (state.ownedBusinesses ?? []).map((b) =>
    b.businessId === businessId
      ? normalizeOwnedBusiness({
          ...b,
          upgradeLevels: nextLevels,
          recentEvents: appendEmpireEvent(
            b.recentEvents,
            state.player.day,
            `${BUSINESS_UPGRADE_LABELS[kind]} upgraded to level ${current + 1}.`,
            'good'
          ),
        })
      : b
  );

  let updated = withMessage(
    {
      ...state,
      player: afterSpend,
      ownedBusinesses: nextOwned,
    },
    `${def.name}: ${BUSINESS_UPGRADE_LABELS[kind]} upgraded (−$${cost}). ${ACTION_FEEDBACK.businessUpgraded(BUSINESS_UPGRADE_LABELS[kind])}`
  );
  updated = appendFinanceLog(
    updated,
    'business_upkeep',
    cost,
    `${def.name} ${BUSINESS_UPGRADE_LABELS[kind]} upgrade −$${cost.toLocaleString()}.`
  );
  return applyProgressionAfterAction(updated);
}

export function assignBusinessManager(
  state: GameState,
  businessId: string,
  crewId: string | null
): GameState {
  const record = getBusinessRecord(state, businessId);
  if (!record) return withMessage(state, 'Business not found.');
  if (crewId) {
    return assignCrewMember(state, crewId, 'manage_business', businessId);
  }
  const next = (state.ownedBusinesses ?? []).map((b) =>
    b.businessId === businessId ? { ...b, assignedCrewId: null } : b
  );
  return withMessage({ ...state, ownedBusinesses: next }, 'Manager removed from business.');
}

export function layLowThroughBusiness(state: GameState, businessId: string): GameState {
  const record = getBusinessRecord(state, businessId);
  const def = getBusinessDef(state, businessId);
  if (!record || !def) return withMessage(state, 'Business not found.');
  const upgrades = migrateBusinessUpgrades(record.upgradeLevels);
  if (upgrades.legitimacy < 1) {
    return withMessage(state, 'Need Front Legitimacy upgrade to lay low through this front.');
  }
  if (record.condition < 40) {
    return withMessage(state, 'Front is too damaged to use as cover.');
  }

  let updated: GameState = {
    ...state,
    player: {
      ...state.player,
      heat: clamp(state.player.heat - 8 - upgrades.legitimacy * 2, 0, 100),
    },
    ownedBusinesses: (state.ownedBusinesses ?? []).map((b) =>
      b.businessId === businessId
        ? normalizeOwnedBusiness({
            ...b,
            heat: clamp((b.heat ?? 12) + 4, 0, 100),
            recentEvents: appendEmpireEvent(
              b.recentEvents,
              state.player.day,
              'Hosted a legitimate event as cover.',
              'good'
            ),
          })
        : b
    ),
  };
  return withMessage(updated, `Laid low through ${def.name}. Heat −${8 + upgrades.legitimacy * 2}.`);
}

/** Random daily business events after income tick. */
export function rollBusinessDailyEvents(
  state: GameState,
  random: () => number = Math.random
): GameState {
  const owned = state.ownedBusinesses ?? [];
  if (owned.length === 0) return state;

  let updated = { ...state };
  const messages: string[] = [];
  let player = updated.player;

  for (const record of owned) {
    if (record.condition <= 0) continue;
    const def = getBusinessDef(state, record.businessId);
    if (!def) continue;

    const stats = getEffectiveBusinessStats(updated, record);
    const manager = getAssignedManagerForBusiness(updated, record.businessId);
    const roll = random();

    if (roll < 0.04 * stats.raidRiskMod) {
      const damage = randomInt(8, 18);
      const seized = Math.min(player.dirtyCash ?? 0, randomInt(100, 400));
      player = {
        ...player,
        cash: Math.max(0, player.cash - seized),
        dirtyCash: Math.max(0, (player.dirtyCash ?? 0) - seized),
        heat: clamp(player.heat + 4, 0, 100),
      };
      messages.push(`Police audit at ${def.name}! −${damage} condition.`);
      updated = patchBusiness(updated, record.businessId, {
        condition: clamp(record.condition - damage, 0, 100),
        heat: clamp((record.heat ?? 12) + 10, 0, 100),
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, 'Police audit — books checked.', 'bad'),
      });
    } else if (roll < 0.07) {
      const bonus = Math.round(stats.income * 0.35);
      player = addCleanMoney(player, bonus);
      updated = appendFinanceLog(updated, 'business_income', bonus, `${def.name} revenue boom +$${bonus.toLocaleString()}.`);
      messages.push(`${def.name} had a revenue boom (+$${bonus}).`);
      updated = patchBusiness(updated, record.businessId, {
        reputation: clamp((record.reputation ?? 55) + 5, 0, 100),
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, 'VIP customer week — strong sales.', 'good'),
      });
    } else if (roll < 0.1 && !manager) {
      const loss = randomInt(80, 220);
      player = { ...player, cash: Math.max(0, player.cash - loss) };
      messages.push(`Employee theft at ${def.name} (−$${loss}).`);
      updated = patchBusiness(updated, record.businessId, {
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, `Employee skimmed $${loss}.`, 'bad'),
      });
    } else if (manager && manager.loyalty >= 70 && roll < 0.12) {
      updated = patchBusiness(updated, record.businessId, {
        condition: clamp(record.condition + 2, 0, 100),
        recentEvents: appendEmpireEvent(
          record.recentEvents,
          state.player.day,
          `${manager.name} prevented a loss.`,
          'good'
        ),
      });
    } else if (stats.heat > 40 && random() < 0.06) {
      updated = patchBusiness(updated, record.businessId, {
        heat: clamp((record.heat ?? 12) - 3, 0, 100),
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, 'Laundering run cleared quietly.', 'good'),
      });
    }

    const currentRecord = getBusinessRecord(updated, record.businessId) ?? record;
    const flavor = maybeAppendBusinessFlavor(currentRecord, state.player.day, random);
    if (flavor) {
      updated = patchBusiness(updated, record.businessId, flavor);
    }
  }

  updated = { ...updated, player };
  return messages.length > 0 ? withMessages(updated, messages) : updated;
}

function patchBusiness(
  state: GameState,
  businessId: string,
  patch: Partial<OwnedBusiness>
): GameState {
  return {
    ...state,
    ownedBusinesses: (state.ownedBusinesses ?? []).map((b) =>
      b.businessId === businessId ? normalizeOwnedBusiness({ ...b, ...patch }) : b
    ),
  };
}

export function getPortfolioSummary(state: GameState) {
  let income = 0;
  let upkeep = 0;
  let launder = 0;
  let heat = 0;
  for (const record of state.ownedBusinesses ?? []) {
    if (record.condition <= 0) continue;
    const stats = getEffectiveBusinessStats(state, record);
    income += stats.income;
    upkeep += stats.upkeep;
    launder += stats.launderCap;
    heat += stats.heat;
  }
  const count = (state.ownedBusinesses ?? []).filter((b) => b.condition > 0).length;
  return { income, upkeep, launder, heat: count ? Math.round(heat / count) : 0, count };
}
