import { GameState, PriceHistory, CommodityId } from '../types/game';
import { COMMODITIES } from '../data/commodities';
import { clamp } from '../utils/random';
import { withMessage, withMessages } from './messages';
import { checkGameOverState } from './engineHelpers';
import { applyProgressionAfterAction } from './progression';
import { getInventoryUsed } from './economy';
import { hasEquipment } from './combat';
import { getExtraHeatDecayAtLocation } from './progression';
import { getFixerHeatBonus, getFixerBribeBonus, getAccountantDebtReduction } from './crewBonuses';
import { getSafehouseHeatDecayBonus } from './safehouseSystem';
import { tickCrewPayroll, applyCrewEncounterRisk } from './crewSystem';
import { tickSafehouseUpkeep } from './safehouseSystem';
import { tickBusinessesOnDayAdvance } from './businessSystem';
import { tickMissionsOnDayAdvance } from './missionSystem';
import { spendMoney } from './money';
import { getPlayerAreaKey } from '../data/locations';
import { generateMarketPrices, DAILY_DEBT_INTEREST } from './engine';
import { tickWorldEventsOnDayAdvance } from './worldEvents';
import { rollEncounter } from './encounterSystem';

const LAY_LOW_COST = 500;
const BRIBE_COST = 1200;
const LAWYER_FEE = 2500;
const INFORMANT_COST = 800;
const EVIDENCE_DESTROY_PCT = 0.2;
const PRICE_HISTORY_LENGTH = 6;

function pushPriceHistory(
  history: PriceHistory,
  areaKey: string,
  areaPrices: Record<CommodityId, number>
): PriceHistory {
  const next: PriceHistory = { ...history };
  const prev = { ...(next[areaKey] ?? {}) };
  for (const commodity of COMMODITIES) {
    const price = areaPrices[commodity.id];
    if (price == null) continue;
    const chain = [...(prev[commodity.id] ?? []), price];
    prev[commodity.id] = chain.slice(-PRICE_HISTORY_LENGTH);
  }
  next[areaKey] = prev;
  return next;
}

function applyHeatReduction(state: GameState, amount: number): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      heat: clamp(state.player.heat - amount, 0, 100),
    },
  };
}

function advanceDayForHeatAction(
  state: GameState,
  message: string
): GameState {
  let pre = tickCrewPayroll(state);
  pre = tickSafehouseUpkeep(pre);
  pre = tickBusinessesOnDayAdvance(pre);
  pre = tickMissionsOnDayAdvance(pre);

  const areaKey = getPlayerAreaKey(pre.player);
  const extraHeatDecay = getExtraHeatDecayAtLocation(pre.progression, areaKey) + getSafehouseHeatDecayBonus(pre);
  const interest = Math.floor(pre.player.debt * DAILY_DEBT_INTEREST * (1 - getAccountantDebtReduction(pre)));

  let updated: GameState = {
    ...pre,
    player: checkGameOverState({
      ...pre,
      player: {
        ...pre.player,
        day: pre.player.day + 1,
        debt: pre.player.debt + interest,
        heat: clamp(pre.player.heat - 2 - extraHeatDecay, 0, 100),
        health: clamp(pre.player.health - 1, 0, 100),
        daysInJail: Math.max(0, pre.player.daysInJail - 1),
      },
    }).player,
  };

  updated = tickWorldEventsOnDayAdvance(updated);
  const marketPrices = generateMarketPrices(updated.activeWorldEvents);
  updated = {
    ...updated,
    marketPrices,
    priceHistory: Object.keys(marketPrices).reduce(
      (hist, key) => pushPriceHistory(hist, key, marketPrices[key]),
      updated.priceHistory
    ),
  };

  const messages = [
    message,
    interest > 0
      ? `Day ${updated.player.day}: Debt interest +$${interest}.`
      : `Day ${updated.player.day} begins.`,
  ];

  updated = withMessages(updated, messages);
  return checkGameOverState(updated);
}

