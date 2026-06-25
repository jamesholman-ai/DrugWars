"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMissionState = syncMissionState;
exports.trackMissionEvent = trackMissionEvent;
exports.generateDailyObjectives = generateDailyObjectives;
exports.tickMissionsOnDayAdvance = tickMissionsOnDayAdvance;
exports.claimMissionReward = claimMissionReward;
exports.claimDailyObjective = claimDailyObjective;
exports.getCurrentStoryMission = getCurrentStoryMission;
exports.initializeMissionState = initializeMissionState;
exports.createDefaultMissionState = createDefaultMissionState;
exports.migrateMissionInstances = migrateMissionInstances;
exports.migrateDailyObjectives = migrateDailyObjectives;
exports.migratePriceTips = migratePriceTips;
exports.migrateMissionProgress = migrateMissionProgress;
exports.getMissionProgressLabel = getMissionProgressLabel;
exports.getMissionProgressWidgetText = getMissionProgressWidgetText;
exports.isStoryCampaignComplete = isStoryCampaignComplete;
exports.getDailyProgressLabel = getDailyProgressLabel;
exports.getActivePriceTips = getActivePriceTips;
exports.formatPriceTip = formatPriceTip;
const missions_1 = require("../data/missions");
const progression_1 = require("../data/progression");
const commodities_1 = require("../data/commodities");
const safehouses_1 = require("../data/safehouses");
const locations_1 = require("../data/locations");
const messages_1 = require("./messages");
const progression_2 = require("./progression");
const money_1 = require("./money");
const random_1 = require("../utils/random");
const format_1 = require("../utils/format");
const MAX_PRICE_TIPS = 5;
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function getProgressFlags(state) {
    return state.missionProgress ?? {};
}
function withProgressFlags(state, flags) {
    return {
        ...state,
        missionProgress: { ...getProgressFlags(state), ...flags },
    };
}
function createMissionInstance(defId, day) {
    const def = missions_1.MISSION_MAP[defId];
    return {
        id: defId,
        status: 'active',
        progress: {},
        startedDay: day,
        deadlineDay: def?.deadlineDays ? day + def.deadlineDays : undefined,
        claimed: false,
    };
}
function countSafehouseCities(state) {
    const cities = new Set();
    for (const o of state.ownedSafehouses ?? []) {
        const def = safehouses_1.SAFEHOUSE_MAP[o.safehouseId];
        if (def)
            cities.add(def.cityId);
    }
    return cities.size;
}
function countActiveCrew(state) {
    return (state.hiredCrew ?? []).filter((c) => c.status === 'hired').length;
}
function computeRequirementProgress(state, key, instanceProgress) {
    switch (key) {
        case 'sales':
            return instanceProgress.sales ?? 0;
        case 'debt_paid':
            return instanceProgress.debt_paid ?? 0;
        case 'safehouses':
            return (state.ownedSafehouses ?? []).length;
        case 'safehouse_cities':
            return countSafehouseCities(state);
        case 'crew_hired':
            return Math.max(instanceProgress.crew_hired ?? 0, countActiveCrew(state));
        case 'crew_active':
            return countActiveCrew(state);
        case 'businesses':
            return (state.ownedBusinesses ?? []).length;
        case 'supplier_buys':
            return instanceProgress.supplier_buys ?? 0;
        case 'contracts':
            return instanceProgress.contracts ?? 0;
        case 'heat_max':
            return state.player.heat;
        case 'elite': {
            const repOk = state.player.reputation >= 50;
            const rankOk = rankIndex(state.progression.rankId) >= rankIndex('plug');
            return repOk || rankOk ? 1 : 0;
        }
        default:
            return instanceProgress[key] ?? 0;
    }
}
function isMissionComplete(state, instance) {
    const def = missions_1.MISSION_MAP[instance.id];
    if (!def)
        return false;
    return def.requirements.every((req) => {
        if (req.key === 'heat_max') {
            return state.player.heat < req.target;
        }
        if (req.key === 'elite') {
            const repOk = state.player.reputation >= (req.minReputation ?? 50);
            const rankOk = req.minRank != null &&
                rankIndex(state.progression.rankId) >= rankIndex(req.minRank);
            return repOk || rankOk;
        }
        const current = computeRequirementProgress(state, req.key, instance.progress);
        return current >= req.target;
    });
}
function applyRewards(state, rewards) {
    let player = state.player;
    let updated = { ...state, player };
    if (rewards.cash && rewards.cash > 0) {
        player = (0, money_1.addDirtyMoney)(player, rewards.cash);
        updated = { ...updated, player };
    }
    if (rewards.reputation && rewards.reputation > 0) {
        player = {
            ...player,
            reputation: (0, random_1.clamp)(player.reputation + rewards.reputation, 0, 100),
        };
        updated = { ...updated, player };
    }
    if (rewards.heatReduction && rewards.heatReduction > 0) {
        player = {
            ...player,
            heat: (0, random_1.clamp)(player.heat - rewards.heatReduction, 0, 100),
        };
        updated = { ...updated, player };
    }
    if (rewards.supplierTrust && rewards.supplierTrust > 0) {
        const rels = { ...(updated.supplierRelationships ?? {}) };
        for (const id of Object.keys(rels)) {
            rels[id] = {
                ...rels[id],
                trust: (0, random_1.clamp)((rels[id].trust ?? 50) + rewards.supplierTrust, 0, 100),
            };
        }
        updated = { ...updated, supplierRelationships: rels };
    }
    if (rewards.crewLoyalty && rewards.crewLoyalty > 0) {
        updated = {
            ...updated,
            hiredCrew: (updated.hiredCrew ?? []).map((c) => c.status === 'hired'
                ? { ...c, loyalty: (0, random_1.clamp)(c.loyalty + rewards.crewLoyalty, 0, 100) }
                : c),
        };
    }
    if (rewards.priceTipCommodity &&
        rewards.priceTipCityId &&
        rewards.priceTipDirection) {
        const tip = {
            id: `tip_${updated.player.day}_${rewards.priceTipCommodity}`,
            commodityId: rewards.priceTipCommodity,
            cityId: rewards.priceTipCityId,
            direction: rewards.priceTipDirection,
            expiresDay: updated.player.day + 2,
        };
        updated = {
            ...updated,
            activePriceTips: [...(updated.activePriceTips ?? []), tip].slice(-MAX_PRICE_TIPS),
        };
    }
    return updated;
}
function completeMission(state, instance) {
    const def = missions_1.MISSION_MAP[instance.id];
    if (!def)
        return state;
    const completed = {
        ...instance,
        status: 'completed',
        completedDay: state.player.day,
    };
    const activeMissions = (state.activeMissions ?? []).filter((m) => m.id !== instance.id);
    const completedMissions = [...(state.completedMissions ?? []), completed].slice(-missions_1.MAX_COMPLETED_MISSIONS);
    let updated = {
        ...state,
        activeMissions,
        completedMissions,
    };
    const messages = [`Mission complete: ${def.title}! Claim your reward.`];
    if (def.nextMissionId && missions_1.MISSION_MAP[def.nextMissionId]) {
        const next = createMissionInstance(def.nextMissionId, state.player.day);
        updated = {
            ...updated,
            activeMissions: [...(updated.activeMissions ?? []), next],
        };
        messages.push(`New objective: ${missions_1.MISSION_MAP[def.nextMissionId].title}`);
    }
    else if (def.chainId) {
        updated = advanceToNextArc(updated, def.chainId);
    }
    return (0, messages_1.withMessages)(updated, messages);
}
function advanceToNextArc(state, completedArc) {
    const idx = missions_1.STORY_ARC_ORDER.indexOf(completedArc);
    const nextArc = idx >= 0 && idx < missions_1.STORY_ARC_ORDER.length - 1 ? missions_1.STORY_ARC_ORDER[idx + 1] : null;
    if (!nextArc) {
        return (0, messages_1.withMessage)(state, `${missions_1.STORY_ARC_LABELS[completedArc]} arc complete!`);
    }
    const startId = missions_1.CHAIN_START_MISSION[nextArc];
    const alreadyActive = (state.activeMissions ?? []).some((m) => m.id === startId);
    const alreadyDone = (state.completedMissions ?? []).some((m) => m.id === startId);
    if (alreadyActive || alreadyDone) {
        return { ...state, currentStoryArc: nextArc };
    }
    const next = createMissionInstance(startId, state.player.day);
    return (0, messages_1.withMessage)({
        ...state,
        currentStoryArc: nextArc,
        activeMissions: [...(state.activeMissions ?? []), next],
    }, `${missions_1.STORY_ARC_LABELS[nextArc]} arc unlocked: ${missions_1.MISSION_MAP[startId]?.title ?? nextArc}.`);
}
function failMission(state, instance) {
    const def = missions_1.MISSION_MAP[instance.id];
    const failed = { ...instance, status: 'failed' };
    return (0, messages_1.withMessage)({
        ...state,
        activeMissions: (state.activeMissions ?? []).filter((m) => m.id !== instance.id),
        failedMissions: [...(state.failedMissions ?? []), failed].slice(-missions_1.MAX_FAILED_MISSIONS),
    }, def ? `Mission failed: ${def.title}.` : 'Mission failed.');
}
function evaluateActiveMissions(state) {
    let updated = state;
    for (const instance of [...(state.activeMissions ?? [])]) {
        if (instance.status !== 'active' || instance.claimed)
            continue;
        if (instance.deadlineDay != null && state.player.day > instance.deadlineDay) {
            updated = failMission(updated, instance);
            continue;
        }
        if (isMissionComplete(updated, instance)) {
            updated = completeMission(updated, instance);
        }
    }
    return updated;
}
function bumpMissionProgress(state, key, amount) {
    const activeMissions = (state.activeMissions ?? []).map((m) => {
        const def = missions_1.MISSION_MAP[m.id];
        if (!def?.requirements.some((r) => r.key === key))
            return m;
        return {
            ...m,
            progress: {
                ...m.progress,
                [key]: (m.progress[key] ?? 0) + amount,
            },
        };
    });
    return { ...state, activeMissions };
}
function bumpDailyProgress(state, type, amount) {
    const dailyObjectives = (state.dailyObjectives ?? []).map((obj) => {
        if (obj.claimed || obj.type !== type)
            return obj;
        return { ...obj, progress: Math.min(obj.target, obj.progress + amount) };
    });
    return { ...state, dailyObjectives };
}
function bumpDailyProgressForDrug(state, commodityId, quantity) {
    const dailyObjectives = (state.dailyObjectives ?? []).map((obj) => {
        if (obj.claimed || obj.type !== 'sell_drug')
            return obj;
        if (obj.commodityId && obj.commodityId !== commodityId)
            return obj;
        return { ...obj, progress: Math.min(obj.target, obj.progress + quantity) };
    });
    return { ...state, dailyObjectives };
}
function evaluateDailyObjectives(state) {
    const flags = getProgressFlags(state);
    let dailyObjectives = [...(state.dailyObjectives ?? [])];
    dailyObjectives = dailyObjectives.map((obj) => {
        if (obj.claimed || obj.progress >= obj.target)
            return obj;
        let progress = obj.progress;
        switch (obj.type) {
            case 'make_profit':
                progress = flags.profitToday ?? 0;
                break;
            case 'lower_heat':
                if (flags.heatStartOfDay != null) {
                    progress = Math.max(0, flags.heatStartOfDay - state.player.heat);
                }
                break;
            case 'avoid_police':
                progress = flags.policeEncounterToday ? 0 : obj.progress;
                break;
            case 'travel_city':
                progress = (flags.citiesVisitedToday ?? []).length >= 1 ? 1 : obj.progress;
                break;
            case 'complete_deal':
                progress = flags.dealsToday ?? 0;
                break;
            default:
                break;
        }
        return { ...obj, progress: Math.min(obj.target, progress) };
    });
    return { ...state, dailyObjectives };
}
function pickDailyTemplate(state) {
    const day = state.player.day;
    const pool = [
        () => ({
            id: `daily_profit_${day}_${(0, random_1.randomInt)(100, 999)}`,
            type: 'make_profit',
            title: 'Turn A Profit',
            description: `Make $${500 + (0, random_1.randomInt)(0, 4) * 200} profit today.`,
            target: 500 + (0, random_1.randomInt)(0, 4) * 200,
            progress: 0,
            rewards: { cash: 250 + (0, random_1.randomInt)(0, 3) * 60, reputation: 1 },
            claimed: false,
            generatedDay: day,
        }),
        () => {
            const city = (0, random_1.pickRandom)(locations_1.CITIES.filter((c) => c.id !== state.player.currentCityId)) ?? locations_1.CITIES[0];
            return {
                id: `daily_travel_${day}_${city.id}`,
                type: 'travel_city',
                title: 'Expand Routes',
                description: `Travel to ${city.name} today.`,
                target: 1,
                progress: 0,
                rewards: { cash: 180, reputation: 1 },
                claimed: false,
                generatedDay: day,
                cityId: city.id,
            };
        },
        () => ({
            id: `daily_deal_${day}`,
            type: 'complete_deal',
            title: 'Close A Deal',
            description: 'Complete a supplier buy or buyer contract today.',
            target: 1,
            progress: 0,
            rewards: { cash: 250, supplierTrust: 3 },
            claimed: false,
            generatedDay: day,
        }),
        () => ({
            id: `daily_heat_${day}`,
            type: 'lower_heat',
            title: 'Stay Cool',
            description: 'Drop heat by at least 5 points today.',
            target: 5,
            progress: 0,
            rewards: { heatReduction: 4, reputation: 1 },
            claimed: false,
            generatedDay: day,
        }),
        () => {
            const drug = (0, random_1.pickRandom)(commodities_1.COMMODITIES) ?? commodities_1.COMMODITIES[0];
            return {
                id: `daily_sell_${day}_${drug.id}`,
                type: 'sell_drug',
                title: `Move ${drug.name}`,
                description: `Sell ${5 + (0, random_1.randomInt)(0, 3) * 5} units of ${drug.name} today.`,
                target: 5 + (0, random_1.randomInt)(0, 3) * 5,
                progress: 0,
                rewards: {
                    cash: 180,
                    priceTipCommodity: drug.id,
                    priceTipCityId: state.player.currentCityId,
                    priceTipDirection: 'sell',
                },
                claimed: false,
                generatedDay: day,
                commodityId: drug.id,
            };
        },
        () => ({
            id: `daily_supplier_${day}`,
            type: 'visit_supplier',
            title: 'Supplier Run',
            description: 'Buy from a supplier today.',
            target: 1,
            progress: 0,
            rewards: { cash: 120, supplierTrust: 4 },
            claimed: false,
            generatedDay: day,
        }),
        () => ({
            id: `daily_debt_${day}`,
            type: 'pay_debt',
            title: 'Feed The Shark',
            description: `Pay $${300 + (0, random_1.randomInt)(0, 4) * 100} toward debt today.`,
            target: 300 + (0, random_1.randomInt)(0, 4) * 100,
            progress: 0,
            rewards: { cash: 100, reputation: 2 },
            claimed: false,
            generatedDay: day,
        }),
        () => ({
            id: `daily_avoid_${day}`,
            type: 'avoid_police',
            title: 'Ghost Mode',
            description: 'End the day without a police encounter.',
            target: 1,
            progress: 0,
            rewards: { heatReduction: 3, cash: 150 },
            claimed: false,
            generatedDay: day,
        }),
        () => ({
            id: `daily_stash_${day}`,
            type: 'deposit_safehouse',
            title: 'Store Product',
            description: 'Deposit at least 10 units into property storage today.',
            target: 10,
            progress: 0,
            rewards: { cash: 160, reputation: 1 },
            claimed: false,
            generatedDay: day,
        }),
    ];
    const available = (state.ownedSafehouses ?? []).length > 0
        ? pool
        : pool.filter((fn) => {
            const sample = fn();
            return sample.type !== 'deposit_safehouse';
        });
    return (0, random_1.pickRandom)(available)();
}
function syncMissionState(state) {
    let updated = evaluateActiveMissions(state);
    updated = evaluateDailyObjectives(updated);
    return updated;
}
function trackMissionEvent(state, event) {
    let updated = state;
    switch (event.kind) {
        case 'sell':
            updated = bumpMissionProgress(updated, 'sales', 1);
            if (event.profit > 0) {
                const flags = getProgressFlags(updated);
                updated = withProgressFlags(updated, {
                    profitToday: (flags.profitToday ?? 0) + event.profit,
                });
            }
            break;
        case 'buy_supplier':
            updated = bumpMissionProgress(updated, 'supplier_buys', 1);
            updated = bumpDailyProgress(updated, 'complete_deal', 1);
            updated = bumpDailyProgress(updated, 'visit_supplier', 1);
            {
                const flags = getProgressFlags(updated);
                updated = withProgressFlags(updated, {
                    dealsToday: (flags.dealsToday ?? 0) + 1,
                });
            }
            break;
        case 'fulfill_contract':
            updated = bumpMissionProgress(updated, 'contracts', 1);
            updated = bumpDailyProgress(updated, 'complete_deal', 1);
            {
                const flags = getProgressFlags(updated);
                updated = withProgressFlags(updated, {
                    dealsToday: (flags.dealsToday ?? 0) + 1,
                });
            }
            break;
        case 'travel_city': {
            updated = bumpDailyProgress(updated, 'travel_city', 1);
            const flags = getProgressFlags(updated);
            const visited = new Set(flags.citiesVisitedToday ?? []);
            visited.add(event.cityId);
            updated = withProgressFlags(updated, { citiesVisitedToday: [...visited] });
            break;
        }
        case 'pay_debt':
            updated = bumpMissionProgress(updated, 'debt_paid', event.amount);
            updated = bumpDailyProgress(updated, 'pay_debt', event.amount);
            break;
        case 'hire_crew':
            updated = bumpMissionProgress(updated, 'crew_hired', 1);
            break;
        case 'deposit_safehouse':
            updated = bumpDailyProgress(updated, 'deposit_safehouse', event.quantity);
            break;
        case 'visit_supplier':
            updated = bumpDailyProgress(updated, 'visit_supplier', 1);
            break;
        case 'police_encounter':
            updated = withProgressFlags(updated, { policeEncounterToday: true });
            break;
        default:
            break;
    }
    if (event.kind === 'sell' && event.commodityId) {
        updated = bumpDailyProgressForDrug(updated, event.commodityId, event.quantity);
    }
    updated = evaluateActiveMissions(updated);
    updated = evaluateDailyObjectives(updated);
    return updated;
}
function generateDailyObjectives(state) {
    const day = state.player.day;
    const existing = (state.dailyObjectives ?? []).filter((o) => o.generatedDay === day);
    if (existing.length >= missions_1.DAILY_OBJECTIVE_COUNT) {
        return state;
    }
    const usedTypes = new Set(existing.map((o) => o.type));
    const objectives = [...existing];
    let attempts = 0;
    while (objectives.length < missions_1.DAILY_OBJECTIVE_COUNT && attempts < 30) {
        attempts += 1;
        const candidate = pickDailyTemplate(state);
        if (usedTypes.has(candidate.type) && usedTypes.size < 6)
            continue;
        if (objectives.some((o) => o.id === candidate.id))
            continue;
        usedTypes.add(candidate.type);
        objectives.push(candidate);
    }
    return {
        ...state,
        dailyObjectives: objectives,
        missionProgress: {
            ...getProgressFlags(state),
            profitToday: 0,
            policeEncounterToday: false,
            citiesVisitedToday: [],
            dealsToday: 0,
            heatStartOfDay: state.player.heat,
        },
    };
}
function tickMissionsOnDayAdvance(state) {
    let updated = evaluateActiveMissions(state);
    const flags = getProgressFlags(updated);
    const endedDay = updated.player.day - 1;
    if (endedDay >= 1 && !flags.policeEncounterToday) {
        updated = {
            ...updated,
            dailyObjectives: (updated.dailyObjectives ?? []).map((obj) => {
                if (obj.type === 'avoid_police' &&
                    obj.generatedDay === endedDay &&
                    !obj.claimed &&
                    obj.progress < obj.target) {
                    return { ...obj, progress: obj.target };
                }
                return obj;
            }),
        };
    }
    const expiredTips = (updated.activePriceTips ?? []).filter((t) => t.expiresDay > updated.player.day);
    updated = { ...updated, activePriceTips: expiredTips };
    updated = generateDailyObjectives(updated);
    return updated;
}
function claimMissionReward(state, missionId) {
    const instance = (state.completedMissions ?? []).find((m) => m.id === missionId);
    if (!instance) {
        return (0, messages_1.withMessage)(state, 'Mission not found or not complete.');
    }
    if (instance.claimed) {
        return (0, messages_1.withMessage)(state, 'Reward already claimed.');
    }
    const def = missions_1.MISSION_MAP[missionId];
    if (!def)
        return (0, messages_1.withMessage)(state, 'Unknown mission.');
    const claimed = { ...instance, claimed: true };
    let updated = applyRewards(state, def.rewards);
    updated = {
        ...updated,
        completedMissions: (updated.completedMissions ?? []).map((m) => m.id === missionId ? claimed : m),
    };
    return (0, progression_2.applyProgressionAfterAction)((0, messages_1.withMessage)(updated, `Claimed reward for "${def.title}".`));
}
function claimDailyObjective(state, objectiveId) {
    const obj = (state.dailyObjectives ?? []).find((o) => o.id === objectiveId);
    if (!obj)
        return (0, messages_1.withMessage)(state, 'Objective not found.');
    if (obj.claimed)
        return (0, messages_1.withMessage)(state, 'Already claimed.');
    if (obj.progress < obj.target) {
        return (0, messages_1.withMessage)(state, 'Objective not complete yet.');
    }
    let updated = applyRewards(state, obj.rewards);
    updated = {
        ...updated,
        dailyObjectives: (updated.dailyObjectives ?? []).map((o) => o.id === objectiveId ? { ...o, claimed: true } : o),
    };
    return (0, progression_2.applyProgressionAfterAction)((0, messages_1.withMessage)(updated, `Daily objective complete: ${obj.title}!`));
}
function getCurrentStoryMission(state) {
    const arc = state.currentStoryArc;
    if (!arc)
        return undefined;
    return (state.activeMissions ?? []).find((m) => {
        const def = missions_1.MISSION_MAP[m.id];
        return def?.chainId === arc && m.status === 'active';
    });
}
function initializeMissionState(state) {
    const startId = missions_1.CHAIN_START_MISSION.street_starter;
    const first = createMissionInstance(startId, state.player.day);
    let updated = {
        ...state,
        missions: missions_1.STORY_MISSIONS.map((d) => d.id),
        activeMissions: [first],
        completedMissions: [],
        failedMissions: [],
        dailyObjectives: [],
        currentStoryArc: 'street_starter',
        missionProgress: {},
        activePriceTips: [],
    };
    updated = generateDailyObjectives(updated);
    return updated;
}
function createDefaultMissionState() {
    return {
        missions: missions_1.STORY_MISSIONS.map((d) => d.id),
        activeMissions: [],
        completedMissions: [],
        failedMissions: [],
        dailyObjectives: [],
        currentStoryArc: null,
        missionProgress: {},
        activePriceTips: [],
    };
}
function migrateMissionInstances(raw) {
    if (!Array.isArray(raw))
        return [];
    const result = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        const id = typeof e.id === 'string' ? e.id : '';
        if (!missions_1.MISSION_MAP[id])
            continue;
        const statusRaw = typeof e.status === 'string' ? e.status : 'active';
        const status = ['available', 'active', 'completed', 'failed'].includes(statusRaw)
            ? statusRaw
            : 'active';
        const progress = {};
        if (typeof e.progress === 'object' && e.progress !== null) {
            for (const [k, v] of Object.entries(e.progress)) {
                if (typeof v === 'number')
                    progress[k] = v;
            }
        }
        result.push({
            id,
            status,
            progress,
            startedDay: typeof e.startedDay === 'number' ? e.startedDay : 1,
            deadlineDay: typeof e.deadlineDay === 'number' ? e.deadlineDay : undefined,
            claimed: e.claimed === true,
            completedDay: typeof e.completedDay === 'number' ? e.completedDay : undefined,
        });
    }
    return result;
}
function migrateDailyObjectives(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((e) => typeof e === 'object' && e !== null)
        .map((e, i) => ({
        id: typeof e.id === 'string' ? e.id : `daily_${i}`,
        type: (typeof e.type === 'string' ? e.type : 'make_profit'),
        title: typeof e.title === 'string' ? e.title : 'Objective',
        description: typeof e.description === 'string' ? e.description : '',
        target: typeof e.target === 'number' ? e.target : 1,
        progress: typeof e.progress === 'number' ? e.progress : 0,
        rewards: typeof e.rewards === 'object' && e.rewards !== null
            ? e.rewards
            : {},
        claimed: e.claimed === true,
        generatedDay: typeof e.generatedDay === 'number' ? e.generatedDay : 1,
        commodityId: typeof e.commodityId === 'string'
            ? e.commodityId
            : undefined,
        cityId: typeof e.cityId === 'string' ? e.cityId : undefined,
    }))
        .slice(0, missions_1.DAILY_OBJECTIVE_COUNT * 3);
}
function migratePriceTips(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((e) => typeof e === 'object' && e !== null)
        .map((e, i) => ({
        id: typeof e.id === 'string' ? e.id : `tip_${i}`,
        commodityId: typeof e.commodityId === 'string' ? e.commodityId : 'weed',
        cityId: typeof e.cityId === 'string' ? e.cityId : 'new_york',
        direction: (e.direction === 'buy' ? 'buy' : 'sell'),
        expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 1,
    }))
        .slice(-MAX_PRICE_TIPS);
}
function migrateMissionProgress(raw) {
    if (typeof raw !== 'object' || raw === null)
        return {};
    const e = raw;
    return {
        debtPaidTotal: typeof e.debtPaidTotal === 'number' ? e.debtPaidTotal : undefined,
        profitToday: typeof e.profitToday === 'number' ? e.profitToday : undefined,
        policeEncounterToday: e.policeEncounterToday === true,
        heatStartOfDay: typeof e.heatStartOfDay === 'number' ? e.heatStartOfDay : undefined,
        citiesVisitedToday: Array.isArray(e.citiesVisitedToday)
            ? e.citiesVisitedToday.filter((c) => typeof c === 'string')
            : undefined,
        dealsToday: typeof e.dealsToday === 'number' ? e.dealsToday : undefined,
    };
}
function getMissionProgressLabel(state, instance) {
    return getMissionProgressWidgetText(state, instance);
}
function getMissionProgressWidgetText(state, instance) {
    const def = missions_1.MISSION_MAP[instance.id];
    if (!def || def.requirements.length === 0)
        return '';
    const req = def.requirements[0];
    const current = computeRequirementProgress(state, req.key, instance.progress);
    const capped = Math.min(current, req.target);
    switch (req.key) {
        case 'debt_paid':
            return `Debt paid ${(0, format_1.formatMoney)(capped)} / ${(0, format_1.formatMoney)(req.target)}`;
        case 'crew_hired':
            return `Hire crew (${capped}/${req.target})`;
        case 'crew_active':
            return `Active crew (${capped}/${req.target})`;
        case 'safehouses':
            return `Buy property (${capped}/${req.target})`;
        case 'safehouse_cities':
            return `Properties in cities (${capped}/${req.target})`;
        case 'sales':
            return `Street sales (${capped}/${req.target})`;
        case 'supplier_buys':
            return `Supplier deals (${capped}/${req.target})`;
        case 'contracts':
            return `Contracts fulfilled (${capped}/${req.target})`;
        case 'businesses':
            return `Businesses owned (${capped}/${req.target})`;
        case 'heat_max':
            return `Heat ${state.player.heat} (need <${req.target})`;
        case 'elite':
            return `Rep ${state.player.reputation}/50 or Plug rank`;
        default:
            return `${capped}/${req.target}`;
    }
}
function isStoryCampaignComplete(state) {
    return state.currentStoryArc == null;
}
function getDailyProgressLabel(obj) {
    return `${Math.min(obj.progress, obj.target)}/${obj.target}`;
}
function getActivePriceTips(state) {
    return (state.activePriceTips ?? []).filter((t) => t.expiresDay >= state.player.day);
}
function formatPriceTip(tip) {
    const name = commodities_1.COMMODITY_MAP[tip.commodityId]?.name ?? tip.commodityId;
    const city = locations_1.CITY_MAP[tip.cityId]?.name ?? tip.cityId;
    return tip.direction === 'sell'
        ? `Sell ${name} in ${city} — prices hot`
        : `Buy ${name} in ${city} — prices low`;
}
