import { ENCOUNTER_MAP } from '../data/encounterCatalog';
import { GameState } from '../types/game';
import { EventChoice, GameEvent } from '../types/events';
import { parseEncounterChoice } from './encounterSystem';

const CASH_CHOICE_COSTS: Record<string, (event: GameEvent) => number | null> = {
  police_stop_bribe: (e) => e.context.amount ?? 500,
  police_raid_hide: (e) => e.context.amount ?? 300,
  supplier_buy: (e) => e.context.amount ?? null,
  crash_buy: (e) => e.context.amount ?? null,
  informant_pay: (e) => e.context.amount ?? null,
};

const INVENTORY_CHOICE_MIN: Record<string, number> = {
  informant_trade: 3,
  spike_sell: 1,
  buyer_sell: 1,
};

function totalInventoryQty(state: GameState): number {
  return state.player.inventory.reduce((sum, item) => sum + item.quantity, 0);
}

function encounterChoiceLock(state: GameState, choiceId: string): string | null {
  const parsed = parseEncounterChoice(choiceId);
  if (!parsed) return null;
  const encounter = ENCOUNTER_MAP[parsed.encounterId];
  const choice = encounter?.choices.find((c) => c.id === parsed.choiceKey);
  if (!choice) return null;
  if (choice.minCash != null && state.player.cash < choice.minCash) {
    return `Need $${choice.minCash} cash`;
  }
  if (
    choice.requiresEquipment &&
    !state.equipment?.some((e) => e.equipmentId === choice.requiresEquipment)
  ) {
    return 'Requires special equipment';
  }
  return null;
}

export function getChoiceLockReason(
  state: GameState,
  event: GameEvent,
  choiceId: string
): string | null {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (choice?.lockedReason) return choice.lockedReason;

  if (choiceId.startsWith('enc:')) {
    return encounterChoiceLock(state, choiceId);
  }

  const cashFn = CASH_CHOICE_COSTS[choiceId];
  if (cashFn) {
    const cost = cashFn(event);
    if (cost != null && state.player.cash < cost) {
      return `Need $${cost} cash`;
    }
  }

  const minQty = INVENTORY_CHOICE_MIN[choiceId];
  if (minQty != null && totalInventoryQty(state) < minQty) {
    return `Need at least ${minQty} units in stash`;
  }

  if (choiceId === 'buyer_sell' || choiceId === 'spike_sell') {
    const commodityId = event.context.commodityId;
    if (commodityId) {
      const owned =
        state.player.inventory.find((i) => i.commodityId === commodityId)?.quantity ?? 0;
      const need = event.context.quantity ?? 1;
      if (owned < need) {
        return `Need ${need} ${commodityId} in stash`;
      }
    }
  }

  return null;
}

export function enrichChoiceLocks(state: GameState, event: GameEvent): EventChoice[] {
  return event.choices.map((choice) => {
    const lockedReason = getChoiceLockReason(state, event, choice.id);
    return lockedReason ? { ...choice, lockedReason } : choice;
  });
}
