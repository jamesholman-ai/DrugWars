import { GameState } from '../types/game';
import { NpcMemoryFlags, NpcRelation, NpcType } from '../types/events';
import { NPC_MAP, NPCS } from '../data/npcs';

export interface NpcRelationView extends NpcRelation {
  npcId: string;
  name: string;
  type: NpcType;
}

export function createDefaultRelation(npcId: string): NpcRelation {
  const def = NPC_MAP[npcId];
  return {
    attitude: def?.baseAttitude ?? 0,
    trust: 50,
    encounters: 0,
    lastSeenDay: 0,
  };
}

export function getNpcRelation(state: GameState, npcId: string): NpcRelation {
  return state.npcRelations[npcId] ?? createDefaultRelation(npcId);
}

export function getRelationTier(attitude: number): {
  label: string;
  tone: 'ally' | 'neutral' | 'wary' | 'hostile';
} {
  if (attitude >= 50) return { label: 'ALLY', tone: 'ally' };
  if (attitude >= 15) return { label: 'NEUTRAL', tone: 'neutral' };
  if (attitude >= -20) return { label: 'WARY', tone: 'wary' };
  return { label: 'HOSTILE', tone: 'hostile' };
}

export function getTrustLabel(trust: number): string {
  if (trust >= 75) return 'High trust';
  if (trust >= 45) return 'Mixed trust';
  return 'Low trust';
}

/** Memory flags relevant to a given NPC archetype. */
export function getNpcMemoryNotes(
  npcId: string,
  flags: NpcMemoryFlags
): string[] {
  const notes: string[] = [];
  switch (npcId) {
    case 'vance':
      if (flags.bribedCop) notes.push('You bribed Vance before.');
      if (flags.helpedCop) notes.push('You cooperated with police.');
      break;
    case 'razor':
      if (flags.snitchedOnRival) notes.push('You snitched on Razor.');
      break;
    case 'mama_silk':
      if (flags.stiffedSupplier) notes.push('You stiffed Silk on a deal.');
      break;
    case 'bruno':
      if (flags.paidCollector) notes.push('You paid Bruno recently.');
      break;
    case 'chip':
      if (flags.soldToBuyer) notes.push('Chip bought from you before.');
      break;
    case 'whisper':
      if (flags.ignoredInformant) notes.push('You ignored Whisper\'s tips.');
      break;
    default:
      break;
  }
  return notes;
}

export function listNpcRelations(state: GameState): NpcRelationView[] {
  return NPCS.map((npc) => ({
    npcId: npc.id,
    name: npc.name,
    type: npc.type,
    ...getNpcRelation(state, npc.id),
  })).sort((a, b) => b.encounters - a.encounters || b.attitude - a.attitude);
}

/** Event weight multiplier based on NPC relationship (recurring characters). */
export function getNpcEventWeightMultiplier(
  state: GameState,
  npcId: string
): number {
  const rel = getNpcRelation(state, npcId);
  let mult = 1;

  if (rel.encounters >= 3) mult += 0.15;
  if (rel.attitude >= 40) mult += 0.2;
  if (rel.attitude <= -30) mult += 0.25;
  if (rel.trust >= 70) mult += 0.1;
  if (rel.trust <= 25) mult += 0.15;

  return mult;
}

export function applyTrustDelta(trust: number, delta: number): number {
  return Math.min(100, Math.max(0, trust + delta));
}
