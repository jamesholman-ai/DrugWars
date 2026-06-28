/**
 * Dev smoke tests for store/profile idempotency.
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/game/storeSmokeTest.ts
 */
import { createDefaultPlayerProfile } from '../types/playerProfile';
import { grantProductCredits, tryConsumeCredit } from './consumableCredits';
import { grantPurchaseTransaction } from './profileStorage';
import { useCrewLoyaltyCredit, useBusinessRecoveryCredit } from './consumableUseSystem';
import { createInitialGameState } from './engine';
import { normalizeGameState } from './stateUtils';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runStoreSmokeTests(): void {
  let profile = createDefaultPlayerProfile();
  const txId = 'dev_intel_pack_10_test_1';

  const first = grantPurchaseTransaction(
    profile,
    {
      transactionId: txId,
      productId: 'intel_pack_10',
      platform: 'local_dev',
      purchasedAt: new Date().toISOString(),
      quantityGranted: 1,
    },
    (p) => grantProductCredits(p, 'intel_pack_10')
  );
  profile = first.profile;
  assert(!first.alreadyApplied, 'first grant should apply');
  assert(profile.consumables.intelRevealTokens === 10, 'intel should be 10');

  const dup = grantPurchaseTransaction(
    profile,
    {
      transactionId: txId,
      productId: 'intel_pack_10',
      platform: 'local_dev',
      purchasedAt: new Date().toISOString(),
      quantityGranted: 1,
    },
    (p) => grantProductCredits(p, 'intel_pack_10')
  );
  assert(dup.alreadyApplied, 'duplicate tx should not re-grant');
  assert(dup.profile.consumables.intelRevealTokens === 10, 'intel still 10 after dup');

  const consumed = tryConsumeCredit(profile, 'intelRevealTokens', 3);
  assert(consumed.ok, 'consume 3 ok');
  profile = consumed.profile;
  assert(profile.consumables.intelRevealTokens === 7, '7 tokens remain');

  let state = normalizeGameState(createInitialGameState());
  profile = grantProductCredits(profile, 'crew_loyalty_small');
  const noCrew = useCrewLoyaltyCredit(profile, state, 'small');
  assert(!noCrew.ok, 'crew loyalty blocked without crew');
  assert(
    noCrew.profile.consumables.crewLoyaltyCreditsSmall === 1,
    'credit not consumed when blocked'
  );

  profile = grantProductCredits(profile, 'business_recovery_small');
  const noBiz = useBusinessRecoveryCredit(profile, state, 'small');
  assert(!noBiz.ok, 'business recovery blocked without business');

  console.log('storeSmokeTest: all checks passed');
}
