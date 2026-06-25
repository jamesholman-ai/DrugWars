import { GameState } from '../types/game';
import { EventType } from '../types/events';
import { generateNpcDialogue } from './npcDialogue';
import { GameEventNpc } from '../types/events';
import { NPC_MAP } from '../data/npcs';

export function buildNpcBlock(
  state: GameState,
  npcId: string,
  random: () => number
): GameEventNpc {
  const def = NPC_MAP[npcId];
  const { dialogue, attitude } = generateNpcDialogue(state, npcId, random);
  return {
    id: npcId,
    name: def?.name ?? npcId,
    type: def?.type ?? 'informant',
    dialogue,
    attitude,
  };
}

export function attachNpcDialogue(
  state: GameState,
  npcId: string,
  random: () => number
): string {
  return generateNpcDialogue(state, npcId, random).dialogue;
}

export type { EventType };
