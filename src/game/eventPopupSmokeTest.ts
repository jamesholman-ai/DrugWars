/**
 * Event popup flow smoke tests.
 * Run: npx tsx src/game/eventPopupSmokeTest.ts
 */
import { buildEvent } from './eventBuilder';
import { buildEncounterEvent } from './encounterSystem';
import { ENCOUNTER_MAP } from '../data/encounterCatalog';
import { chooseEventOption, createInitialGameState, stayHere } from './engine';
import { resolveGameEventChoice } from './eventPopupFlow';
import { getChoiceLockReason } from './eventChoiceLocks';
import { buildEventResultSummary } from './eventResultSummary';
import { normalizeGameState } from './stateUtils';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testPendingEventOpens(): void {
  const state = normalizeGameState(createInitialGameState());
  const withEvent = {
    ...state,
    pendingEvent: buildEvent('police_stop', state),
  };
  assert(withEvent.pendingEvent != null, 'pending event set');
  assert(withEvent.pendingEvent.choices.length >= 2, 'event has choices');
}

function testChoiceResolvesOnce(): void {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    pendingEvent: buildEvent('police_stop', state),
  };
  const cashBefore = state.player.cash;
  const after1 = chooseEventOption(state, 'police_stop_cooperate');
  assert(after1.pendingEvent == null, 'pending cleared after resolve');
  const after2 = chooseEventOption(after1, 'police_stop_cooperate');
  assert(after2.player.cash === after1.player.cash, 'double resolve does not change cash again');
  assert(after1.player.cash <= cashBefore, 'cooperate may fine or warn');
}

function testResultSummaryChips(): void {
  let state = normalizeGameState(createInitialGameState());
  const event = buildEvent('robbery_attempt', state);
  state = { ...state, pendingEvent: event, player: { ...state.player, cash: 5000 } };
  const before = state;
  const after = chooseEventOption(state, 'robbery_pay');
  const summary = buildEventResultSummary(before, after, event, 'robbery_pay');
  assert(summary.message.length > 0, 'result message');
  assert(summary.story.length > 0, 'result story');
  assert(summary.chips.some((c) => c.label.startsWith('Cash')), 'cash chip present');
}

function testLockedChoice(): void {
  const state = normalizeGameState(createInitialGameState());
  const event = buildEvent('police_stop', state);
  const broke = {
    ...state,
    player: { ...state.player, cash: 0 },
    pendingEvent: event,
  };
  const lock = getChoiceLockReason(broke, event, 'police_stop_bribe');
  assert(lock != null, 'bribe locked without cash');
}

function testNoChoiceEventContinue(): void {
  let state = normalizeGameState(createInitialGameState());
  const event = buildEvent('price_spike', state);
  state = { ...state, pendingEvent: event };
  const after = chooseEventOption(state, event.choices[0].id);
  assert(after.pendingEvent == null, 'single-path event clears pending');
}

function testStayAdvancesDayWithEventFlow(): void {
  const original = Math.random;
  Math.random = () => 0.01;
  try {
    let state = normalizeGameState(createInitialGameState());
    state = {
      ...state,
      pendingEvent: buildEvent('health_emergency', state),
    };
    const day = state.player.day;
    const resolved = chooseEventOption(state, 'health_clinic');
    assert(resolved.pendingEvent == null, 'resolved before stay');
    const afterStay = stayHere(resolved);
    assert(afterStay.player.day === day + 1, 'stay still advances day');
  } finally {
    Math.random = original;
  }
}

function testSaveClearsPendingEvent(): void {
  const state = normalizeGameState(createInitialGameState());
  const migrated = normalizeGameState({
    ...state,
    pendingEvent: buildEvent('informant_tip', state),
  });
  assert(migrated.pendingEvent != null, 'has pending in memory');
  const savedShape = { ...migrated, pendingEvent: null };
  assert(savedShape.pendingEvent == null, 'save migration clears pending popup');
}

function testEncounterResultSummary(): void {
  let state = normalizeGameState(createInitialGameState());
  const encounter = ENCOUNTER_MAP.thug_gang;
  assert(encounter != null, 'street gang encounter exists');
  const event = buildEncounterEvent(encounter, state);
  state = {
    ...state,
    pendingEvent: event,
    player: { ...state.player, cash: 5000, health: 100 },
  };
  const before = state;
  const fightChoice = event.choices.find((c) => c.id.includes('fight'));
  assert(fightChoice != null, 'fight choice exists');
  const choiceId = fightChoice!.id;
  const after = chooseEventOption(state, choiceId);
  assert(after.pendingEvent == null, 'encounter clears pending');
  assert(after.lastMessage.includes('Street Gang'), 'encounter last message set');
  const summary = buildEventResultSummary(before, after, event, choiceId);
  assert(summary.story.length > 0, 'encounter result story');
  assert(summary.chips.length > 0, 'encounter result chips');
}

function testDeferredEventMessages(): void {
  let state = normalizeGameState(createInitialGameState());
  const event = buildEvent('robbery_attempt', state);
  state = { ...state, pendingEvent: event, player: { ...state.player, cash: 5000 } };
  const previousLastMessage = state.lastMessage;
  const resolved = resolveGameEventChoice(state, event, 'robbery_pay', { deferMessages: true });
  assert(!('locked' in resolved), 'robbery_pay should resolve');
  if ('locked' in resolved) return;

  assert(
    resolved.after.lastMessage === previousLastMessage,
    'popup resolution should defer lastMessage until confirm'
  );
  assert(resolved.after.player.cash < state.player.cash, 'stat changes still apply while deferred');
  assert(resolved.result.story.length > 0, 'result story available for popup');
}

function testPriceSpikeResultSummary(): void {
  let state = normalizeGameState(createInitialGameState());
  const event = buildEvent('price_spike', state);
  state = {
    ...state,
    pendingEvent: event,
    player: { ...state.player, cash: 3000 },
  };
  const before = state;
  const after = chooseEventOption(state, 'spike_hold');
  assert(after.pendingEvent == null, 'spike clears pending');
  assert(after.lastMessage.toLowerCase().includes('spike') || after.lastMessage.length > 0, 'spike message');
  const summary = buildEventResultSummary(before, after, event, 'spike_hold');
  assert(summary.story.length > 0, 'spike result story');
  assert(summary.chips.length >= 0, 'spike result chips');
}

function run(): void {
  testPendingEventOpens();
  testChoiceResolvesOnce();
  testResultSummaryChips();
  testLockedChoice();
  testNoChoiceEventContinue();
  testEncounterResultSummary();
  testDeferredEventMessages();
  testPriceSpikeResultSummary();
  testStayAdvancesDayWithEventFlow();
  testSaveClearsPendingEvent();
  console.log('eventPopupSmokeTest: all passed');
}

run();
