import { GameState, InventoryItem } from '../types/game';
import {
  CrewHistoryEntry,
  CrewRecruitOffer,
  HiredCrewMember,
} from '../types/crew';
import { RankId } from '../types/progression';
import {
  CREW_TEMPLATES,
  CREW_TEMPLATE_MAP,
  templateToOffer,
} from '../data/crewCatalog';
import { getMaxHiredCrew } from '../data/rankBenefits';
import {
  buildCrewOffersFromListing,
  refreshCrewListing,
} from './crewPoolSystem';
import { RANKS } from '../data/progression';
import { isCityUnlocked } from './progression';
import { withMessage, withMessages } from './messages';
import { applyProgressionAfterAction } from './progression';
import { spendMoney } from './money';
import { trackMissionEvent } from './missionSystem';
import { clamp, randomInt } from '../utils/random';
import { getStoreInventory, withStoreInventory } from './storeInventory';
import { getDailyPayroll } from './crewBonuses';
import { createDefaultHiredCrewFields, normalizeHiredCrewMember } from './empireDefaults';
import { ACTION_FEEDBACK } from './empireFlavorText';
import { tickCrewManagement, releaseCrewEmpireAssignments } from './crewManagementSystem';
import { appendFinanceLog } from './financeSystem';

const MAX_HISTORY = 30;

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function meetsRecruitUnlock(state: GameState, offer: CrewRecruitOffer): boolean {
  if (!isCityUnlocked(state, offer.cityId)) return false;
  if (offer.minRank && rankIndex(state.progression.rankId) < rankIndex(offer.minRank)) {
    return false;
  }
  if (offer.minReputation != null && state.player.reputation < offer.minReputation) {
    return false;
  }
  return true;
}

export function refreshCrewRecruits(state: GameState): GameState {
  const { player } = state;
  let updated = refreshCrewListing(state, { force: false });
  const key = `${player.currentCityId}:${player.currentAreaId}`;
  const listing = updated.districtCrewListings?.[key];
  const hiredIds = new Set((updated.hiredCrew ?? []).map((c) => c.templateId));

  const staticTemplates = CREW_TEMPLATES.filter(
    (t) =>
      t.cityId === player.currentCityId &&
      t.areaId === player.currentAreaId &&
      !hiredIds.has(t.id)
  );

  const generatedOffers = listing
    ? buildCrewOffersFromListing(updated, listing.visibleIds)
    : [];

  const offers: CrewRecruitOffer[] = [];
  const usedTemplateIds = new Set<string>();

  for (const template of staticTemplates) {
    if (!meetsRecruitUnlock(updated, templateToOffer(template, player.day))) continue;
    if (usedTemplateIds.has(template.id)) continue;
    usedTemplateIds.add(template.id);
    offers.push(templateToOffer(template, player.day));
  }

  for (const offer of generatedOffers) {
    if (hiredIds.has(offer.templateId)) continue;
    if (usedTemplateIds.has(offer.templateId)) continue;
    if (offer.expiresDay <= player.day) continue;
    if (!meetsRecruitUnlock(updated, offer)) continue;
    usedTemplateIds.add(offer.templateId);
    offers.push(offer);
  }

  return { ...updated, availableCrew: offers };
}