export function layLow(state: GameState): GameState {
  if (state.player.isGameOver) return state;
  if (state.player.daysInJail > 0) {
    return withMessage(state, 'Cannot lay low while in jail.');
  }
  if (state.heatCooldowns?.layLowUntilDay >= state.player.day) {
    return withMessage(state, 'Already laying low this cycle.');
  }
  if (state.player.cash < LAY_LOW_COST) {
    return withMessage(state, `Lay low costs $${LAY_LOW_COST}.`);
  }

  const afterSpend = spendMoney(state.player, LAY_LOW_COST, true);
  if (!afterSpend) {
    return withMessage(state, `Lay low costs $${LAY_LOW_COST}.`);
  }

  let updated = advanceDayForHeatAction(
    {
      ...state,
      player: afterSpend,
      heatCooldowns: {
        ...(state.heatCooldowns ?? {
          layLowUntilDay: 0,
          bribePoliceUntilDay: 0,
          informantProtectionUntilDay: 0,
          safehouseUsedUntilDay: 0,
        }),
        layLowUntilDay: state.player.day + 1,
      },
    },
    `Laid low (−$${LAY_LOW_COST}). Heat drops. Day advances.`
  );

  updated = applyHeatReduction(updated, 18 + getFixerHeatBonus(updated) + getSafehouseHeatDecayBonus(updated));
  if (!updated.player.isGameOver) {
    updated = rollEncounter(updated, 'stay');
    updated = applyCrewEncounterRisk(updated);
  }
  return applyProgressionAfterAction(updated);
}

export function bribeLocalPolice(state: GameState): GameState {
  if (state.player.isGameOver) return state;
  if (state.heatCooldowns?.bribePoliceUntilDay >= state.player.day) {
    return withMessage(state, 'Bribe already in motion.');
  }
  if (state.player.cash < BRIBE_COST) {
    return withMessage(state, `Need $${BRIBE_COST} for the bribe.`);
  }

  const afterSpend = spendMoney(state.player, BRIBE_COST, true);
  if (!afterSpend) {
    return withMessage(state, `Need $${BRIBE_COST} for the bribe.`);
  }

  const backfire = state.player.heat >= 85 && Math.random() < 0.35;

  if (backfire) {
    let updated = withMessage(
      {
        ...state,
        player: {
          ...afterSpend,
          heat: clamp(state.player.heat + 12, 0, 100),
          federalCaseSeverity: clamp(state.player.federalCaseSeverity + 8, 0, 100),
        },
      },
      `Bribe backfired! Officer flagged you as corrupt. Heat +12. Lost $${BRIBE_COST}.`
    );
    return applyProgressionAfterAction(checkGameOverState(updated));
  }

  let updated = applyHeatReduction(
    {
      ...state,
      player: afterSpend,
      heatCooldowns: {
        ...(state.heatCooldowns ?? {
          layLowUntilDay: 0,
          bribePoliceUntilDay: 0,
          informantProtectionUntilDay: 0,
          safehouseUsedUntilDay: 0,
        }),
        bribePoliceUntilDay: state.player.day + 2,
      },
    },
    14
  );

  updated = withMessage(
    updated,
    `Bribed local police (−$${BRIBE_COST}). Heat −14. Eyes off you for now.`
  );
  return applyProgressionAfterAction(checkGameOverState(updated));
}

export function hireLawyerHeat(state: GameState): GameState {
  if (state.player.isGameOver) return state;
  if (state.player.cash < LAWYER_FEE) {
    return withMessage(state, `Lawyer fee: $${LAWYER_FEE}.`);
  }

  const hasRetainer = hasEquipment(state, 'lawyer_retainer');
  const fee = hasRetainer ? Math.floor(LAWYER_FEE * 0.5) : LAWYER_FEE;

  const afterSpend = spendMoney(state.player, fee, true);
  if (!afterSpend) {
    return withMessage(state, `Lawyer fee: $${fee}.`);
  }

  let updated: GameState = {
    ...state,
    player: {
      ...afterSpend,
      federalCaseSeverity: clamp(state.player.federalCaseSeverity - 15, 0, 100),
      heat: clamp(state.player.heat - 6, 0, 100),
    },
  };

  if (updated.player.legalStatus === 'federal_case' && updated.player.federalCaseSeverity < 25) {
    updated.player.legalStatus = 'arrested';
  } else if (updated.player.legalStatus === 'jailed') {
    updated.player.daysInJail = Math.max(0, updated.player.daysInJail - 2);
  }

  updated = withMessage(
    updated,
    `Lawyer engaged (−$${fee}). Federal severity −15. Legal heat cooling.`
  );
  return applyProgressionAfterAction(checkGameOverState(updated));
}

