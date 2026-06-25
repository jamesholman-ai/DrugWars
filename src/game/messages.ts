import { GameState } from '../types/game';

const MAX_LOG = 14;

export function withMessage(state: GameState, message: string): GameState {
  return {
    ...state,
    lastMessage: message,
    messageLog: [message, ...state.messageLog].slice(0, MAX_LOG),
  };
}

export function withMessages(state: GameState, messages: string[]): GameState {
  const combined = messages[0];
  return {
    ...state,
    lastMessage: combined,
    messageLog: [...messages, ...state.messageLog].slice(0, MAX_LOG),
  };
}
