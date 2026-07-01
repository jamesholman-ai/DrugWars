/**
 * Event narrative smoke tests.
 * Run: npx tsx src/game/eventNarrativeTest.ts
 */
import { buildEvent } from './eventBuilder';
import { chooseEventOption, createInitialGameState } from './engine';
import {
  buildEventResolutionStory,
  buildEventResolutionTitle,
  classifyEventCategory,
} from './eventNarrative';
import { buildEventResultSummary } from './eventResultSummary';
import { GameEvent } from '../types/events';
import { normalizeGameState } from './stateUtils';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function syntheticEvent(partial: Partial<GameEvent> & Pick<GameEvent, 'eventType' | 'title' | 'description' | 'choices'>): GameEvent {
  return {
    id: 'test_evt',
    context: {},
    ...partial,
  };
}

function testMuggerFightWinStory(): void {
  const original = Math.random;
  Math.random = () => 0.99;
  try {
    let state = normalizeGameState(createInitialGameState());
    state = {
      ...state,
      player: { ...state.player, reputation: 60, cash: 5000 },
      pendingEvent: buildEvent('robbery_attempt', state),
    };
    const event = state.pendingEvent!;
    const before = state;
    const after = chooseEventOption(state, 'robbery_fight');
    const summary = buildEventResultSummary(before, after, event, 'robbery_fight');
    assert(summary.story.length > 40, 'fight story is narrative length');
    assert(
      summary.story.toLowerCase().includes('swing') ||
        summary.story.toLowerCase().includes('fight') ||
        summary.story.toLowerCase().includes('robber'),
      'fight story mentions the fight'
    );
    assert(summary.chips.some((c) => c.label.includes('Health')), 'health chip present');
  } finally {
    Math.random = original;
  }
}

function testRunDiffersFromFight(): void {
  let state = normalizeGameState(createInitialGameState());
  const event = buildEvent('robbery_attempt', state);
  state = { ...state, pendingEvent: event, player: { ...state.player, cash: 8000, reputation: 55 } };

  const before = state;
  const fightAfter = chooseEventOption({ ...state }, 'robbery_fight');
  const bluffAfter = chooseEventOption({ ...state }, 'robbery_bluff');

  const fightStory = buildEventResultSummary(before, fightAfter, event, 'robbery_fight').story;
  const bluffStory = buildEventResultSummary(before, bluffAfter, event, 'robbery_bluff').story;
  assert(fightStory !== bluffStory, 'fight and bluff stories differ');
}

function testPoliceBribeVsDeaSearch(): void {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    player: { ...state.player, cash: 5000 },
    pendingEvent: buildEvent('police_stop', state),
  };
  const policeEvent = state.pendingEvent!;
  const policeBefore = state;
  const policeAfter = chooseEventOption(state, 'police_stop_bribe');
  const bribeStory = buildEventResultSummary(
    policeBefore,
    policeAfter,
    policeEvent,
    'police_stop_bribe'
  ).story;
  assert(bribeStory.toLowerCase().includes('officer') || bribeStory.toLowerCase().includes('bribe') || bribeStory.toLowerCase().includes('cash'), 'bribe story');

  const deaEvent = syntheticEvent({
    eventType: 'police_stop',
    title: 'DEA Search',
    description: 'DEA agents tear through your vehicle with practiced patience.',
    choices: [{ id: 'enc:dea_checkpoint:pay', label: 'Pay' }],
  });
  const deaStory = buildEventResolutionStory(
    deaEvent,
    'enc:dea_checkpoint:pay',
    { title: '', story: '', message: '', chips: [{ label: 'Heat +5', tone: 'red' }] },
    state,
    state
  );
  assert(classifyEventCategory(deaEvent, 'enc:dea_checkpoint:pay') === 'dea', 'dea category');
  assert(deaStory.toLowerCase().includes('agent') || deaStory.toLowerCase().includes('federal'), 'dea story');
  assert(bribeStory !== deaStory, 'police bribe differs from dea');
}

function testRaccoonSpikeStory(): void {
  const state = normalizeGameState(createInitialGameState());
  const drug = 'cocaine';
  const event = syntheticEvent({
    eventType: 'price_spike',
    title: 'Raccoon Stash Panic',
    description: 'Raccoons got into a hidden stash of cocaine; supply collapsed in Brooklyn.',
    context: { commodityId: drug },
    choices: [
      { id: 'spike_sell', label: 'Sell' },
      { id: 'spike_hold', label: 'Hold' },
    ],
  });
  const story = buildEventResolutionStory(
    event,
    'spike_sell',
    { title: '', story: '', message: '', chips: [] },
    state,
    state
  );
  assert(story.toLowerCase().includes('raccoon'), 'raccoon mentioned');
  assert(story.toLowerCase().includes('cocaine'), 'drug named');
  assert(classifyEventCategory(event, 'spike_sell') === 'raccoon_stash', 'raccoon category');
}

function testWarehouseBreakInDropStory(): void {
  const state = normalizeGameState(createInitialGameState());
  const event = syntheticEvent({
    eventType: 'price_crash',
    title: 'Warehouse Leak',
    description: 'Police warehouse was broken into; heroin flooded the streets.',
    context: { commodityId: 'heroin' },
    choices: [{ id: 'crash_ignore', label: 'Ignore' }],
  });
  const story = buildEventResolutionStory(
    event,
    'crash_ignore',
    { title: '', story: '', message: '', chips: [] },
    state,
    state
  );
  assert(story.toLowerCase().includes('warehouse'), 'warehouse mentioned');
  assert(classifyEventCategory(event, 'crash_ignore') === 'warehouse_breakin', 'warehouse category');
}

function testStoryStableOnReRender(): void {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    pendingEvent: buildEvent('robbery_attempt', state),
    player: { ...state.player, cash: 5000 },
  };
  const event = state.pendingEvent!;
  const before = state;
  const after = chooseEventOption(state, 'robbery_pay');
  const first = buildEventResultSummary(before, after, event, 'robbery_pay');
  const second = buildEventResultSummary(before, after, event, 'robbery_pay');
  assert(first.story === second.story, 'story stable on re-render');
  assert(first.title === second.title, 'title stable on re-render');
}

function testDoubleTapDoesNotDoubleApply(): void {
  let state = normalizeGameState(createInitialGameState());
  state = { ...state, pendingEvent: buildEvent('robbery_attempt', state) };
  const after1 = chooseEventOption(state, 'robbery_pay');
  const after2 = chooseEventOption(after1, 'robbery_pay');
  assert(after1.player.cash === after2.player.cash, 'double tap does not re-apply');
}

function testTitleGeneration(): void {
  let state = normalizeGameState(createInitialGameState());
  state = {
    ...state,
    player: { ...state.player, cash: 5000 },
    pendingEvent: buildEvent('police_stop', state),
  };
  const event = state.pendingEvent!;
  const after = chooseEventOption(state, 'police_stop_bribe');
  const title = buildEventResolutionTitle(event, 'police_stop_bribe', state, after);
  assert(title.length > 0, 'title generated');
}

function run(): void {
  testMuggerFightWinStory();
  testRunDiffersFromFight();
  testPoliceBribeVsDeaSearch();
  testRaccoonSpikeStory();
  testWarehouseBreakInDropStory();
  testStoryStableOnReRender();
  testDoubleTapDoesNotDoubleApply();
  testTitleGeneration();
  console.log('eventNarrativeTest: all passed');
}

run();
