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
  MAX_CREW_RECRUITS,
  MAX_HIRED_CREW,
  templateToOffer,
} from '../data/crewCatalog';
import { RANKS } from '../data/progression';
import { isCityUnlocked } from './progression';
import { withMessage, withMessages } from './messages';
import { applyProgressionAfterAction } from './progression';
import { spendMoney } from './money';
import { trackMissionEvent } from './missionSystem';
import { clamp, randomInt } from '../utils/random';
import { getStoreInventory, withStoreInventory } from './storeInventory';
import { getDailyPayroll } from './crewBonuses';

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
  const hiredIds = new Set((state.hiredCrew ?? []).map((c) => c.templateId));
  let offers = (state.availableCrew ?? []).filter(
    (o) => o.expiresDay > player.day && !hiredIds.has(o.templateId)
  );

  if (offers.length >= MAX_CREW_RECRUITS) {
    return { ...state, availableCrew: offers };
  }

  const localTemplates = CREW_TEMPLATES.filter(
    (t) =>
      t.cityId === player.currentCityId &&
      t.areaId === player.currentAreaId &&
      !hiredIds.has(t.id)
  );

  for (const template of localTemplates) {
    if (offers.length >= MAX_CREW_RECRUITS) break;
    if (offers.some((o) => o.templateId === template.id)) continue;
    if (Math.random() > 0.4) continue;

    const offer = templateToOffer(template, player.day);
    if (!meetsRecruitUnlock(state, offer)) continue;
    offers.push(offer);
  }

  return { ...state, availableCrew: offers };
}

export function hireCrewMember(state: GameState, recruitId: string): GameState {
  const offer = (state.availableCrew ?? []).find((o) => o.id === recruitId);
  if (!offer) return withMessage(state, 'Recruit not found.');

  const active = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
  if (active.length >= MAX_HIRED_CREW) {
    return withMessage(state, `Max ${MAX_HIRED_CREW} crew members. Fire someone first.`);
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

  const member: HiredCrewMember = {
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
  };

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
        `Hired ${offer.name} (${offer.role}) for $${offer.hireCost}. Salary $${offer.salaryPerDay}/day.`
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
      {
        ...state,
        hiredCrew: (state.hiredCrew ?? []).map((c) =>
          c.id === crewId ? { ...c, status: 'betrayed' as const } : c
        ),
        crewHistory: history,
      },
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
    result.push({
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
    });
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
