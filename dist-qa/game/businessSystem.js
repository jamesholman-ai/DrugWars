"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetsBusinessUnlock = meetsBusinessUnlock;
exports.isBusinessOwned = isBusinessOwned;
exports.getBusinessesAtLocation = getBusinessesAtLocation;
exports.getOwnedBusinessRecord = getOwnedBusinessRecord;
exports.getTotalPassiveIncome = getTotalPassiveIncome;
exports.getTotalLaunderingCapacity = getTotalLaunderingCapacity;
exports.getTotalBusinessUpkeep = getTotalBusinessUpkeep;
exports.getTotalBusinessHeatReduction = getTotalBusinessHeatReduction;
exports.getAverageBusinessRisk = getAverageBusinessRisk;
exports.purchaseBusiness = purchaseBusiness;
exports.repairBusiness = repairBusiness;
exports.tickBusinessesOnDayAdvance = tickBusinessesOnDayAdvance;
exports.createDefaultBusinessState = createDefaultBusinessState;
exports.migrateOwnedBusinesses = migrateOwnedBusinesses;
exports.migrateBusinessHistory = migrateBusinessHistory;
exports.migrateBusinessRaids = migrateBusinessRaids;
exports.migrateDaySummary = migrateDaySummary;
const businesses_1 = require("../data/businesses");
const progression_1 = require("../data/progression");
const progression_2 = require("./progression");
const messages_1 = require("./messages");
const progression_3 = require("./progression");
const random_1 = require("../utils/random");
const money_1 = require("./money");
const missionSystem_1 = require("./missionSystem");
const crewBonuses_1 = require("./crewBonuses");
const safehouseSystem_1 = require("./safehouseSystem");
const MAX_HISTORY = 25;
const MAX_RAIDS = 10;
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function conditionMult(condition) {
    if (condition <= 0)
        return 0;
    return (0, random_1.clamp)(condition / 100, 0.1, 1);
}
function meetsBusinessUnlock(state, def) {
    if (!(0, progression_2.isCityUnlocked)(state, def.cityId))
        return false;
    if (def.requiredRank && rankIndex(state.progression.rankId) < rankIndex(def.requiredRank)) {
        return false;
    }
    if (def.requiredReputation != null && state.player.reputation < def.requiredReputation) {
        return false;
    }
    return true;
}
function isBusinessOwned(state, businessId) {
    return (state.ownedBusinesses ?? []).some((b) => b.businessId === businessId);
}
function getBusinessesAtLocation(state, cityId, areaId) {
    return businesses_1.BUSINESSES.filter((b) => b.cityId === cityId && b.areaId === areaId);
}
function getOwnedBusinessRecord(state, businessId) {
    return (state.ownedBusinesses ?? []).find((b) => b.businessId === businessId);
}
function getTotalPassiveIncome(state) {
    let total = 0;
    for (const owned of state.ownedBusinesses ?? []) {
        const def = businesses_1.BUSINESS_MAP[owned.businessId];
        if (!def || owned.condition <= 0)
            continue;
        total += Math.round(def.dailyIncome * conditionMult(owned.condition));
    }
    return total;
}
function getTotalLaunderingCapacity(state) {
    let total = 0;
    for (const owned of state.ownedBusinesses ?? []) {
        const def = businesses_1.BUSINESS_MAP[owned.businessId];
        if (!def || owned.condition <= 0)
            continue;
        total += Math.round(def.launderingCapacityPerDay * conditionMult(owned.condition));
    }
    return total;
}
function getTotalBusinessUpkeep(state) {
    let total = 0;
    for (const owned of state.ownedBusinesses ?? []) {
        const def = businesses_1.BUSINESS_MAP[owned.businessId];
        if (!def || owned.condition <= 0)
            continue;
        total += def.upkeepPerDay;
    }
    return total;
}
function getTotalBusinessHeatReduction(state) {
    let total = 0;
    for (const owned of state.ownedBusinesses ?? []) {
        const def = businesses_1.BUSINESS_MAP[owned.businessId];
        if (!def || owned.condition <= 0)
            continue;
        total += Math.round(def.heatReductionPerDay * conditionMult(owned.condition));
    }
    return total;
}
function getAverageBusinessRisk(state) {
    const owned = state.ownedBusinesses ?? [];
    if (owned.length === 0)
        return 0;
    let sum = 0;
    let count = 0;
    for (const o of owned) {
        const def = businesses_1.BUSINESS_MAP[o.businessId];
        if (!def)
            continue;
        sum += def.riskLevel;
        count++;
    }
    return count ? Math.round((sum / count) * 10) / 10 : 0;
}
function purchaseBusiness(state, businessId) {
    const def = businesses_1.BUSINESS_MAP[businessId];
    if (!def)
        return (0, messages_1.withMessage)(state, 'Unknown business.');
    if (isBusinessOwned(state, businessId)) {
        return (0, messages_1.withMessage)(state, 'You already own this business.');
    }
    if (!meetsBusinessUnlock(state, def)) {
        return (0, messages_1.withMessage)(state, 'Requirements not met for this business.');
    }
    const { player } = state;
    if (player.currentCityId !== def.cityId || player.currentAreaId !== def.areaId) {
        return (0, messages_1.withMessage)(state, 'Must be on-site to purchase this business.');
    }
    const afterSpend = (0, money_1.spendMoney)(player, def.purchaseCost, true);
    if (!afterSpend) {
        return (0, messages_1.withMessage)(state, `Need $${def.purchaseCost} (clean cash preferred). You have $${player.cash}.`);
    }
    const owned = {
        businessId,
        purchasedDay: player.day,
        condition: 100,
        upkeepMissedDays: 0,
    };
    const history = [
        ...(state.businessHistory ?? []),
        { businessId, name: def.name, event: 'Purchased', day: player.day },
    ].slice(-MAX_HISTORY);
    return (0, progression_3.applyProgressionAfterAction)((0, missionSystem_1.trackMissionEvent)((0, messages_1.withMessage)({
        ...state,
        player: afterSpend,
        ownedBusinesses: [...(state.ownedBusinesses ?? []), owned],
        businessHistory: history,
    }, `Acquired ${def.name} for $${def.purchaseCost}. Income $${def.dailyIncome}/day · Launder $${def.launderingCapacityPerDay}/day.`), { kind: 'purchase_business' }));
}
function repairBusiness(state, businessId) {
    const owned = getOwnedBusinessRecord(state, businessId);
    const def = businesses_1.BUSINESS_MAP[businessId];
    if (!owned || !def)
        return (0, messages_1.withMessage)(state, 'Business not found.');
    if (owned.condition >= 100) {
        return (0, messages_1.withMessage)(state, `${def.name} is in good condition.`);
    }
    const afterSpend = (0, money_1.spendMoney)(state.player, businesses_1.BUSINESS_REPAIR_COST, true);
    if (!afterSpend) {
        return (0, messages_1.withMessage)(state, `Repair costs $${businesses_1.BUSINESS_REPAIR_COST}.`);
    }
    const next = (state.ownedBusinesses ?? []).map((b) => b.businessId === businessId
        ? { ...b, condition: (0, random_1.clamp)(b.condition + 35, 0, 100), upkeepMissedDays: 0 }
        : b);
    return (0, messages_1.withMessage)({ ...state, player: afterSpend, ownedBusinesses: next }, `Repaired ${def.name} (+35 condition).`);
}
function rollBusinessRaids(state, random) {
    const owned = state.ownedBusinesses ?? [];
    if (owned.length === 0)
        return { state, raids: [], dirtySeized: 0 };
    const heat = state.player.heat;
    const crackdown = state.activeWorldEvents.some((e) => e.type === 'police_crackdown');
    let raidChance = 0;
    if (heat >= 85)
        raidChance = 0.22;
    else if (heat >= 70)
        raidChance = 0.12;
    else if (heat >= 55)
        raidChance = 0.05;
    if (crackdown)
        raidChance += 0.15;
    if (random() > raidChance)
        return { state, raids: [], dirtySeized: 0 };
    const target = owned[Math.floor(random() * owned.length)];
    const def = businesses_1.BUSINESS_MAP[target.businessId];
    if (!def)
        return { state, raids: [], dirtySeized: 0 };
    const damage = random() < 0.5 ? 15 : 25;
    const seized = Math.min(state.player.dirtyCash ?? 0, Math.round(400 + def.riskLevel * 120 * random()));
    let player = (0, money_1.seizeDirtyMoney)(state.player, seized);
    player = {
        ...player,
        heat: (0, random_1.clamp)(player.heat + Math.round(def.riskLevel * 1.5), 0, 100),
    };
    const nextOwned = (state.ownedBusinesses ?? []).map((b) => b.businessId === target.businessId
        ? {
            ...b,
            condition: (0, random_1.clamp)(b.condition - damage, 0, 100),
            upkeepMissedDays: b.upkeepMissedDays + 1,
        }
        : b);
    const raid = {
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
function tickBusinessesOnDayAdvance(state, random = Math.random) {
    const owned = state.ownedBusinesses ?? [];
    if (owned.length === 0) {
        return { ...state, lastDaySummary: buildPartialSummary(state, {}) };
    }
    let player = (0, money_1.normalizeMoneyFields)(state.player);
    let totalIncome = 0;
    let totalUpkeep = 0;
    let totalLaundered = 0;
    let totalHeatReduced = 0;
    let nextOwned = [];
    const logLines = [];
    for (const record of owned) {
        const def = businesses_1.BUSINESS_MAP[record.businessId];
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
        if (player.cash >= upkeep) {
            player = (0, money_1.spendMoney)(player, upkeep, true) ?? player;
            missed = 0;
            condition = (0, random_1.clamp)(condition + 1, 0, 100);
        }
        else {
            missed += 1;
            condition = (0, random_1.clamp)(condition - 10, 0, 100);
            logLines.push(`${def.name}: upkeep unpaid (−10 condition).`);
        }
        const income = Math.round(def.dailyIncome * mult);
        if (income > 0) {
            player = (0, money_1.addCleanMoney)(player, income);
            totalIncome += income;
        }
        const launderCap = Math.round(def.launderingCapacityPerDay * mult);
        if (launderCap > 0 && (player.dirtyCash ?? 0) > 0) {
            const launderAmt = Math.min(launderCap, player.dirtyCash ?? 0);
            player = (0, money_1.launderMoney)(player, launderAmt);
            totalLaundered += launderAmt;
        }
        const heatDrop = Math.round(def.heatReductionPerDay * mult);
        if (heatDrop > 0) {
            player = { ...player, heat: (0, random_1.clamp)(player.heat - heatDrop, 0, 100) };
            totalHeatReduced += heatDrop;
        }
        nextOwned.push({
            ...record,
            condition,
            upkeepMissedDays: missed,
        });
    }
    let updated = {
        ...state,
        player,
        ownedBusinesses: nextOwned,
    };
    const raidResult = rollBusinessRaids(updated, random);
    updated = raidResult.state;
    logLines.push(...raidResult.raids);
    const summary = {
        day: state.player.day,
        payroll: (0, crewBonuses_1.getDailyPayroll)(state),
        safehouseUpkeep: (0, safehouseSystem_1.getDailySafehouseUpkeep)(state),
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
    ].filter((l) => l != null);
    if (summaryLines.length > 0) {
        updated = (0, messages_1.withMessages)(updated, summaryLines);
    }
    return updated;
}
function buildPartialSummary(state, extra) {
    return {
        day: state.player.day,
        payroll: (0, crewBonuses_1.getDailyPayroll)(state),
        safehouseUpkeep: (0, safehouseSystem_1.getDailySafehouseUpkeep)(state),
        businessIncome: 0,
        businessUpkeep: 0,
        laundered: 0,
        heatReduced: 0,
        raids: [],
        ...extra,
    };
}
function createDefaultBusinessState() {
    return {
        ownedBusinesses: [],
        businessHistory: [],
        businessRaids: [],
        lastDaySummary: null,
    };
}
function migrateOwnedBusinesses(raw) {
    if (!Array.isArray(raw))
        return [];
    const result = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        const id = typeof e.businessId === 'string' ? e.businessId : '';
        if (!businesses_1.BUSINESS_MAP[id])
            continue;
        result.push({
            businessId: id,
            purchasedDay: typeof e.purchasedDay === 'number' ? e.purchasedDay : 1,
            condition: typeof e.condition === 'number' ? (0, random_1.clamp)(e.condition, 0, 100) : 100,
            upkeepMissedDays: typeof e.upkeepMissedDays === 'number' ? e.upkeepMissedDays : 0,
        });
    }
    return result;
}
function migrateBusinessHistory(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((e) => typeof e === 'object' && e !== null)
        .map((e, i) => ({
        businessId: typeof e.businessId === 'string' ? e.businessId : `biz_${i}`,
        name: typeof e.name === 'string' ? e.name : 'Business',
        event: typeof e.event === 'string' ? e.event : '',
        day: typeof e.day === 'number' ? e.day : 1,
    }))
        .slice(-MAX_HISTORY);
}
function migrateBusinessRaids(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .filter((e) => typeof e === 'object' && e !== null)
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
function migrateDaySummary(raw) {
    if (typeof raw !== 'object' || raw === null)
        return null;
    const e = raw;
    return {
        day: typeof e.day === 'number' ? e.day : 1,
        payroll: typeof e.payroll === 'number' ? e.payroll : 0,
        safehouseUpkeep: typeof e.safehouseUpkeep === 'number' ? e.safehouseUpkeep : 0,
        businessIncome: typeof e.businessIncome === 'number' ? e.businessIncome : 0,
        businessUpkeep: typeof e.businessUpkeep === 'number' ? e.businessUpkeep : 0,
        laundered: typeof e.laundered === 'number' ? e.laundered : 0,
        heatReduced: typeof e.heatReduced === 'number' ? e.heatReduced : 0,
        raids: Array.isArray(e.raids) ? e.raids.filter((r) => typeof r === 'string') : [],
    };
}
