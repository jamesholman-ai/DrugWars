import { GameState } from '../types/game';
import { OwnedSafehouse } from '../types/safehouses';
import { PropertyUpgradeKind } from '../types/empire';
import { SAFEHOUSE_MAP } from '../data/safehouses';
import { getPropertyDef } from './propertyPoolSystem';
import {
  getPropertyUpgradeCost,
  PROPERTY_UPGRADE_LABELS,
} from '../data/empireCatalog';
import {
  appendEmpireEvent,
  migratePropertyUpgrades,
  normalizeOwnedSafehouse,
} from './empireDefaults';
import { getAssignedGuardForProperty, assignCrewMember } from './crewManagementSystem';
import { withMessage, withMessages } from './messages';
import { clamp, randomInt } from '../utils/random';
import { spendMoney } from './money';
import { appendFinanceLog } from './financeSystem';
import { applyProgressionAfterAction } from './progression';
import { ACTION_FEEDBACK, maybeAppendPropertyFlavor } from './empireFlavorText';

export function getPropertyRecord(state: GameState, safehouseId: string): OwnedSafehouse | undefined {
  return (state.ownedSafehouses ?? []).find((p) => p.safehouseId === safehouseId);
}

export function getEffectivePropertyStats(state: GameState, record: OwnedSafehouse) {
  const def = getPropertyDef(state, record.safehouseId) ?? SAFEHOUSE_MAP[record.safehouseId];
  if (!def) {
    return {
      storageCapacity: 0,
      heatReduction: 0,
      robberyProtection: 0,
      policeMod: 1,
      seizureProtection: 0,
      comfortLevel: 0,
      securityLevel: 0,
      secrecyLevel: 0,
      conditionMult: 1,
    };
  }
  const upgrades = migratePropertyUpgrades(record.upgradeLevels);
  const guard = getAssignedGuardForProperty(state, record.safehouseId);
  const conditionMult = clamp(record.condition / 100, 0.2, 1);

  return {
    storageCapacity:
      def.storageCapacity + upgrades.storageExpansion * 25 + upgrades.hiddenCompartments * 8,
    heatReduction: def.heatReductionPerDay + upgrades.cleanerCrew * 1,
    robberyProtection: clamp(
      def.robberyProtection +
        upgrades.locks * 0.08 +
        upgrades.surveillance * 0.05 +
        (guard ? guard.skill / 500 : 0),
      0,
      0.85
    ),
    policeMod: def.policeRiskModifier * (1 - upgrades.escapeRoute * 0.06),
    seizureProtection: clamp(
      upgrades.hiddenCompartments * 0.12 + upgrades.safeRoom * 0.08,
      0,
      0.65
    ),
    comfortLevel: clamp(
      (record.comfortLevel ?? def.comfortLevel) + upgrades.safeRoom * 8 + upgrades.cleanerCrew * 5,
      0,
      100
    ),
    securityLevel: clamp(
      (record.securityLevel ?? def.securityLevel) +
        upgrades.locks * 8 +
        upgrades.surveillance * 6 +
        (guard ? guard.skill / 8 : 0),
      0,
      100
    ),
    secrecyLevel: clamp(
      (record.secrecyLevel ?? def.secrecyLevel) +
        upgrades.hiddenCompartments * 5 +
        upgrades.escapeRoute * 4,
      0,
      100
    ),
    conditionMult,
  };
}

export function getEffectiveStorageCapacity(state: GameState, safehouseId: string): number {
  const record = getPropertyRecord(state, safehouseId);
  const def = getPropertyDef(state, safehouseId) ?? SAFEHOUSE_MAP[safehouseId];
  if (!record || !def) return def?.storageCapacity ?? 0;
  return getEffectivePropertyStats(state, record).storageCapacity;
}

export function upgradeProperty(
  state: GameState,
  safehouseId: string,
  kind: PropertyUpgradeKind
): GameState {
  const record = getPropertyRecord(state, safehouseId);
  const def = getPropertyDef(state, safehouseId) ?? SAFEHOUSE_MAP[safehouseId];
  if (!record || !def) return withMessage(state, 'Property not found.');

  const upgrades = migratePropertyUpgrades(record.upgradeLevels);
  const current = upgrades[kind];
  if (current >= 3) return withMessage(state, `${PROPERTY_UPGRADE_LABELS[kind]} is maxed.`);

  const cost = getPropertyUpgradeCost(kind, current + 1);
  const afterSpend = spendMoney(state.player, cost, true);
  if (!afterSpend) return withMessage(state, `Need $${cost} for ${PROPERTY_UPGRADE_LABELS[kind]}.`);

  const nextLevels = { ...upgrades, [kind]: current + 1 };
  const nextOwned = (state.ownedSafehouses ?? []).map((p) =>
    p.safehouseId === safehouseId
      ? normalizeOwnedSafehouse({
          ...p,
          upgradeLevels: nextLevels,
          recentEvents: appendEmpireEvent(
            p.recentEvents,
            state.player.day,
            `${PROPERTY_UPGRADE_LABELS[kind]} upgraded to level ${current + 1}.`,
            'good'
          ),
        })
      : p
  );

  let updated = withMessage(
    { ...state, player: afterSpend, ownedSafehouses: nextOwned },
    `${def.name}: ${PROPERTY_UPGRADE_LABELS[kind]} upgraded (−$${cost}). ${ACTION_FEEDBACK.propertyUpgraded(PROPERTY_UPGRADE_LABELS[kind])}`
  );
  updated = appendFinanceLog(
    updated,
    'property_upkeep',
    cost,
    `${def.name} ${PROPERTY_UPGRADE_LABELS[kind]} upgrade −$${cost.toLocaleString()}.`
  );
  return applyProgressionAfterAction(updated);
}

