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
const worldEvents_1 = require("../data/worldEvents");
const random_1 = require("../utils/random");
const weightedRandom_1 = require("../utils/weightedRandom");
const messages_1 = require("./messages");
function eventAppliesToLocation(event, locationId) {
    return (event.affectedLocations.length === 0 ||
        event.affectedLocations.includes(locationId));
}
function eventAppliesToCommodity(event, commodityId) {
    return (event.affectedCommodities.length === 0 ||
        event.affectedCommodities.includes(commodityId));
}
function eventAppliesToPrice(event, locationId, commodityId) {
    if (event.priceMultiplier === 1)
        return false;
    if (event.affectedCommodities.length === 0)
        return false;
    return (eventAppliesToLocation(event, locationId) &&
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
/** Roll for a new world event after day advance. */
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
    const next = {};
    for (const location of locations_1.LOCATIONS) {
        next[location.id] = {};
        for (const commodity of commodities_1.COMMODITIES) {
            const base = prices[location.id]?.[commodity.id] ?? 0;
            let combinedMultiplier = 1;
            for (const event of events) {
                if (eventAppliesToPrice(event, location.id, commodity.id)) {
                    combinedMultiplier *= event.priceMultiplier;
                }
            }
            next[location.id][commodity.id] = Math.max(1, Math.round(base * combinedMultiplier));
        }
    }
    return next;
}
function getCombinedHeatMultiplier(state, locationId) {
    const loc = locationId ?? state.player.currentLocation;
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
function isTravelBlocked(state, locationId) {
    for (const event of getActiveEvents(state)) {
        if (event.type !== 'airport_lockdown')
            continue;
        if (locationId === 'airport' && eventAppliesToLocation(event, 'airport')) {
            return {
                blocked: true,
                reason: 'Airport lockdown — terminal sealed. Try again when it lifts.',
            };
        }
    }
    return { blocked: false };
}
function getActiveWorldEventsForLocation(state, locationId) {
    return getActiveEvents(state).filter((ev) => eventAppliesToLocation(ev, locationId));
}
function scalePositiveHeat(delta, multiplier) {
    if (delta <= 0 || multiplier === 1)
        return delta;
    return Math.round(delta * multiplier);
}
