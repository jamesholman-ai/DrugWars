import { COMMODITY_MAP } from '../data/commodities';
import { CommodityId, GameState } from '../types/game';
import { GameEvent } from '../types/events';
import {
  buildEventResolutionStory,
  buildEventResolutionTitle,
} from './eventNarrative';
import { formatMoney } from '../utils/format';

export type EventResultChipTone = 'green' | 'red' | 'gray' | 'blue' | 'gold';

export interface EventResultChip {
  label: string;
  tone: EventResultChipTone;
}

export interface EventResultSummary {
  title: string;
  story: string;
  message: string;
  chips: EventResultChip[];
  financeLogMessage?: string;
}

function signedMoney(delta: number): string {
  const abs = formatMoney(Math.abs(delta));
  return delta >= 0 ? `+${abs}` : `−${abs}`;
}

function signedInt(label: string, delta: number): string {
  if (delta >= 0) return `${label} +${delta}`;
  return `${label} ${delta}`;
}

function chipTone(delta: number): EventResultChipTone {
  if (delta > 0) return 'green';
  if (delta < 0) return 'red';
  return 'gray';
}

function inventorySnapshot(state: GameState): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of state.player.inventory) {
    map.set(item.commodityId, item.quantity);
  }
  return map;
}

export function getEventResultTitle(event: GameEvent, choiceId: string): string {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (choice) return `${event.title} — ${choice.label}`;
  return `${event.title} — Outcome`;
}

export function buildEventResultSummary(
  before: GameState,
  after: GameState,
  event: GameEvent,
  choiceId: string
): EventResultSummary {
  const chips: EventResultChip[] = [];
  const bp = before.player;
  const ap = after.player;

  const cashDelta = ap.cash - bp.cash;
  if (cashDelta !== 0) {
    chips.push({ label: `Cash ${signedMoney(cashDelta)}`, tone: chipTone(cashDelta) });
  }

  const debtDelta = ap.debt - bp.debt;
  if (debtDelta !== 0) {
    chips.push({
      label: `Debt ${signedMoney(debtDelta)}`,
      tone: debtDelta > 0 ? 'red' : 'green',
    });
  }

  const heatDelta = ap.heat - bp.heat;
  if (heatDelta !== 0) {
    chips.push({ label: signedInt('Heat', heatDelta), tone: chipTone(-heatDelta) });
  }

  const repDelta = ap.reputation - bp.reputation;
  if (repDelta !== 0) {
    chips.push({ label: signedInt('Reputation', repDelta), tone: chipTone(repDelta) });
  }

  const healthDelta = ap.health - bp.health;
  if (healthDelta !== 0) {
    chips.push({ label: signedInt('Health', healthDelta), tone: chipTone(healthDelta) });
  }

  const beforeInv = inventorySnapshot(before);
  const afterInv = inventorySnapshot(after);
  const commodityIds = new Set([...beforeInv.keys(), ...afterInv.keys()]);
  for (const id of commodityIds) {
    const delta = (afterInv.get(id) ?? 0) - (beforeInv.get(id) ?? 0);
    if (delta === 0) continue;
    const name = COMMODITY_MAP[id as CommodityId]?.name ?? id;
    chips.push({
      label: `Inventory: ${name} ${delta > 0 ? `+${delta}` : delta}`,
      tone: chipTone(delta),
    });
  }

  const cartelDelta = (after.cartelStanding ?? 0) - (before.cartelStanding ?? 0);
  if (cartelDelta !== 0) {
    chips.push({
      label: signedInt('Cartel standing', cartelDelta),
      tone: chipTone(cartelDelta),
    });
  }

  if (bp.legalStatus !== ap.legalStatus) {
    chips.push({
      label: `Legal: ${ap.legalStatus.replace(/_/g, ' ')}`,
      tone: 'gold',
    });
  }

  if ((ap.daysInJail ?? 0) > (bp.daysInJail ?? 0)) {
    chips.push({
      label: `Jailed ${ap.daysInJail - (bp.daysInJail ?? 0)} day(s)`,
      tone: 'red',
    });
  }

  const message = after.lastMessage || 'Event resolved.';
  const partial: EventResultSummary = {
    title: getEventResultTitle(event, choiceId),
    story: message,
    message,
    chips,
    financeLogMessage: message,
  };

  const title = buildEventResolutionTitle(event, choiceId, before, after);
  const story = buildEventResolutionStory(event, choiceId, partial, after, before);

  return {
    title,
    story,
    message,
    chips,
    financeLogMessage: message,
  };
}
