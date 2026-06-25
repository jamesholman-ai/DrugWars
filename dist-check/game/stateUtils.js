"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGameState = normalizeGameState;
const game_1 = require("../types/game");
const progression_1 = require("./progression");
/** Ensures optional runtime fields exist (guards partial/legacy state). */
function normalizeGameState(state) {
    const withDefaults = {
        ...state,
        memoryFlags: { ...(0, game_1.createEmptyMemoryFlags)(), ...(state.memoryFlags ?? {}) },
        npcRelations: state.npcRelations ?? {},
        activeWorldEvents: state.activeWorldEvents ?? [],
        progression: state.progression ?? (0, progression_1.createInitialProgression)(),
        messageLog: Array.isArray(state.messageLog) ? [...state.messageLog] : [],
        lastMessage: state.lastMessage ?? '',
        pendingEvent: state.pendingEvent ?? null,
        marketPrices: state.marketPrices ?? {},
        player: {
            ...state.player,
            inventory: Array.isArray(state.player.inventory)
                ? state.player.inventory.map((item) => ({ ...item }))
                : [],
        },
    };
    return (0, progression_1.syncProgression)(withDefaults);
}
