import { GameState } from '../types/game';
import { NpcDefinition } from '../types/events';
import { NPC_MAP } from '../data/npcs';
import { pickRandom } from '../utils/random';

interface DialogueContext {
  reputation: number;
  heat: number;
  debt: number;
  attitude: number;
  memoryHostile: boolean;
}

function pickFromPool(pool: string[], random: () => number): string {
  if (pool.length === 0) return '...';
  const idx = Math.floor(random() * pool.length);
  return pool[idx];
}

export function getNpcAttitude(
  state: GameState,
  npcId: string,
  random: () => number = Math.random
): number {
  const npc = NPC_MAP[npcId];
  if (!npc) return 0;

  const relation = state.npcRelations[npcId];
  const baseAttitude = relation?.attitude ?? npc.baseAttitude;
  const trustBonus = Math.floor(((relation?.trust ?? 50) - 50) / 10);
  const repeatBonus = (relation?.encounters ?? 0) >= 3 ? 5 : 0;
  const repBonus = Math.floor((state.player.reputation - 50) / 10);
  const heatPenalty = state.player.heat > 60 ? -10 : 0;
  const debtPenalty = state.player.debt > 10000 ? -5 : 0;

  return baseAttitude + repBonus + heatPenalty + debtPenalty + trustBonus + repeatBonus;
}

function isMemoryHostile(state: GameState, npc: NpcDefinition): boolean {
  const mem = state.memoryFlags;
  switch (npc.type) {
    case 'corrupt_cop':
      return mem.helpedCop === false && mem.bribedCop === false && state.player.heat > 50;
    case 'rival':
      return mem.snitchedOnRival;
    case 'supplier':
      return mem.stiffedSupplier;
    case 'debt_collector':
      return !mem.paidCollector && state.player.debt > 8000;
    case 'street_buyer':
      return !mem.soldToBuyer;
    case 'informant':
      return mem.ignoredInformant;
    default:
      return false;
  }
}

export function generateNpcDialogue(
  state: GameState,
  npcId: string,
  random: () => number = Math.random
): { dialogue: string; attitude: number } {
  const npc = NPC_MAP[npcId];
  if (!npc) {
    return { dialogue: '...', attitude: 0 };
  }

  const attitude = getNpcAttitude(state, npcId, random);
  const ctx: DialogueContext = {
    reputation: state.player.reputation,
    heat: state.player.heat,
    debt: state.player.debt,
    attitude,
    memoryHostile: isMemoryHostile(state, npc),
  };

  let pool: string[];

  if (ctx.memoryHostile || attitude < -20) {
    pool = npc.dialogueLines.hostile;
  } else if (attitude > 30) {
    pool = npc.dialogueLines.friendly;
  } else if (ctx.heat > 65) {
    pool = npc.dialogueLines.highHeat;
  } else if (ctx.debt > 12000) {
    pool = npc.dialogueLines.highDebt;
  } else if (ctx.reputation >= 55) {
    pool = npc.dialogueLines.highRep;
  } else if (ctx.reputation < 25) {
    pool = npc.dialogueLines.lowRep;
  } else {
    pool = [
      ...npc.dialogueLines.friendly,
      ...npc.dialogueLines.lowRep,
    ];
  }

  return {
    dialogue: pickFromPool(pool, random),
    attitude,
  };
}

export function pickRandomNpcOfType(
  type: NpcDefinition['type'],
  random: () => number = Math.random
): NpcDefinition {
  const matches = Object.values(NPC_MAP).filter((n) => n.type === type);
  return pickRandom(matches);
}
