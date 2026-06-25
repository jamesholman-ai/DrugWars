"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCrewRecruits = refreshCrewRecruits;
exports.hireCrewMember = hireCrewMember;
exports.fireCrewMember = fireCrewMember;
exports.tickCrewPayroll = tickCrewPayroll;
exports.applyCrewEncounterRisk = applyCrewEncounterRisk;
exports.createDefaultCrewState = createDefaultCrewState;
exports.migrateCrewRecruits = migrateCrewRecruits;
exports.migrateHiredCrew = migrateHiredCrew;
exports.migrateCrewHistory = migrateCrewHistory;
const crewCatalog_1 = require("../data/crewCatalog");
const progression_1 = require("../data/progression");
const progression_2 = require("./progression");
const messages_1 = require("./messages");
const progression_3 = require("./progression");
const money_1 = require("./money");
const missionSystem_1 = require("./missionSystem");
const random_1 = require("../utils/random");
const crewBonuses_1 = require("./crewBonuses");
const MAX_HISTORY = 30;
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function meetsRecruitUnlock(state, offer) {
    if (!(0, progression_2.isCityUnlocked)(state, offer.cityId))
        return false;
    if (offer.minRank && rankIndex(state.progression.rankId) < rankIndex(offer.minRank)) {
        return false;
    }
    if (offer.minReputation != null && state.player.reputation < offer.minReputation) {
        return false;
    }
    return true;
}
function refreshCrewRecruits(state) {
    const { player } = state;
    const hiredIds = new Set((state.hiredCrew ?? []).map((c) => c.templateId));
    let offers = (state.availableCrew ?? []).filter((o) => o.expiresDay > player.day && !hiredIds.has(o.templateId));
    if (offers.length >= crewCatalog_1.MAX_CREW_RECRUITS) {
        return { ...state, availableCrew: offers };
    }
    const localTemplates = crewCatalog_1.CREW_TEMPLATES.filter((t) => t.cityId === player.currentCityId &&
        t.areaId === player.currentAreaId &&
        !hiredIds.has(t.id));
    for (const template of localTemplates) {
        if (offers.length >= crewCatalog_1.MAX_CREW_RECRUITS)
            break;
        if (offers.some((o) => o.templateId === template.id))
            continue;
        if (Math.random() > 0.4)
            continue;
        const offer = (0, crewCatalog_1.templateToOffer)(template, player.day);
        if (!meetsRecruitUnlock(state, offer))
            continue;
        offers.push(offer);
    }
    return { ...state, availableCrew: offers };
}
function hireCrewMember(state, recruitId) {
    const offer = (state.availableCrew ?? []).find((o) => o.id === recruitId);
    if (!offer)
        return (0, messages_1.withMessage)(state, 'Recruit not found.');
    const active = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
    if (active.length >= crewCatalog_1.MAX_HIRED_CREW) {
        return (0, messages_1.withMessage)(state, `Max ${crewCatalog_1.MAX_HIRED_CREW} crew members. Fire someone first.`);
    }
    if (!meetsRecruitUnlock(state, offer)) {
        return (0, messages_1.withMessage)(state, 'You do not meet requirements to hire this crew member.');
    }
    const afterSpend = (0, money_1.spendMoney)(state.player, offer.hireCost, true);
    if (!afterSpend) {
        return (0, messages_1.withMessage)(state, `Need $${offer.hireCost} to hire ${offer.name} (clean preferred). You have $${state.player.cash}.`);
    }
    const member = {
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
    const history = [
        ...(state.crewHistory ?? []),
        { crewId: member.id, name: member.name, event: 'Hired', day: state.player.day },
    ].slice(-MAX_HISTORY);
    return (0, progression_3.applyProgressionAfterAction)((0, missionSystem_1.trackMissionEvent)((0, messages_1.withMessage)({
        ...state,
        player: afterSpend,
        hiredCrew: [...(state.hiredCrew ?? []), member],
        availableCrew: (state.availableCrew ?? []).filter((o) => o.id !== recruitId),
        crewHistory: history,
    }, `Hired ${offer.name} (${offer.role}) for $${offer.hireCost}. Salary $${offer.salaryPerDay}/day.`), { kind: 'hire_crew' }));
}
function fireCrewMember(state, crewId) {
    const member = (state.hiredCrew ?? []).find((c) => c.id === crewId);
    if (!member || member.status !== 'hired') {
        return (0, messages_1.withMessage)(state, 'Crew member not found or not active.');
    }
    const history = [
        ...(state.crewHistory ?? []),
        { crewId, name: member.name, event: 'Fired', day: state.player.day },
    ].slice(-MAX_HISTORY);
    return (0, progression_3.applyProgressionAfterAction)((0, messages_1.withMessage)({
        ...state,
        hiredCrew: (state.hiredCrew ?? []).map((c) => c.id === crewId ? { ...c, status: 'betrayed' } : c),
        crewHistory: history,
    }, `Cut ${member.name} loose. They will not forget.`));
}
function tickCrewPayroll(state) {
    const hired = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
    if (hired.length === 0)
        return state;
    const payroll = (0, crewBonuses_1.getDailyPayroll)(state);
    const messages = [];
    let updated = { ...state };
    let cash = updated.player.cash;
    if (cash >= payroll) {
        cash -= payroll;
        const crew = hired.map((c) => ({
            ...c,
            daysUnpaid: 0,
            loyalty: (0, random_1.clamp)(c.loyalty + (c.skill >= 60 ? 1 : 0), 0, 100),
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
    }
    else {
        const paid = cash;
        cash = 0;
        messages.push(`Could not cover full payroll ($${payroll}). Paid $${paid}.`);
        let crew = [...(state.hiredCrew ?? [])];
        for (const member of hired) {
            const idx = crew.findIndex((c) => c.id === member.id);
            if (idx < 0)
                continue;
            const daysUnpaid = member.daysUnpaid + 1;
            let loyalty = (0, random_1.clamp)(member.loyalty - 12, 0, 100);
            let status = member.status;
            if (daysUnpaid >= 2 && loyalty < 35 && Math.random() < 0.25) {
                status = 'betrayed';
                const stolen = Math.min(updated.player.cash, (0, random_1.randomInt)(200, 800));
                cash = Math.max(0, cash - stolen);
                messages.push(`${member.name} betrayed you — stole $${stolen}.`);
                loyalty = 0;
            }
            else if (daysUnpaid >= 3 && Math.random() < 0.15) {
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
    return messages.length > 1 ? (0, messages_1.withMessages)(updated, messages) : (0, messages_1.withMessage)(updated, messages[0] ?? '');
}
/** Small chance crew gets hurt after encounters. */
function applyCrewEncounterRisk(state) {
    const hired = (state.hiredCrew ?? []).filter((c) => c.status === 'hired');
    if (hired.length === 0 || Math.random() > 0.12)
        return state;
    const victim = hired[(0, random_1.randomInt)(0, hired.length - 1)];
    const arrested = Math.random() < 0.4;
    const crew = (state.hiredCrew ?? []).map((c) => c.id === victim.id
        ? { ...c, status: arrested ? 'arrested' : 'injured', loyalty: (0, random_1.clamp)(c.loyalty - 5, 0, 100) }
        : c);
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
function createDefaultCrewState() {
    return { availableCrew: [], hiredCrew: [], crewHistory: [] };
}
function migrateCrewRecruits(raw) {
    if (!Array.isArray(raw))
        return [];
    const result = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        const templateId = typeof e.templateId === 'string' ? e.templateId : '';
        if (!crewCatalog_1.CREW_TEMPLATE_MAP[templateId] && typeof e.role !== 'string')
            continue;
        result.push({
            id: typeof e.id === 'string' ? e.id : `recruit_migrated_${result.length}`,
            templateId,
            name: typeof e.name === 'string' ? e.name : 'Unknown',
            role: (typeof e.role === 'string' ? e.role : 'runner'),
            cityId: typeof e.cityId === 'string' ? e.cityId : 'new_york',
            areaId: typeof e.areaId === 'string' ? e.areaId : 'new_york_downtown',
            skill: typeof e.skill === 'number' ? e.skill : 40,
            loyalty: typeof e.loyalty === 'number' ? e.loyalty : 50,
            salaryPerDay: typeof e.salaryPerDay === 'number' ? e.salaryPerDay : 80,
            hireCost: typeof e.hireCost === 'number' ? e.hireCost : 500,
            bonuses: typeof e.bonuses === 'object' && e.bonuses ? e.bonuses : {},
            riskTraits: Array.isArray(e.riskTraits) ? e.riskTraits.filter((t) => typeof t === 'string') : [],
            expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 1,
        });
    }
    return result;
}
function migrateHiredCrew(raw) {
    if (!Array.isArray(raw))
        return [];
    const validStatus = ['available', 'hired', 'injured', 'arrested', 'betrayed'];
    const result = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        result.push({
            id: typeof e.id === 'string' ? e.id : `crew_migrated_${result.length}`,
            templateId: typeof e.templateId === 'string' ? e.templateId : 'unknown',
            name: typeof e.name === 'string' ? e.name : 'Unknown',
            role: (typeof e.role === 'string' ? e.role : 'runner'),
            cityId: typeof e.cityId === 'string' ? e.cityId : 'new_york',
            areaId: typeof e.areaId === 'string' ? e.areaId : 'new_york_downtown',
            skill: typeof e.skill === 'number' ? e.skill : 40,
            loyalty: typeof e.loyalty === 'number' ? e.loyalty : 50,
            salaryPerDay: typeof e.salaryPerDay === 'number' ? e.salaryPerDay : 80,
            hireCost: typeof e.hireCost === 'number' ? e.hireCost : 0,
            bonuses: typeof e.bonuses === 'object' && e.bonuses ? e.bonuses : {},
            riskTraits: Array.isArray(e.riskTraits) ? e.riskTraits.filter((t) => typeof t === 'string') : [],
            status: validStatus.includes(e.status)
                ? e.status
                : 'hired',
            daysUnpaid: typeof e.daysUnpaid === 'number' ? e.daysUnpaid : 0,
            hiredDay: typeof e.hiredDay === 'number' ? e.hiredDay : 1,
        });
    }
    return result;
}
function migrateCrewHistory(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((e) => typeof e === 'object' && e !== null)
        .map((e, i) => ({
        crewId: typeof e.crewId === 'string' ? e.crewId : `hist_${i}`,
        name: typeof e.name === 'string' ? e.name : 'Unknown',
        event: typeof e.event === 'string' ? e.event : '',
        day: typeof e.day === 'number' ? e.day : 1,
    }))
        .slice(-MAX_HISTORY);
}
