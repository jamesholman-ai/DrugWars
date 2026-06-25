import { GameState, PlayerState } from '../types/game';
import { getInventoryUsed } from './economy';
import { hasEquipment } from './combat';

export function checkGameOverPlayer(player: PlayerState): PlayerState {
  if (player.health <= 0) {
    return {
      ...player,
      isGameOver: true,
      gameOverReason: 'You flatlined in the streets.',
    };
  }

  return player;
}

export function checkGameOverState(state: GameState): GameState {
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

  const inventoryEmpty = getInventoryUsed(player) <= 0;
  const broke = player.cash <= 0;
  const deepDebt = player.debt > 20000;

  if (
    player.legalStatus === 'jailed' &&
    player.daysInJail > 5 &&
    broke &&
    inventoryEmpty &&
    deepDebt
  ) {
    return {
      ...state,
      player: {
        ...player,
        isGameOver: true,
        gameOverReason: 'Locked up, broke, and buried in debt. Game over.',
      },
    };
  }

  if (
    state.cartelStanding <= -80 &&
    (state.cartelBetrayals ?? 0) >= 3 &&
    !hasEquipment(state, 'bodyguard_crew')
  ) {
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
export function checkGameOverPlayerLegacy(player: PlayerState): PlayerState {
  return checkGameOverPlayer(player);
}
