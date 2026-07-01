import { GameState } from '../types/game';
import { HiredCrewMember, CrewRole } from '../types/crew';
import { CrewAssignment } from '../types/empire';
import { getBusinessDef } from './businessPoolSystem';
import { SAFEHOUSE_MAP } from '../data/safehouses';
import {
  ALL_CREW_ASSIGNMENTS,
  BUSINESS_MANAGER_ROLES,
  PROPERTY_GUARD_ROLES,
} from '../data/empireCatalog';
import {
  appendEmpireEvent,
  normalizeHiredCrewMember,
} from './empireDefaults';
import { withMessage, withMessages } from './messages';
import { clamp, randomInt } from '../utils/random';
import { addCleanMoney, addDirtyMoney, spendMoney } from './money';
import { appendFinanceLog } from './financeSystem';
import { tryRevealIntelFromCrew } from './intelSystem';
import { maybeAppendCrewFlavor } from './empireFlavorText';

const STRESSFUL_ASSIGNMENTS: CrewAssignment[] = [
  'run_local_sales',
  'collect_debt',
  'assist_smuggling',
  'guard_property',
  'manage_business',
];

function updateCrewMember(
  state: GameState,
  crewId: string,
  patch: Partial<HiredCrewMember>
): GameState {
  return {
    ...state,
    hiredCrew: (state.hiredCrew ?? []).map((c) =>
      c.id === crewId ? normalizeHiredCrewMember({ ...c, ...patch }) : c
    ),
  };
}

function logCrewEvent(
  member: HiredCrewMember,
  day: number,
  message: string,
  tone: 'good' | 'bad' | 'neutral' = 'neutral'
): Partial<HiredCrewMember> {
  return {
    recentEvents: appendEmpireEvent(member.recentEvents, day, message, tone),
  };
}

export function getCrewMember(state: GameState, crewId: string): HiredCrewMember | undefined {
  return (state.hiredCrew ?? []).find((c) => c.id === crewId);
}

export function assignCrewMember(
  state: GameState,
  crewId: string,
  assignment: CrewAssignment,
  targetId?: string
): GameState {
  const member = getCrewMember(state, crewId);
  if (!member || member.status !== 'hired') {
    return withMessage(state, 'Crew member not available.');
  }
  if (!ALL_CREW_ASSIGNMENTS.includes(assignment)) {
    return withMessage(state, 'Invalid assignment.');
  }

  if (assignment === 'manage_business') {
    if (!targetId) return withMessage(state, 'Select a business to manage.');
    const biz = (state.ownedBusinesses ?? []).find((b) => b.businessId === targetId);
    if (!biz) return withMessage(state, 'Business not found.');
    if (!BUSINESS_MANAGER_ROLES.includes(member.role)) {
      return withMessage(state, `${member.name} is not suited to manage a front.`);
    }
    let updated = clearCrewFromBusinessAssignments(state, crewId);
    updated = {
      ...updated,
      ownedBusinesses: (updated.ownedBusinesses ?? []).map((b) =>
        b.businessId === targetId ? { ...b, assignedCrewId: crewId } : b
      ),
    };
    updated = updateCrewMember(updated, crewId, {
      currentAssignment: assignment,
      ...logCrewEvent(member, state.player.day, `Assigned to manage ${getBusinessDef(state, targetId)?.name ?? 'business'}.`, 'good'),
    });
    return withMessage(updated, `${member.name} now manages ${getBusinessDef(state, targetId)?.name ?? 'the front'}.`);
  }

  if (assignment === 'guard_property') {
    if (!targetId) return withMessage(state, 'Select a property to guard.');
    const prop = (state.ownedSafehouses ?? []).find((p) => p.safehouseId === targetId);
    if (!prop) return withMessage(state, 'Property not found.');
    if (!PROPERTY_GUARD_ROLES.includes(member.role)) {
      return withMessage(state, `${member.name} is not suited for guard duty.`);
    }
    let updated = clearCrewFromPropertyGuards(state, crewId);
    updated = {
      ...updated,
      ownedSafehouses: (updated.ownedSafehouses ?? []).map((p) =>
        p.safehouseId === targetId ? { ...p, assignedGuardCrewId: crewId } : p
      ),
    };
    updated = updateCrewMember(updated, crewId, {
      currentAssignment: assignment,
      ...logCrewEvent(member, state.player.day, `Guarding ${SAFEHOUSE_MAP[targetId]?.name ?? 'property'}.`, 'good'),
    });
    return withMessage(updated, `${member.name} is guarding ${SAFEHOUSE_MAP[targetId]?.name ?? 'the property'}.`);
  }

  let updated = clearCrewFromBusinessAssignments(state, crewId);
  updated = clearCrewFromPropertyGuards(updated, crewId);
  updated = updateCrewMember(updated, crewId, {
    currentAssignment: assignment,
    ...logCrewEvent(member, state.player.day, `Reassigned to ${assignment.replace(/_/g, ' ')}.`),
  });
  return withMessage(updated, `${member.name} assigned: ${assignment.replace(/_/g, ' ')}.`);
}