export function hireCrewMember(state: GameState, recruitId: string): GameState {
  const offer = (state.availableCrew ?? []).find((o) => o.id === recruitId);
  if (!offer) return withMessage(state, 'Recruit not found.');

  const active = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
  const maxCrew = getMaxHiredCrew(state);
  if (active.length >= maxCrew) {
    return withMessage(state, `Max ${maxCrew} crew members. Fire someone first.`);
  }

  if (!meetsRecruitUnlock(state, offer)) {
    return withMessage(state, 'You do not meet requirements to hire this crew member.');
  }

  const afterSpend = spendMoney(state.player, offer.hireCost, true);
  if (!afterSpend) {
    return withMessage(
      state,
      `Need $${offer.hireCost} to hire ${offer.name} (clean preferred). You have $${state.player.cash}.`
    );
  }

  const member = normalizeHiredCrewMember({
    ...createDefaultHiredCrewFields({
      id: `crew_${state.player.day}_${offer.templateId}_${Math.random().toString(36).slice(2, 6)}`,
      templateId: offer.templateId,
      name: offer.name,
      role: offer.role,
      cityId: offer.cityId,
      areaId: offer.areaId,
      skill: offer.skill,
      loyalty: offer.loyalty,
      salaryPerDay: offer.salaryPerDay,
      hireCost: offer.hireCost,
      bonuses: offer.bonuses,
      riskTraits: offer.riskTraits,
      status: 'hired',
      daysUnpaid: 0,
      hiredDay: state.player.day,
    }),
    morale: offer.morale,
    stress: offer.stress,
    specialty: offer.specialty,
  });

  const history: CrewHistoryEntry[] = [
    ...(state.crewHistory ?? []),
    { crewId: member.id, name: member.name, event: 'Hired', day: state.player.day },
  ].slice(-MAX_HISTORY);

  return applyProgressionAfterAction(
    trackMissionEvent(
      withMessage(
        {
          ...state,
          player: afterSpend,
          hiredCrew: [...(state.hiredCrew ?? []), member],
          availableCrew: (state.availableCrew ?? []).filter((o) => o.id !== recruitId),
          crewHistory: history,
        },
        `${ACTION_FEEDBACK.crewHired(offer.name)} Salary $${offer.salaryPerDay}/day.`
      ),
      { kind: 'hire_crew' }
    )
  );
}

export function fireCrewMember(state: GameState, crewId: string): GameState {
  const member = (state.hiredCrew ?? []).find((c) => c.id === crewId);
  if (!member || member.status !== 'hired') {
    return withMessage(state, 'Crew member not found or not active.');
  }

  const history: CrewHistoryEntry[] = [
    ...(state.crewHistory ?? []),
    { crewId, name: member.name, event: 'Fired', day: state.player.day },
  ].slice(-MAX_HISTORY);

  return applyProgressionAfterAction(
    withMessage(
      releaseCrewEmpireAssignments(
        {
          ...state,
          hiredCrew: (state.hiredCrew ?? []).map((c) =>
            c.id === crewId ? { ...c, status: 'betrayed' as const } : c
          ),
          crewHistory: history,
        },
        crewId
      ),
      `Cut ${member.name} loose. They will not forget.`
    )
  );
}

