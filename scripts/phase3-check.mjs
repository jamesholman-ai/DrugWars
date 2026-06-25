/**
 * Phase 3 checks — run after: npx tsc --outDir dist-check --rootDir src src/game/progression.ts src/game/saveStorage.ts src/game/economy.ts src/game/engine.ts src/game/stateUtils.ts src/game/messages.ts src/game/engineHelpers.ts src/data/progression.ts src/data/locations.ts src/data/commodities.ts src/types/game.ts src/types/progression.ts src/types/events.ts src/game/worldEvents.ts src/data/worldEvents.ts src/utils/random.ts
 * Then: node scripts/phase3-check.mjs
 */
import assert from 'node:assert/strict';
import {
  computeRankId,
  createInitialProgression,
  getNextInventoryUpgrade,
  getReputationTier,
  isLocationUnlocked,
  purchaseInventoryUpgrade,
  purchaseStashHouse,
  sanitizePurchasedUpgrades,
  syncProgression,
  migrateLegacyProgression,
} from '../dist-check/game/progression.js';
import { migrateGameState } from '../dist-check/game/saveStorage.js';
import { createInitialGameState } from '../dist-check/game/engine.js';
import { STARTING_UNLOCKED_LOCATIONS } from '../dist-check/data/progression.js';

// New game defaults
{
  const state = createInitialGameState();
  assert.deepEqual(state.progression.unlockedLocations.sort(), [...STARTING_UNLOCKED_LOCATIONS].sort());
  assert.equal(state.progression.rankId, 'wannabe');
  assert.equal(state.progression.lifetimeProfit, 0);
  assert.equal(state.progression.purchasedInventoryUpgrades.length, 0);
  assert.equal(state.progression.ownedStashHouses.length, 0);
  assert.equal(state.player.inventoryCapacity, 100);
}

// Legacy save migration
{
  const legacy = {
    version: 1,
    state: {
      player: createInitialGameState().player,
      marketPrices: createInitialGameState().marketPrices,
      memoryFlags: createInitialGameState().memoryFlags,
      npcRelations: {},
      activeWorldEvents: [],
      lastMessage: 'test',
      messageLog: [],
    },
  };
  legacy.state.player.currentLocation = 'airport';
  const loaded = migrateGameState(legacy);
  assert.ok(loaded);
  assert.equal(loaded.progression.unlockedLocations.length, 7);
  assert.ok(isLocationUnlocked(loaded, 'airport'));
}

// Rank calculation
{
  const base = createInitialGameState();
  const state = syncProgression({
    ...base,
    player: {
      ...base.player,
      reputation: 30,
      day: 10,
      cash: 20000,
    },
    progression: {
      ...base.progression,
      lifetimeProfit: 5000,
    },
  });
  assert.ok(['hustler', 'dealer', 'plug', 'shot_caller', 'kingpin', 'empire_boss'].includes(state.progression.rankId) || state.progression.rankId === 'runner');
}

// Reputation tiers
{
  assert.equal(getReputationTier(0).name, 'Unknown');
  assert.equal(getReputationTier(15).name, 'Noticed');
  assert.equal(getReputationTier(80).name, 'Untouchable');
}

// Locked travel
{
  const state = createInitialGameState();
  assert.equal(isLocationUnlocked(state, 'airport'), false);
  assert.equal(isLocationUnlocked(state, 'downtown'), true);
}

// Upgrade ordering
{
  assert.deepEqual(sanitizePurchasedUpgrades(['backpack']), []);
  assert.deepEqual(sanitizePurchasedUpgrades(['bigger_pockets', 'cargo_van']), ['bigger_pockets']);
  const prog = createInitialProgression();
  prog.purchasedInventoryUpgrades = ['bigger_pockets'];
  assert.equal(getNextInventoryUpgrade(prog)?.id, 'backpack');
}

// No negative cash on purchase
{
  let state = createInitialGameState();
  state = { ...state, player: { ...state.player, cash: 750 } };
  state = purchaseInventoryUpgrade(state);
  assert.equal(state.player.cash, 0);
  assert.ok(state.progression.purchasedInventoryUpgrades.includes('bigger_pockets'));
}

// Stash rules
{
  let state = createInitialGameState();
  state = { ...state, player: { ...state.player, cash: 5000 } };
  state = purchaseStashHouse(state, 'stash_downtown');
  assert.ok(state.progression.ownedStashHouses.includes('stash_downtown'));
  const again = purchaseStashHouse(state, 'stash_downtown');
  assert.equal(again.lastMessage, 'You already own this stash house.');
}

console.log('Phase 3 checks passed.');
