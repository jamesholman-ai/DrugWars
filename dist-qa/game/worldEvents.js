"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventAppliesToLocation = eventAppliesToLocation;
exports.eventAppliesToCommodity = eventAppliesToCommodity;
exports.eventAppliesToPrice = eventAppliesToPrice;
exports.capActiveWorldEvents = capActiveWorldEvents;
exports.daysRemaining = daysRemaining;
exports.purgeExpiredWorldEvents = purgeExpiredWorldEvents;
exports.maybeRollWorldEvent = maybeRollWorldEvent;
exports.tickWorldEventsOnDayAdvance = tickWorldEventsOnDayAdvance;
exports.applyWorldEventsToPrices = applyWorldEventsToPrices;
exports.getCombinedHeatMultiplier = getCombinedHeatMultiplier;
exports.getWorldEventWeightMultiplier = getWorldEventWeightMultiplier;
exports.isTravelBlocked = isTravelBlocked;
exports.getActiveWorldEventsForLocation = getActiveWorldEventsForLocation;
exports.scalePositiveHeat = scalePositiveHeat;
const commodities_1 = require("../data/commodities");
const locations_1 = require("../data/locations");
const areas_1 = require("../data/areas");
const worldEvents_1 = require("../data/worldEvents");
const random_1 = require("../utils/random");
const weightedRandom_1 = require("../utils/weightedRandom");
const messages_1 = require("./messages");
function eventAppliesToLocation(event, areaKey) {
    if (event.affectedLocations.length === 0)
        return true;
    if (event.affectedLocations.includes(areaKey))
        return true;
    const parsed = (0, locations_1.parseAreaKey)(areaKey);
    if (!parsed)
        return false;
    return event.affectedLocations.some((loc) => {
        if (loc === parsed.areaId || loc === parsed.cityId)
            return true;
        if (loc.endsWith(`:${parsed.areaId}`))
            return true;
        return loc === areaKey;
    });
}
function eventAppliesToCommodity(event, commodityId) {
    return (event.affectedCommodities.length === 0 ||
        event.affectedCommodities.includes(commodityId));
}
function eventAppliesToPrice(event, areaKey, commodityId) {
    if (event.priceMultiplier === 1)
        return false;
    if (event.affectedCommodities.length === 0)
        return false;
    return (eventAppliesToLocation(event, areaKey) &&
        eventAppliesToCommodity(event, commodityId));
}
function getActiveEvents(state) {
    return state.activeWorldEvents ?? [];
}
function capActiveWorldEvents(events) {
    return events.slice(0, worldEvents_1.MAX_ACTIVE_WORLD_EVENTS);
}
function daysRemaining(event, currentDay) {
    return Math.max(0, event.expiresDay - currentDay);
}
function purgeExpiredWorldEvents(state) {
    const day = state.player.day;
    const current = getActiveEvents(state);
    const active = capActiveWorldEvents(current.filter((ev) => ev.expiresDay > day));
    if (active.length === current.length &&
        active.every((ev, index) => ev.id === current[index]?.id)) {
        return state;
    }
    return { ...state, activeWorldEvents: active };
}
function pickSeverity(random) {
    const picked = (0, weightedRandom_1.weightedPick)(worldEvents_1.SEVERITY_WEIGHTS.map((s) => ({ item: s.severity, weight: s.weight })), random);
    return picked ?? 'low';
}
function pickSubset(pool, count, random) {
    if (count <= 0 || pool.length === 0)
        return [];
    const shuffled = [...pool].sort(() => random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}
function spawnWorldEvent(template, startDay, random) {
    const severity = pickSeverity(random);
    const duration = template.durationBySeverity[severity];
    let affectedLocations = [];
    if (template.maxAffectedLocations === 0) {
        affectedLocations = [];
    }
    else if (template.locationPool.length === 1) {
        affectedLocations = [...template.locationPool];
    }
    else {
        const count = (0, random_1.randomInt)(1, template.maxAffectedLocations);
        affectedLocations = pickSubset(template.locationPool, count, random);
    }
    let affectedCommodities = [];
    if (template.maxAffectedCommodities === 0) {
        affectedCommodities = [];
    }
    else {
        const count = (0, random_1.randomInt)(1, template.maxAffectedCommodities);
        affectedCommodities = pickSubset(template.commodityPool, count, random);
    }
    return {
        id: `we_${startDay}_${template.type}_${(0, random_1.randomInt)(1000, 9999)}`,
        type: template.type,
        title: template.title,
        description: template.description,
        affectedLocations,
        affectedCommodities,
        durationDays: duration,
        priceMultiplier: template.priceMultiplierBySeverity[severity],
        heatMultiplier: template.heatMultiplierBySeverity[severity],
        eventWeightModifiers: template.eventWeightModifiersBySeverity[severity],
        startDay,
        expiresDay: startDay + duration,
        severity,
    };
}
function pickSpawnTemplate(state, random) {
    const activeTypes = new Set(getActiveEvents(state).map((e) => e.type));
    const candidates = worldEvents_1.WORLD_EVENT_TEMPLATES.filter((t) => !activeTypes.has(t.type));
    if (candidates.length === 0)
        return null;
    return (0, weightedRandom_1.weightedPick)(candidates.map((t) => ({ item: t, weight: t.spawnWeight })), random);
}
function maybeRollWorldEvent(state, random = Math.random) {
    const current = getActiveEvents(state);
    if (current.length >= worldEvents_1.MAX_ACTIVE_WORLD_EVENTS) {
        return state;
    }
    if (random() > worldEvents_1.WORLD_EVENT_ROLL_CHANCE) {
        return state;
    }
    const template = pickSpawnTemplate(state, random);
    if (!template) {
        return state;
    }
    const event = spawnWorldEvent(template, state.player.day, random);
    const severityLabel = event.severity.toUpperCase();
    return (0, messages_1.withMessages)({
        ...state,
        activeWorldEvents: capActiveWorldEvents([...current, event]),
    }, [
        `WORLD EVENT — ${event.title} (${severityLabel})`,
        `${event.description} (${event.durationDays} days)`,
    ]);
}
function tickWorldEventsOnDayAdvance(state, random = Math.random) {
    let updated = purgeExpiredWorldEvents(state);
    updated = maybeRollWorldEvent(updated, random);
    return updated;
}
function applyWorldEventsToPrices(prices, events) {
    if (events.length === 0) {
        return prices;
    }
    const next = { ...prices };
    const areaKeys = Object.keys(prices).length > 0 ? Object.keys(prices) : (0, locations_1.getAllAreaKeys)();
    for (const areaKey of areaKeys) {
        next[areaKey] = { ...(next[areaKey] ?? {}) };
        for (const commodity of commodities_1.COMMODITIES) {
            const base = prices[areaKey]?.[commodity.id] ?? next[areaKey][commodity.id] ?? 0;
            if (base <= 0)
                continue;
            let combinedMultiplier = 1;
            for (const event of events) {
                if (eventAppliesToPrice(event, areaKey, commodity.id)) {
                    combinedMultiplier *= event.priceMultiplier;
                }
            }
            next[areaKey][commodity.id] = Math.max(1, Math.round(base * combinedMultiplier));
        }
    }
    return next;
}
function getCombinedHeatMultiplier(state, areaKey) {
    const loc = areaKey ?? (0, locations_1.getPlayerAreaKey)(state.player);
    let mult = 1;
    for (const event of getActiveEvents(state)) {
        if (event.heatMultiplier === 1)
            continue;
        if (eventAppliesToLocation(event, loc)) {
            mult *= event.heatMultiplier;
        }
    }
    return mult;
}
function getWorldEventWeightMultiplier(state, eventType) {
    let mult = 1;
    for (const event of getActiveEvents(state)) {
        const mod = event.eventWeightModifiers[eventType];
        if (mod != null && mod !== 1) {
            mult *= mod;
        }
    }
    return mult;
}
function isTravelBlocked(state, areaKey) {
    const parsed = (0, locations_1.parseAreaKey)(areaKey);
    if (!parsed || !(0, areas_1.isAirportArea)(parsed.areaId)) {
        return { blocked: false };
    }
    for (const event of getActiveEvents(state)) {
        if (event.type !== 'airport_lockdown')
            continue;
        if (eventAppliesToLocation(event, areaKey)) {
            return {
                blocked: true,
                reason: 'Airport lockdown — terminal sealed. Try again when it lifts.',
            };
        }
    }
    return { blocked: false };
}
function getActiveWorldEventsForLocation(state, areaKey) {
    return getActiveEvents(state).filter((ev) => eventAppliesToLocation(ev, areaKey));
}
function scalePositiveHeat(delta, multiplier) {
    if (delta <= 0 || multiplier === 1)
        return delta;
    return Math.round(delta * multiplier);
}