export function tickCrewPayroll(state: GameState): GameState {
  const hired = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
  if (hired.length === 0) return state;

  const payroll = getDailyPayroll(state);
  const messages: string[] = [];
  let updated = { ...state };
  let cash = updated.player.cash;
  const storeInv = getStoreInventory(updated);

  if (storeInv.payrollCredits > 0) {
    const crew = hired.map((c) => ({
      ...c,
      daysUnpaid: 0,
      loyalty: clamp(c.loyalty + (c.skill >= 60 ? 1 : 0), 0, 100),
    }));
    updated = withStoreInventory(updated, {
      ...storeInv,
      payrollCredits: storeInv.payrollCredits - 1,
    });
    updated = {
      ...updated,
      hiredCrew: [
        ...crew,
        ...(state.hiredCrew ?? []).filter((c) => c.status !== 'hired'),
      ],
    };
    updated = appendFinanceLog(
      updated,
      'store_effect',
      payroll,
      `Crew payroll covered by store credit (${storeInv.payrollCredits - 1} day(s) left).`
    );
    return withMessage(
      updated,
      `Crew payroll covered by store credit (${storeInv.payrollCredits - 1} day(s) left).`
    );
  }

  if (cash >= payroll) {
    cash -= payroll;
    const crew = hired.map((c) => ({
      ...c,
      daysUnpaid: 0,
      loyalty: clamp(c.loyalty + (c.skill >= 60 ? 1 : 0), 0, 100),
    }));
    updated = {
      ...updated,
      player: { ...updated.player, cash },
      hiredCrew: [
        ...crew,
        ...(state.hiredCrew ?? []).filter((c) => c.status !== 'hired'),
      ],
    };
    messages.push(`Crew payroll -$${payroll} (${hired.length} members).`);
    updated = appendFinanceLog(
      updated,
      'payroll_paid',
      payroll,
      `Crew payroll −$${payroll.toLocaleString()} (${hired.length} members).`
    );
  } else {
    const paid = cash;
    cash = 0;
    messages.push(`Could not cover full payroll ($${payroll}). Paid $${paid}.`);

    let crew = [...(state.hiredCrew ?? [])];
    for (const member of hired) {
      const idx = crew.findIndex((c) => c.id === member.id);
      if (idx < 0) continue;

      const daysUnpaid = member.daysUnpaid + 1;
      let loyalty = clamp(member.loyalty - 12, 0, 100);
      let status = member.status;

      if (daysUnpaid >= 2 && loyalty < 35 && Math.random() < 0.25) {
        status = 'betrayed';
        const stolen = Math.min(updated.player.cash, randomInt(200, 800));
        cash = Math.max(0, cash - stolen);
        messages.push(`${member.name} betrayed you — stole $${stolen}.`);
        loyalty = 0;
      } else if (daysUnpaid >= 3 && Math.random() < 0.15) {
        status = 'arrested';
        messages.push(`${member.name} got picked up — off the payroll.`);
      }

      crew[idx] = { ...member, daysUnpaid, loyalty, status };
    }

    updated = {
      ...updated,
      player: { ...updated.player, cash },
      hiredCrew: crew,
      crewHistory: [
        ...(updated.crewHistory ?? []),
        ...messages.map((m) => ({
          crewId: 'payroll',
          name: 'Payroll',
          event: m,
          day: state.player.day,
        })),
      ].slice(-MAX_HISTORY),
    };
  }

  return messages.length > 1 ? withMessages(updated, messages) : withMessage(updated, messages[0] ?? '');
}

export function tickCrewEmpire(state: GameState): GameState {
  let updated = tickCrewPayroll(state);
  updated = tickCrewManagement(updated);
  return updated;
}

/** Small chance crew gets hurt after encounters. */
export function applyCrewEncounterRisk(state: GameState): GameState {
  const hired = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
  if (hired.length === 0 || Math.random() > 0.12) return state;

  const victim = hired[randomInt(0, hired.length - 1)];
  const arrested = Math.random() < 0.4;

  const crew = (state.hiredCrew ?? []).map((c) =>
    c.id === victim.id
      ? { ...c, status: arrested ? ('arrested' as const) : ('injured' as const), loyalty: clamp(c.loyalty - 5, 0, 100) }
      : c
  );

  return {
    ...state,
    hiredCrew: crew,
    crewHistory: [
      ...(state.crewHistory ?? []),
      {
        crewId: victim.id,
        name: victim.name,
        event: arrested ? 'Arrested during encounter' : 'Injured during encounter',
        day: state.player.day,
      },
    ].slice(-MAX_HISTORY),
  };
}

export function createDefaultCrewState(): {
  availableCrew: CrewRecruitOffer[];
  hiredCrew: HiredCrewMember[];
  crewHistory: CrewHistoryEntry[];
} {
  return { availableCrew: [], hiredCrew: [], crewHistory: [] };
}

