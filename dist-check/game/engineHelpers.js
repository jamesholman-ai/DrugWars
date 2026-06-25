"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGameOverPlayer = checkGameOverPlayer;
function checkGameOverPlayer(player) {
    if (player.health <= 0) {
        return {
            ...player,
            isGameOver: true,
            gameOverReason: 'You flatlined in the streets.',
        };
    }
    if (player.heat >= 100) {
        return {
            ...player,
            isGameOver: true,
            gameOverReason: 'The wardens finally caught up with you.',
        };
    }
    return player;
}
