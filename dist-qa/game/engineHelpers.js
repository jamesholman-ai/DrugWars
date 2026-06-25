"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGameOverPlayer = checkGameOverPlayer;
exports.checkGameOverState = checkGameOverState;
exports.checkGameOverPlayerLegacy = checkGameOverPlayerLegacy;
const economy_1 = require("./economy");
const combat_1 = require("./combat");
function checkGameOverPlayer(player) {
    if (player.health <= 0) {
        return {
            ...player,
            isGameOver: true,
            gameOverReason: 'You flatlined in the streets.',
        };
    }
    return player;
}
function checkGameOverState(state) {
    let player = checkGameOverPlayer(state.player);
    if (player.isGameOver) {
        return { ...state, player };
    }
    if (player.federalCaseSeverity >= 100 && player.legalStatus === 'federal_case') {
        return {
            ...state,
            player: {
                ...player,
                isGameOver: true,
                gameOverReason: 'Federal case closed — life sentence.',
            },
        };
    }
    const inventoryEmpty = (0, economy_1.getInventoryUsed)(player) <= 0;
    const broke = player.cash <= 0;
    const deepDebt = player.debt > 20000;
    if (player.legalStatus === 'jailed' &&
        player.daysInJail > 5 &&
        broke &&
        inventoryEmpty &&
        deepDebt) {
        return {
            ...state,
            player: {
                ...player,
                isGameOver: true,
                gameOverReason: 'Locked up, broke, and buried in debt. Game over.',
            },
        };
    }
    if (state.cartelStanding <= -80 &&
        (state.cartelBetrayals ?? 0) >= 3 &&
        !(0, combat_1.hasEquipment)(state, 'bodyguard_crew')) {
        const roll = Math.random();
        if (roll < 0.08) {
            return {
                ...state,
                player: {
                    ...player,
                    isGameOver: true,
                    gameOverReason: 'Cartel enforcers caught up. No more warnings.',
                },
            };
        }
    }
    return { ...state, player };
}
/** @deprecated Use checkGameOverState for full rules */
function checkGameOverPlayerLegacy(player) {
    return checkGameOverPlayer(player);
}
