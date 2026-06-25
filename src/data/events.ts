import { GameState } from '../types/game';
import { EventType } from '../types/events';
import { adjustWeight, weightedPick, WeightedItem } from '../utils/weightedRandom';
import { buildEvent } from '../game/eventBuilder';
import { normalizeGameState } from '../game/stateUtils';
import { getNpcEventWeightMultiplier } from '../game/npcSystem';
import { getWorldEventWeightMultiplier } from '../game/worldEvents';
import { getRobberyWeightMultiplier } from '../game/progression';

export type EventTrigger = 'travel' | 'rest' | 'day_advance';

/** NPC tied to recurring event types — used for relationship-based weighting. */
const EVENT_NPC_IDS: Partial<Record<EventType, string>> = {
  police_stop: 'vance',
  rival_dealer: 'razor',
  supplier_discount: 'mama_silk',
  informant_tip: 'whisper',
  bulk_buyer_offer: 'chip',
  debt_collector_warning: 'bruno',
};

function relationWeight(state: GameState, eventType: EventType, base: number): number {
  const npcId = EVENT_NPC_IDS[eventType];
  let weight = base;
  if (npcId) {
    weight = adjustWeight(weight, getNpcEventWeightMultiplier(state, npcId));
  }
  return adjustWeight(weight, getWorldEventWeightMultiplier(state, eventType));
}

function buildWeights(state: GameState, trigger: EventTrigger): WeightedItem<EventType>[] {
  const { player, memoryFlags } = state;
  const heatFactor = 1 + player.heat / 100;
  const debtFactor = 1 + Math.min(player.debt / 15000, 1.5);
  const lowHealthFactor = player.health < 40 ? 2.5 : 1;
  const travelFactor = trigger === 'travel' ? 1.2 : 1;
  const restFactor = trigger === 'rest' ? 0.8 : 1;

  return [
    { item: 'police_stop', weight: relationWeight(state, 'police_stop', adjustWeight(12, heatFactor * travelFactor)) },
    { item: 'police_raid', weight: adjustWeight(8, heatFactor * 1.3 * getWorldEventWeightMultiplier(state, 'police_raid')) },
    { item: 'rival_dealer', weight: relationWeight(state, 'rival_dealer', adjustWeight(10, travelFactor)) },
    { item: 'robbery_attempt', weight: adjustWeight(11, travelFactor * (player.reputation < 30 ? 1.3 : 0.9) * getWorldEventWeightMultiplier(state, 'robbery_attempt') * getRobberyWeightMultiplier(state)) },
    { item: 'supplier_discount', weight: relationWeight(state, 'supplier_discount', adjustWeight(9, restFactor)) },
    { item: 'price_spike', weight: adjustWeight(10, 1) },
    { item: 'price_crash', weight: adjustWeight(10, 1) },
    {
      item: 'informant_tip',
      weight: relationWeight(
        state,
        'informant_tip',
        adjustWeight(8, player.reputation > 40 ? 1.4 : 0.8) * (memoryFlags.ignoredInformant ? 0.7 : 1)
      ),
    },
    {
      item: 'bulk_buyer_offer',
      weight: relationWeight(
        state,
        'bulk_buyer_offer',
        adjustWeight(9, player.inventory.length > 0 ? 1.5 : 0.4) * (memoryFlags.soldToBuyer ? 1.2 : 1)
      ),
    },
    { item: 'health_emergency', weight: adjustWeight(6, lowHealthFactor) },
    {
      item: 'debt_collector_warning',
      weight: relationWeight(
        state,
        'debt_collector_warning',
        adjustWeight(10, debtFactor * (player.debt > 6000 ? 1.8 : 0.5)) * (memoryFlags.paidCollector ? 0.85 : 1)
      ),
    },
  ];
}

/** Base chance an event fires when traveling or advancing the day. */
const TRIGGER_CHANCE: Record<EventTrigger, number> = {
  travel: 0.12,
  rest: 0.12,
  day_advance: 0.10,
};

export function rollRandomEvent(
  state: GameState,
  trigger: EventTrigger = 'travel',
  random: () => number = Math.random
): GameState {
  const normalized = normalizeGameState(state);
  const chance = TRIGGER_CHANCE[trigger];
  if (random() > chance) {
    return normalized;
  }

  const weights = buildWeights(normalized, trigger);
  const eventType = weightedPick(weights, random);
  if (!eventType) {
    return normalized;
  }

  const event = buildEvent(eventType, normalized, random);
  return {
    ...normalized,
    pendingEvent: event,
  };
}

export { buildWeights, TRIGGER_CHANCE };