export function useSafehouse(state: GameState): GameState {
  if (state.player.isGameOver) return state;
  if ((state.ownedSafehouses ?? []).length === 0) {
    return withMessage(state, 'No property owned. Buy one from the Properties screen.');
  }
  if (state.heatCooldowns?.safehouseUsedUntilDay >= state.player.day) {
    return withMessage(state, 'Property hideout already used today.');
  }

  let updated = applyHeatReduction(
    {
      ...state,
      heatCooldowns: {
        ...(state.heatCooldowns ?? {
          layLowUntilDay: 0,
          bribePoliceUntilDay: 0,
          informantProtectionUntilDay: 0,
          safehouseUsedUntilDay: 0,
        }),
        safehouseUsedUntilDay: state.player.day + 1,
      },
    },
    10
  );

  updated = withMessage(
    updated,
    'Hid at your property. Heat −10. Stored inventory protected.'
  );
  return applyProgressionAfterAction(checkGameOverState(updated));
}

export function destroyEvidence(state: GameState): GameState {
  if (state.player.isGameOver) return state;
  const used = getInventoryUsed(state.player);
  if (used <= 0) {
    return withMessage(state, 'No inventory to destroy.');
  }

  const inventory = state.player.inventory
    .map((item) => ({
      ...item,
      quantity: Math.max(0, Math.floor(item.quantity * (1 - EVIDENCE_DESTROY_PCT))),
    }))
    .filter((item) => item.quantity > 0);

  let updated = applyHeatReduction(
    {
      ...state,
      player: { ...state.player, inventory },
    },
    12
  );

  updated = withMessage(
    updated,
    `Destroyed ${Math.round(EVIDENCE_DESTROY_PCT * 100)}% of stash as evidence. Heat −12.`
  );
  return applyProgressionAfterAction(checkGameOverState(updated));
}

export function payInformant(state: GameState): GameState {
  if (state.player.isGameOver) return state;
  const afterSpend = spendMoney(state.player, INFORMANT_COST, true);
  if (!afterSpend) {
    return withMessage(state, `Informant costs $${INFORMANT_COST}.`);
  }

  let updated: GameState = {
    ...state,
    player: {
      ...afterSpend,
      heat: clamp(state.player.heat - 4, 0, 100),
    },
    heatCooldowns: {
      ...(state.heatCooldowns ?? {
        layLowUntilDay: 0,
        bribePoliceUntilDay: 0,
        informantProtectionUntilDay: 0,
        safehouseUsedUntilDay: 0,
      }),
      informantProtectionUntilDay: state.player.day + 3,
    },
  };

  updated = withMessage(
    updated,
    `Paid informant (−$${INFORMANT_COST}). Police/DEA encounter chance reduced for 3 days.`
  );
  return applyProgressionAfterAction(checkGameOverState(updated));
}

export function useBurnerPhone(state: GameState): GameState {
  if (!hasEquipment(state, 'burner_phone')) {
    return withMessage(state, 'No burner phone.');
  }

  let equipment = [...(state.equipment ?? [])];
  const idx = equipment.findIndex((e) => e.equipmentId === 'burner_phone');
  if (idx < 0) return state;

  const item = equipment[idx];
  const uses = (item.usesRemaining ?? 6) - 1;
  if (uses <= 0) {
    equipment = equipment.filter((_, i) => i !== idx);
  } else {
    equipment = equipment.map((e, i) =>
      i === idx ? { ...e, usesRemaining: uses } : e
    );
  }

  let updated = applyHeatReduction(
    { ...state, equipment },
    10
  );

  updated = withMessage(updated, 'Dumped burner. Heat −10. Line gone.');
  return applyProgressionAfterAction(checkGameOverState(updated));
}