export function migrateCrewRecruits(raw: unknown): CrewRecruitOffer[] {
  if (!Array.isArray(raw)) return [];
  const result: CrewRecruitOffer[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const templateId = typeof e.templateId === 'string' ? e.templateId : '';
    if (!CREW_TEMPLATE_MAP[templateId] && typeof e.role !== 'string') continue;
    result.push({
      id: typeof e.id === 'string' ? e.id : `recruit_migrated_${result.length}`,
      templateId,
      name: typeof e.name === 'string' ? e.name : 'Unknown',
      role: (typeof e.role === 'string' ? e.role : 'runner') as HiredCrewMember['role'],
      cityId: typeof e.cityId === 'string' ? e.cityId : 'new_york',
      areaId: typeof e.areaId === 'string' ? e.areaId : 'new_york_downtown',
      skill: typeof e.skill === 'number' ? e.skill : 40,
      loyalty: typeof e.loyalty === 'number' ? e.loyalty : 50,
      salaryPerDay: typeof e.salaryPerDay === 'number' ? e.salaryPerDay : 80,
      hireCost: typeof e.hireCost === 'number' ? e.hireCost : 500,
      bonuses: typeof e.bonuses === 'object' && e.bonuses ? (e.bonuses as HiredCrewMember['bonuses']) : {},
      riskTraits: Array.isArray(e.riskTraits) ? e.riskTraits.filter((t): t is string => typeof t === 'string') : [],
      expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 1,
    });
  }
  return result;
}

export function migrateHiredCrew(raw: unknown): HiredCrewMember[] {
  if (!Array.isArray(raw)) return [];
  const validStatus = ['available', 'hired', 'injured', 'arrested', 'betrayed'] as const;
  const result: HiredCrewMember[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    result.push(normalizeHiredCrewMember({
      id: typeof e.id === 'string' ? e.id : `crew_migrated_${result.length}`,
      templateId: typeof e.templateId === 'string' ? e.templateId : 'unknown',
      name: typeof e.name === 'string' ? e.name : 'Unknown',
      role: (typeof e.role === 'string' ? e.role : 'runner') as HiredCrewMember['role'],
      cityId: typeof e.cityId === 'string' ? e.cityId : 'new_york',
      areaId: typeof e.areaId === 'string' ? e.areaId : 'new_york_downtown',
      skill: typeof e.skill === 'number' ? e.skill : 40,
      loyalty: typeof e.loyalty === 'number' ? e.loyalty : 50,
      salaryPerDay: typeof e.salaryPerDay === 'number' ? e.salaryPerDay : 80,
      hireCost: typeof e.hireCost === 'number' ? e.hireCost : 0,
      bonuses: typeof e.bonuses === 'object' && e.bonuses ? (e.bonuses as HiredCrewMember['bonuses']) : {},
      riskTraits: Array.isArray(e.riskTraits) ? e.riskTraits.filter((t): t is string => typeof t === 'string') : [],
      status: validStatus.includes(e.status as typeof validStatus[number])
        ? (e.status as HiredCrewMember['status'])
        : 'hired',
      daysUnpaid: typeof e.daysUnpaid === 'number' ? e.daysUnpaid : 0,
      hiredDay: typeof e.hiredDay === 'number' ? e.hiredDay : 1,
      morale: typeof e.morale === 'number' ? e.morale : undefined,
      stress: typeof e.stress === 'number' ? e.stress : undefined,
      specialty: typeof e.specialty === 'string' ? e.specialty : undefined,
      riskProfile: typeof e.riskProfile === 'string' ? (e.riskProfile as HiredCrewMember['riskProfile']) : undefined,
      currentAssignment: typeof e.currentAssignment === 'string' ? (e.currentAssignment as HiredCrewMember['currentAssignment']) : undefined,
      relationshipLevel: typeof e.relationshipLevel === 'number' ? e.relationshipLevel : undefined,
      recentEvents: Array.isArray(e.recentEvents) ? e.recentEvents : undefined,
      personalGoal: typeof e.personalGoal === 'string' ? e.personalGoal : undefined,
    }));
  }
  return result;
}

export function migrateCrewHistory(raw: unknown): CrewHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e, i) => ({
      crewId: typeof e.crewId === 'string' ? e.crewId : `hist_${i}`,
      name: typeof e.name === 'string' ? e.name : 'Unknown',
      event: typeof e.event === 'string' ? e.event : '',
      day: typeof e.day === 'number' ? e.day : 1,
    }))
    .slice(-MAX_HISTORY);
}