function clearCrewFromBusinessAssignments(state: GameState, crewId: string): GameState {
  return {
    ...state,
    ownedBusinesses: (state.ownedBusinesses ?? []).map((b) =>
      b.assignedCrewId === crewId ? { ...b, assignedCrewId: null } : b
    ),
  };
}

function clearCrewFromPropertyGuards(state: GameState, crewId: string): GameState {
  return {
    ...state,
    ownedSafehouses: (state.ownedSafehouses ?? []).map((p) =>
      p.assignedGuardCrewId === crewId ? { ...p, assignedGuardCrewId: null } : p
    ),
  };
}

/** Release crew from business manager / property guard slots (e.g. on fire). */
export function releaseCrewEmpireAssignments(state: GameState, crewId: string): GameState {
  let updated = clearCrewFromBusinessAssignments(state, crewId);
  updated = clearCrewFromPropertyGuards(updated, crewId);
  return updated;
}

export function getCrewAssignmentBonus(state: GameState, role: CrewRole, assignment: CrewAssignment): number {
  const skillAvg =
    (state.hiredCrew ?? [])
      .filter((c) => c.status === 'hired' && c.currentAssignment === assignment)
      .reduce((sum, c) => sum + c.skill, 0) / Math.max(1, 1);
  void skillAvg;
  const roleFit: Partial<Record<CrewAssignment, CrewRole[]>> = {
    protect_player: ['enforcer', 'lookout'],
    run_local_sales: ['dealer', 'runner'],
    scout_suppliers: ['supplier_scout', 'runner'],
    gather_intel: ['lookout', 'supplier_scout'],
    reduce_heat: ['fixer', 'lookout'],
    assist_smuggling: ['smuggler', 'runner'],
    collect_debt: ['enforcer', 'accountant'],
  };
  const fits = roleFit[assignment]?.includes(role);
  return fits ? 1.15 : 1;
}

