"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultTutorial = createDefaultTutorial;
exports.isTutorialActive = isTutorialActive;
exports.advanceTutorialStep = advanceTutorialStep;
exports.skipTutorial = skipTutorial;
exports.migrateTutorial = migrateTutorial;
exports.applyFirstSessionMarketBoost = applyFirstSessionMarketBoost;
const tutorial_1 = require("../data/tutorial");
const locations_1 = require("../data/locations");
const worldEvents_1 = require("./worldEvents");
function createDefaultTutorial(completed = false) {
    return { completed, skipped: false, step: 0 };
}
function isTutorialActive(state) {
    const t = state.tutorial;
    if (!t)
        return false;
    return !t.completed && !t.skipped;
}
function advanceTutorialStep(state) {
    const t = state.tutorial ?? createDefaultTutorial(false);
    if (t.completed || t.skipped)
        return state;
    const next = t.step + 1;
    if (next >= tutorial_1.TUTORIAL_STEP_COUNT) {
        return {
            ...state,
            tutorial: { ...t, step: tutorial_1.TUTORIAL_STEP_COUNT, completed: true },
        };
    }
    return { ...state, tutorial: { ...t, step: next } };
}
function skipTutorial(state) {
    return {
        ...state,
        tutorial: {
            ...(state.tutorial ?? createDefaultTutorial(false)),
            skipped: true,
            completed: true,
        },
    };
}
function migrateTutorial(raw, hasExistingProgress) {
    if (typeof raw === 'object' && raw !== null) {
        const e = raw;
        return {
            completed: e.completed === true || e.skipped === true,
            skipped: e.skipped === true,
            step: typeof e.step === 'number' ? e.step : 0,
        };
    }
    // Legacy saves: do not force tutorial on returning players.
    return createDefaultTutorial(hasExistingProgress);
}
/** Day-1 demand surge so new players see a profitable sell opportunity quickly. */
function applyFirstSessionMarketBoost(state) {
    if (state.player.day > 1)
        return state;
    const areaKey = (0, locations_1.getPlayerAreaKey)(state.player);
    const boom = {
        id: 'we_starter_boom',
        type: 'market_boom',
        title: 'Street Demand Surge',
        description: 'Buyers are paying premium in your district. Good day to flip product.',
        affectedLocations: [areaKey],
        affectedCommodities: ['weed', 'ecstasy'],
        durationDays: 3,
        priceMultiplier: 1.32,
        heatMultiplier: 1,
        eventWeightModifiers: {},
        startDay: 1,
        expiresDay: 4,
        severity: 'medium',
    };
    const events = [...(state.activeWorldEvents ?? []), boom];
    return {
        ...state,
        activeWorldEvents: events,
        marketPrices: (0, worldEvents_1.applyWorldEventsToPrices)(state.marketPrices, events),
        messageLog: [
            'Local demand spike — weed & ecstasy prices elevated for 3 days.',
            ...(state.messageLog ?? []),
        ].slice(0, 20),
    };
}