export function assignPropertyGuard(
  state: GameState,
  safehouseId: string,
  crewId: string | null
): GameState {
  if (crewId) {
    return assignCrewMember(state, crewId, 'guard_property', safehouseId);
  }
  const next = (state.ownedSafehouses ?? []).map((p) =>
    p.safehouseId === safehouseId ? { ...p, assignedGuardCrewId: null } : p
  );
  return withMessage({ ...state, ownedSafehouses: next }, 'Guard removed from property.');
}

export function layLowAtProperty(state: GameState, safehouseId: string): GameState {
  const record = getPropertyRecord(state, safehouseId);
  const def = getPropertyDef(state, safehouseId) ?? SAFEHOUSE_MAP[safehouseId];
  if (!record || !def) return withMessage(state, 'Property not found.');
  const stats = getEffectivePropertyStats(state, record);
  const drop = Math.round(10 + stats.heatReduction + stats.comfortLevel);

  let updated: GameState = {
    ...state,
    player: {
      ...state.player,
      heat: clamp(state.player.heat - drop, 0, 100),
    },
    ownedSafehouses: (state.ownedSafehouses ?? []).map((p) =>
      p.safehouseId === safehouseId
        ? normalizeOwnedSafehouse({
            ...p,
            recentEvents: appendEmpireEvent(
              p.recentEvents,
              state.player.day,
              'Laid low — doors locked, phones off.',
              'good'
            ),
          })
        : p
    ),
  };
  return withMessage(updated, `Laid low at ${def.name}. Heat −${drop}.`);
}

export function rollPropertyDailyEvents(
  state: GameState,
  random: () => number = Math.random
): GameState {
  const owned = state.ownedSafehouses ?? [];
  if (owned.length === 0) return state;

  let updated = { ...state };
  const messages: string[] = [];

  for (const record of owned) {
    const def = getPropertyDef(updated, record.safehouseId) ?? SAFEHOUSE_MAP[record.safehouseId];
    if (!def) continue;
    const stats = getEffectivePropertyStats(updated, record);
    const guard = getAssignedGuardForProperty(updated, record.safehouseId);
    const roll = random();

    if (roll < 0.05 && stats.secrecyLevel < 35) {
      messages.push(`Neighbor suspicion at ${def.name}.`);
      updated = patchProperty(updated, record.safehouseId, {
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, 'Neighbors noticed odd traffic.', 'bad'),
      });
    } else if (roll < 0.04 * (1 - stats.robberyProtection)) {
      const damage = randomInt(5, 15);
      messages.push(`Break-in attempt at ${def.name} (−${damage} condition).`);
      updated = patchProperty(updated, record.safehouseId, {
        condition: clamp(record.condition - damage, 20, 100),
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, 'Break-in attempt — damage reported.', 'bad'),
      });
    } else if (guard && guard.loyalty >= 65 && roll < 0.1) {
      messages.push(`${guard.name} stopped a robbery at ${def.name}.`);
      updated = patchProperty(updated, record.safehouseId, {
        recentEvents: appendEmpireEvent(
          record.recentEvents,
          state.player.day,
          `${guard.name} prevented a break-in.`,
          'good'
        ),
      });
    } else if (stats.secrecyLevel >= 35 && roll < 0.08) {
      updated = patchProperty(updated, record.safehouseId, {
        recentEvents: appendEmpireEvent(record.recentEvents, state.player.day, 'Surveillance flagged police movement early.', 'good'),
      });
    } else if (stats.comfortLevel >= 35 && roll < 0.07) {
      updated = {
        ...updated,
        player: {
          ...updated.player,
          heat: clamp(updated.player.heat - 1, 0, 100),
        },
      };
    }

    const currentRecord = getPropertyRecord(updated, record.safehouseId) ?? record;
    const flavor = maybeAppendPropertyFlavor(currentRecord, state.player.day, random);
    if (flavor) {
      updated = patchProperty(updated, record.safehouseId, flavor);
    }
  }

  return messages.length > 0 ? withMessages(updated, messages) : updated;
}

function patchProperty(
  state: GameState,
  safehouseId: string,
  patch: Partial<OwnedSafehouse>
): GameState {
  return {
    ...state,
    ownedSafehouses: (state.ownedSafehouses ?? []).map((p) =>
      p.safehouseId === safehouseId ? normalizeOwnedSafehouse({ ...p, ...patch }) : p
    ),
  };
}

export function getPropertyPortfolioSummary(state: GameState) {
  let storage = 0;
  let security = 0;
  let rent = 0;
  let upkeep = 0;
  for (const record of state.ownedSafehouses ?? []) {
    const def = getPropertyDef(state, record.safehouseId) ?? SAFEHOUSE_MAP[record.safehouseId];
    if (!def) continue;
    const stats = getEffectivePropertyStats(state, record);
    storage += stats.storageCapacity;
    security += stats.securityLevel;
    if (record.rentOrOwn === 'rent') {
      rent += def.rentPerDay > 0 ? def.rentPerDay : 45;
    } else {
      upkeep += def.upkeepPerDay;
    }
  }
  const count = (state.ownedSafehouses ?? []).length;
  return {
    count,
    storage,
    avgSecurity: count ? Math.round(security / count) : 0,
    rent,
    upkeep,
    dailyCost: rent + upkeep,
  };
}