/** Daily morale/stress/assignment effects after payroll. */
export function tickCrewManagement(state: GameState, random = Math.random): GameState {
  const hired = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
  if (hired.length === 0) return state;

  let updated = { ...state };
  const messages: string[] = [];
  let player = updated.player;

  for (const member of hired) {
    let morale = member.morale ?? 72;
    let stress = member.stress ?? 18;
    let loyalty = member.loyalty;
    let relationship = member.relationshipLevel ?? 50;
    const assignment = member.currentAssignment ?? 'idle';
    const skillFactor = member.skill / 100;
    const paid = member.daysUnpaid === 0;

    if (paid) {
      morale = clamp(morale + 2, 0, 100);
      relationship = clamp(relationship + 1, 0, 100);
    } else {
      morale = clamp(morale - 8, 0, 100);
      stress = clamp(stress + 6, 0, 100);
    }

    if (STRESSFUL_ASSIGNMENTS.includes(assignment)) {
      stress = clamp(stress + 3, 0, 100);
    } else if (assignment === 'idle') {
      stress = clamp(stress - 2, 0, 100);
    }

    let patch: Partial<HiredCrewMember> = { morale, stress, loyalty, relationshipLevel: relationship };
    let status = member.status;

    if (paid && assignment !== 'idle') {
      switch (assignment) {
        case 'run_local_sales': {
          const income = Math.round(40 + member.skill * 0.8);
          player = addCleanMoney(player, income);
          player = { ...player, heat: clamp(player.heat + 1, 0, 100) };
          updated = appendFinanceLog(
            updated,
            'business_income',
            income,
            `${member.name} local sales +$${income.toLocaleString()}.`
          );
          patch = {
            ...patch,
            ...logCrewEvent(member, state.player.day, `Street sales +$${income}.`, 'good'),
          };
          break;
        }
        case 'reduce_heat': {
          player = { ...player, heat: clamp(player.heat - Math.round(1 + skillFactor * 2), 0, 100) };
          break;
        }
        case 'collect_debt': {
          const bonus = Math.round(25 + member.skill * 0.5);
          player = addDirtyMoney(player, bonus);
          updated = appendFinanceLog(
            updated,
            'store_effect',
            bonus,
            `${member.name} collected $${bonus.toLocaleString()} in street payments.`
          );
          player = { ...player, heat: clamp(player.heat + 1, 0, 100) };
          break;
        }
        case 'gather_intel': {
          if (random() < 0.12 + skillFactor * 0.15) {
            updated = tryRevealIntelFromCrew(updated, member.name);
            patch = {
              ...patch,
              ...logCrewEvent(member, state.player.day, 'Turned up a fresh lead.', 'good'),
            };
          }
          break;
        }
        default:
          break;
      }
    }

    if (!paid && member.daysUnpaid >= 1 && morale < 35 && random() < 0.08) {
      const stolen = randomInt(100, 350);
      player = { ...player, cash: Math.max(0, player.cash - stolen) };
      messages.push(`${member.name} skimmed $${stolen} while unpaid.`);
      patch = {
        ...patch,
        ...logCrewEvent(member, state.player.day, `Skimmed $${stolen} from the bag.`, 'bad'),
      };
    }

    if (stress > 85 && loyalty < 40 && random() < 0.06) {
      status = 'betrayed';
      messages.push(`${member.name} cracked under pressure and left.`);
      patch = {
        ...patch,
        status,
        ...logCrewEvent(member, state.player.day, 'Walked out under stress.', 'bad'),
      };
    } else if (loyalty >= 80 && morale >= 70 && random() < 0.05) {
      loyalty = clamp(loyalty + 2, 0, 100);
      patch = {
        ...patch,
        loyalty,
        ...logCrewEvent(member, state.player.day, 'Went the extra mile for the crew.', 'good'),
      };
    }

    updated = { ...updated, player };
    const flavor = maybeAppendCrewFlavor({ ...member, ...patch, status }, state.player.day, random);
    if (flavor) patch = { ...patch, ...flavor };
    updated = updateCrewMember(updated, member.id, { ...patch, status });
  }

  return messages.length > 0 ? withMessages(updated, messages) : updated;
}

export function getAssignedManagerForBusiness(state: GameState, businessId: string): HiredCrewMember | undefined {
  const record = (state.ownedBusinesses ?? []).find((b) => b.businessId === businessId);
  if (!record?.assignedCrewId) return undefined;
  return getCrewMember(state, record.assignedCrewId);
}

export function getAssignedGuardForProperty(state: GameState, safehouseId: string): HiredCrewMember | undefined {
  const record = (state.ownedSafehouses ?? []).find((p) => p.safehouseId === safehouseId);
  if (!record?.assignedGuardCrewId) return undefined;
  return getCrewMember(state, record.assignedGuardCrewId);
}
