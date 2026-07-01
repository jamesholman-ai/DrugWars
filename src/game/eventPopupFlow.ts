import { GameState } from '../types/game';
import { GameEvent } from '../types/events';
import { chooseEventOption } from './engine';
import { getChoiceLockReason } from './eventChoiceLocks';
import { buildEventResultSummary, EventResultSummary } from './eventResultSummary';
import { normalizeGameState } from './stateUtils';

export interface EventChoiceResolution {
  after: GameState;
  result: EventResultSummary;
  deferredLastMessage?: string;
  deferredMessageLog?: string[];
}

export type ResolveEventChoiceResult = EventChoiceResolution | { locked: true; reason: string };

export function withoutDeferredEventMessages(state: GameState, keep: GameState): GameState {
  return {
    ...state,
    lastMessage: keep.lastMessage,
    messageLog: keep.messageLog,
  };
}

/** Pure resolution used by GameContext and smoke tests — no React state. */
export function resolveGameEventChoice(
  state: GameState,
  activeEvent: GameEvent,
  choiceId: string,
  options?: { deferMessages?: boolean }
): ResolveEventChoiceResult {
  const before = normalizeGameState({ ...state, pendingEvent: activeEvent });
  const lock = getChoiceLockReason(before, activeEvent, choiceId);
  if (lock) {
    return { locked: true, reason: lock };
  }

  const after = chooseEventOption(before, choiceId);
  const result = buildEventResultSummary(before, after, activeEvent, choiceId);
  if (!options?.deferMessages) {
    return { after, result };
  }

  return {
    after: withoutDeferredEventMessages(after, before),
    result,
    deferredLastMessage: after.lastMessage,
    deferredMessageLog: after.messageLog,
  };
}
