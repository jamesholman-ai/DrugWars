/**
 * Verifies every random event type and encounter choice resolves with a popup-ready result.
 * Run: npx tsx src/game/eventPopupAllTypesTest.ts
 */
import { COMMODITIES } from '../data/commodities';
import { ENCOUNTER_CATALOG } from '../data/encounterCatalog';
import { buildEvent, getAllEventTypes } from './eventBuilder';
import { buildEncounterEvent } from './encounterSystem';
import { createInitialGameState } from './engine';
import { getChoiceLockReason } from './eventChoiceLocks';
import { resolveGameEventChoice } from './eventPopupFlow';
import { normalizeGameState } from './stateUtils';
import { CommodityId, GameState } from '../types/game';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function richTestState(): GameState {
  const base = createInitialGameState();
  const inventory = COMMODITIES.map((c) => ({
    commodityId: c.id as CommodityId,
    quantity: 25,
    avgCost: 120,
  }));
  return normalizeGameState({
    ...base,
    player: {
      ...base.player,
      cash: 50_000,
      debt: 8_000,
      health: 85,
      heat: 35,
      reputation: 55,
      inventory,
    },
  });
}

function firstUnlockedChoice(state: GameState, event: ReturnType<typeof buildEvent>): string | null {
  for (const choice of event.choices) {
    if (!getChoiceLockReason(state, event, choice.id)) {
      return choice.id;
    }
  }
  return null;
}

function testAllRandomEventTypes(): void {
  const types = getAllEventTypes();
  assert(types.length === 11, `expected 11 event types, got ${types.length}`);

  for (const eventType of types) {
    const state = richTestState();
    const event = buildEvent(eventType, state);
    const choiceId = firstUnlockedChoice(state, event);
    assert(choiceId != null, `${eventType}: no unlocked choice`);

    const withEvent = { ...state, pendingEvent: event };
    const resolved = resolveGameEventChoice(withEvent, event, choiceId!);
    assert(!('locked' in resolved), `${eventType}: choice ${choiceId} unexpectedly locked`);

    if ('locked' in resolved) return;

    const { after, result } = resolved;
    assert(after.pendingEvent == null, `${eventType}: pending not cleared`);
    assert(after.lastMessage.length > 0, `${eventType}: missing lastMessage`);
    assert(result.story.length > 0, `${eventType}: missing result story`);
    assert(result.title.length > 0, `${eventType}: missing result title`);
    assert(result.message.length > 0, `${eventType}: missing result message`);
  }
}

function testEveryRandomEventChoice(): void {
  const state = richTestState();
  const tested = new Set<string>();

  for (const eventType of getAllEventTypes()) {
    const event = buildEvent(eventType, state);
    for (const choice of event.choices) {
      tested.add(choice.id);
      const withEvent = { ...state, pendingEvent: event };
      const lock = getChoiceLockReason(withEvent, event, choice.id);
      if (lock) continue;

      const resolved = resolveGameEventChoice(withEvent, event, choice.id);
      assert(!('locked' in resolved), `${choice.id} unexpectedly locked`);
      if ('locked' in resolved) continue;
      assert(resolved.result.story.length > 0, `${choice.id}: empty story`);
      assert(resolved.after.pendingEvent == null, `${choice.id}: pending not cleared`);
    }
  }

  assert(tested.size >= 33, `expected 33+ random event choices, got ${tested.size}`);
}

function testAllEncounters(): void {
  assert(ENCOUNTER_CATALOG.length > 0, 'encounter catalog empty');

  for (const encounter of ENCOUNTER_CATALOG) {
    const state = richTestState();
    const event = buildEncounterEvent(encounter, state);
    assert(event.choices.length > 0, `${encounter.id}: no choices`);

    let resolvedAny = false;
    for (const choice of event.choices) {
      const withEvent = { ...state, pendingEvent: event };
      const lock = getChoiceLockReason(withEvent, event, choice.id);
      if (lock) continue;

      const resolved = resolveGameEventChoice(withEvent, event, choice.id);
      assert(!('locked' in resolved), `${encounter.id}/${choice.id} unexpectedly locked`);
      if ('locked' in resolved) continue;
      assert(resolved.result.story.length > 0, `${encounter.id}/${choice.id}: empty story`);
      assert(resolved.after.pendingEvent == null, `${encounter.id}/${choice.id}: pending not cleared`);
      assert(resolved.after.lastMessage.length > 0, `${encounter.id}/${choice.id}: no lastMessage`);
      resolvedAny = true;
    }

    assert(resolvedAny, `${encounter.id}: no resolvable choices in rich test state`);
  }
}

function testPriceCrashDrugDump(): void {
  const state = richTestState();
  const event = buildEvent('price_crash', state);
  assert(
    event.description.toLowerCase().includes('flooded') ||
      event.title.toLowerCase().includes('crash'),
    'price_crash should read like a market dump'
  );

  const withEvent = { ...state, pendingEvent: event };
  for (const choiceId of ['crash_ignore', 'crash_warn', 'crash_buy'] as const) {
    const lock = getChoiceLockReason(withEvent, event, choiceId);
    if (lock && choiceId === 'crash_buy') continue;

    const resolved = resolveGameEventChoice(withEvent, event, choiceId);
    if ('locked' in resolved) continue;

    assert(resolved.result.story.length > 0, `${choiceId}: empty story`);
    assert(resolved.after.pendingEvent == null, `${choiceId}: pending not cleared`);
  }
}

function testPopupHeldEventFallback(): void {
  const state = richTestState();
  const event = buildEvent('price_crash', state);
  const withEvent = { ...state, pendingEvent: event };
  const choiceId = 'crash_ignore';

  const resolved = resolveGameEventChoice(withEvent, event, choiceId);
  assert(!('locked' in resolved), 'crash_ignore should resolve');
  if ('locked' in resolved) return;

  const replay = resolveGameEventChoice(
    { ...resolved.after, pendingEvent: null },
    event,
    choiceId
  );
  assert(!('locked' in replay), 'popup-held event should still resolve without pendingEvent on state');
}

function run(): void {
  testAllRandomEventTypes();
  testEveryRandomEventChoice();
  testAllEncounters();
  testPriceCrashDrugDump();
  testPopupHeldEventFallback();
  console.log('eventPopupAllTypesTest: all passed');
}

run();
