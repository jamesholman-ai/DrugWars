import {
  ActiveWorldEvent,
  AreaId,
  CommodityId,
  GameState,
  InventoryItem,
  MarketPrices,
  PlayerState,
  PriceHistory,
  createEmptyMemoryFlags,
  createDefaultHeatCooldowns,
  createDefaultPlayerLegalFields,
} from '../types/game';
import { COMMODITIES, COMMODITY_MAP } from '../data/commodities';
import {
  AREA_MAP,
  CITIES,
  CITY_MAP,
  STARTING_AREA_ID,
  STARTING_CITY_ID,
  getAreaKey,
  getAreaLabel,
  getAreasForCity,
  getDefaultAreaForCity,
  getPlayerAreaKey,
  isAirportArea,
} from '../data/locations';
import {
  adjustLocalHeat,
  ensureAreaBelongsToCity,
  rollAreaFlavorMessage,
  getAreaOwnership,
  createDefaultAreaOwnership,
  createDefaultLocalHeat,
} from './territory';
import { refreshSupplierOffers } from './supplierSystem';
import { generateContractOffers, tickContractsOnDayAdvance } from './contractSystem';
import { tickCrewEmpire, refreshCrewRecruits, applyCrewEncounterRisk } from './crewSystem';
import { tickSafehouseUpkeep, getSafehouseHeatDecayBonus } from './safehouseSystem';
import { rollPropertyDailyEvents } from './propertyManagementSystem';
import { tickBusinessesOnDayAdvance } from './businessSystem';
import { trackMissionEvent, tickMissionsOnDayAdvance, initializeMissionState, syncMissionState } from './missionSystem';
import {
  initializeIntelState,
  tryTriggerIntelReveal,
  tickIntelOnDayAdvance,
} from './intelSystem';
import { purgeExpiredStoreBoosts } from './storeInventory';
import { applyFirstSessionMarketBoost, createDefaultTutorial } from './tutorialSystem';
import type { MissionEvent } from '../types/missions';
import { appendFinanceLog } from './financeSystem';
import { addDirtyMoney, normalizeMoneyFields, spendMoney } from './money';
import { getAccountantDebtReduction, getDealerSaleBonus, getFixerHeatBonus, getFixerBribeBonus } from './crewBonuses';
import { rollRandomEvent } from '../data/events';
import { rollEncounter, isEncounterChoice } from './encounterSystem';
import { resolveEncounterChoice } from './encounterResolver';
import { clamp, generateCommodityPrice } from '../utils/random';
import { withMessage, withMessages } from './messages';
import { checkGameOverPlayer, checkGameOverState } from './engineHelpers';
import { resolveEventChoice } from './eventResolver';
import { normalizeGameState } from './stateUtils';
import {
  applyWorldEventsToPrices,
  getCombinedHeatMultiplier,
  isTravelBlocked,
  scalePositiveHeat,
  tickWorldEventsOnDayAdvance,
} from './worldEvents';
import {
  applyProgressionAfterAction,
  addLifetimeProfit,
  createInitialProgression,
  getExtraHeatDecayAtLocation,
  getCityUnlockHint,
  isCityUnlocked,
  syncProgression,
} from './progression';
import { BASE_INVENTORY_CAPACITY } from '../data/progression';
import { getInventoryUsed, getNetWorth } from './economy';
import { getInventoryLoadFactor } from './combat';
import { DAILY_DEBT_INTEREST } from './debtConstants';
import {
  AREA_MOVES_BEFORE_DAY_ADVANCE,
  logDebtInterest,
  payDebtTowardLoan,
  recordAreaMove,
  resetAreaMovesOnDayAdvance,
  createDefaultFinanceFields,
} from './financeSystem';

export { getNetWorth, getInventoryUsed };
export { resolveEventChoice };

const STARTING_CASH = 2800;
const STARTING_DEBT = 4500;
const HEAT_DECAY = 3;
const MAX_DEBT = 50000;
const BORROW_AMOUNTS = [1000, 2500, 5000] as const;
const PRICE_HISTORY_LENGTH = 6;

export { BORROW_AMOUNTS };
export { DAILY_DEBT_INTEREST } from './debtConstants';

function generateAreaPrices(
  cityId: string,
  areaId: AreaId,
  activeEvents: ActiveWorldEvent[] = [],
  random: () => number = Math.random
): Record<CommodityId, number> {
  const city = CITY_MAP[cityId];
  const area = AREA_MAP[areaId];
  if (!city || !area) {
    return {} as Record<CommodityId, number>;
  }

  const prices = {} as Record<CommodityId, number>;
  for (const commodity of COMMODITIES) {
    prices[commodity.id] = generateCommodityPrice(commodity, city, area, random);
  }

  const areaKey = getAreaKey(cityId, areaId);
  const wrapped: MarketPrices = { [areaKey]: prices };
  const adjusted = applyWorldEventsToPrices(wrapped, activeEvents);
  return adjusted[areaKey] ?? prices;
}

export function generateMarketPrices(
  activeEvents: ActiveWorldEvent[] = [],
  random: () => number = Math.random
): MarketPrices {
  const prices: MarketPrices = {};

  for (const city of CITIES) {
    for (const area of getAreasForCity(city.id)) {
      const key = getAreaKey(city.id, area.id);
      prices[key] = generateAreaPrices(city.id, area.id, activeEvents, random);
    }
  }

  return prices;
}

/** Fast bootstrap — only prices for the starting area (rest generated on travel/day advance). */
export function generateStartingMarketPrices(
  activeEvents: ActiveWorldEvent[] = [],
  random: () => number = Math.random
): MarketPrices {
  const key = getAreaKey(STARTING_CITY_ID, STARTING_AREA_ID);
  return {
    [key]: generateAreaPrices(STARTING_CITY_ID, STARTING_AREA_ID, activeEvents, random),
  };
}

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

function refreshAreaMarket(
  state: GameState,
  cityId: string,
  areaId: AreaId,
  random: () => number = Math.random
): GameState {
  const areaKey = getAreaKey(cityId, areaId);
  const areaPrices = generateAreaPrices(cityId, areaId, state.activeWorldEvents, random);
  return {
    ...state,
    marketPrices: {
      ...state.marketPrices,
      [areaKey]: areaPrices,
    },
    priceHistory: pushPriceHistory(state.priceHistory, areaKey, areaPrices),
  };
}

export function createInitialPlayerState(): PlayerState {
  return normalizeMoneyFields({
    cash: STARTING_CASH,
    dirtyCash: STARTING_CASH,
    cleanCash: 0,
    debt: STARTING_DEBT,
    health: 100,
    heat: 10,
    reputation: 20,
    day: 1,
    currentCityId: STARTING_CITY_ID,
    currentAreaId: STARTING_AREA_ID,
    inventoryCapacity: BASE_INVENTORY_CAPACITY,
    inventory: [],
    isGameOver: false,
    ...createDefaultPlayerLegalFields(),
  });
}

export function createInitialGameState(): GameState {
  const label = getAreaLabel(STARTING_CITY_ID, STARTING_AREA_ID);
  const marketPrices = generateStartingMarketPrices();
  const areaKey = getAreaKey(STARTING_CITY_ID, STARTING_AREA_ID);

  const state: GameState = {
    player: createInitialPlayerState(),
    marketPrices,
    priceHistory: pushPriceHistory({}, areaKey, marketPrices[areaKey]),
    pendingEvent: null,
    memoryFlags: createEmptyMemoryFlags(),
    npcRelations: {},
    activeWorldEvents: [],
    progression: createInitialProgression(),
    equipment: [],
    cartelStanding: 0,
    cartelBetrayals: 0,
    localHeatByCity: createDefaultLocalHeat(),
    areaOwnership: createDefaultAreaOwnership(),
    supplierRelationships: {},
    supplierOffers: [],
    contractOffers: [],
    activeContracts: [],
    completedContracts: [],
    failedContracts: [],
    availableCrew: [],
    hiredCrew: [],
    crewHistory: [],
    ownedSafehouses: [],
    storedInventoryBySafehouse: {},
    ownedBusinesses: [],
    businessHistory: [],
    businessRaids: [],
    lastDaySummary: null,
    heatCooldowns: createDefaultHeatCooldowns(),
    encounterHistory: [],
    lastMessage: `Day 1 — You arrive in ${label} with $${STARTING_CASH} and $${STARTING_DEBT} debt. Local buyers are hot — check the market.`,
    messageLog: [
      `Day 1 — New run in ${label}. Demand surge active 3 days.`,
      `Loan shark expects $${STARTING_DEBT}. Pay early when you can — interest is 2.5%/day.`,
      `Mission: Make your first sale, then claim the reward on the Hub.`,
    ],
    tutorial: createDefaultTutorial(false),
    ...createDefaultFinanceFields(1),
  };
  let stateWithMissions = initializeMissionState(state);
  stateWithMissions = initializeIntelState(stateWithMissions);
  stateWithMissions = applyFirstSessionMarketBoost(stateWithMissions);
  return syncProgression(generateContractOffers(stateWithMissions));
}

function getInventoryCount(inventory: InventoryItem[]): number {
  return inventory.reduce((sum, item) => sum + item.quantity, 0);
}

function getInventoryItem(
  inventory: InventoryItem[],
  commodityId: CommodityId
): InventoryItem | undefined {
  return inventory.find((item) => item.commodityId === commodityId);
}

function checkGameOver(player: PlayerState): PlayerState {
  return checkGameOverPlayer(player);
}

function tryRollEncounterOrLegacy(
  state: GameState,
  encounterContext: 'stay' | 'areaTravel' | 'cityTravel' | 'marketAction',
  legacyTrigger: 'travel' | 'rest' | 'day_advance'
): GameState {
  let updated = rollEncounter(state, encounterContext);
  if (!updated.pendingEvent) {
    updated = rollRandomEvent(updated, legacyTrigger);
  }
  return checkGameOverState(updated);
}

function finalizeAction(state: GameState, event?: MissionEvent): GameState {
  const updated = event ? trackMissionEvent(state, event) : syncMissionState(state);
  return applyProgressionAfterAction(updated);
}

function refreshDealsAtLocation(state: GameState): GameState {
  let updated = refreshSupplierOffers(state);
  updated = generateContractOffers(updated);
  updated = refreshCrewRecruits(updated);
  return updated;
}

function tickEmpireBeforeDayAdvance(state: GameState): GameState {
  let updated = tickCrewEmpire(state);
  updated = tickSafehouseUpkeep(updated);
  updated = rollPropertyDailyEvents(updated);
  updated = tickBusinessesOnDayAdvance(updated);
  return updated;
}

function applyDailyUpkeep(player: PlayerState, extraHeatDecay = 0, debtRate = DAILY_DEBT_INTEREST): PlayerState {
  const debtInterest = Math.floor(player.debt * debtRate);
  const updated: PlayerState = {
    ...player,
    day: player.day + 1,
    debt: player.debt + debtInterest,
    heat: clamp(player.heat - HEAT_DECAY - extraHeatDecay, 0, 100),
    health: clamp(player.health - 1, 0, 100),
  };

  return checkGameOver(updated);
}

function advanceDayState(
  state: GameState,
  dayMessage: string,
  random: () => number = Math.random
): GameState {
  const debtRate = DAILY_DEBT_INTEREST * (1 - getAccountantDebtReduction(state));
  const interest = Math.floor(state.player.debt * debtRate);
  const areaKey = getPlayerAreaKey(state.player);
  const extraHeatDecay =
    getExtraHeatDecayAtLocation(state.progression, areaKey) +
    getSafehouseHeatDecayBonus(state);

  let updated = tickEmpireBeforeDayAdvance(state);

  updated = {
    ...updated,
    player: applyDailyUpkeep(updated.player, extraHeatDecay, debtRate),
  };

  updated = tickWorldEventsOnDayAdvance(updated, random);
  if ((updated.activeWorldEvents ?? []).length > 0) {
    updated = tryTriggerIntelReveal(updated, 'world_event', random);
  }
  const marketPrices = generateMarketPrices(updated.activeWorldEvents, random);
  updated = {
    ...updated,
    marketPrices,
    priceHistory: Object.keys(marketPrices).reduce<PriceHistory>((hist, key) => {
      return pushPriceHistory(hist, key, marketPrices[key]);
    }, updated.priceHistory),
  };

  const messages = [
    dayMessage,
    interest > 0
      ? `Day ${updated.player.day}: Debt interest +$${interest}. New prices worldwide.`
      : `Day ${updated.player.day}: New prices worldwide.`,
  ];

  updated = withMessages(updated, messages);
  updated = { ...updated, player: checkGameOver(updated.player) };
  updated = tickContractsOnDayAdvance(updated);
  updated = tickMissionsOnDayAdvance(updated);
  updated = tickIntelOnDayAdvance(updated);
  updated = purgeExpiredStoreBoosts(updated);
  if (interest > 0) {
    updated = logDebtInterest(updated, interest);
  }
  return resetAreaMovesOnDayAdvance(updated);
}

function heatFromTrade(
  state: GameState,
  riskLevel: number,
  quantity: number,
  buying: boolean
): number {
  const multiplier = buying ? 0.55 : 0.32;
  const base = Math.max(1, Math.round(riskLevel * quantity * multiplier));
  const areaKey = getPlayerAreaKey(state.player);
  const heatMult = getCombinedHeatMultiplier(state, areaKey);
  return scalePositiveHeat(base, heatMult);
}

function reputationFromProfit(profit: number, riskLevel: number): number {
  if (profit <= 0) return 0;
  const base = Math.floor(profit / 400) + 1;
  return Math.min(8, base + Math.floor(riskLevel / 2));
}

function getCurrentPrices(state: GameState): Record<CommodityId, number> | undefined {
  return state.marketPrices[getPlayerAreaKey(state.player)];
}

export function buyCommodity(
  state: GameState,
  commodityId: CommodityId,
  quantity: number
): GameState {
  if (quantity <= 0 || state.player.isGameOver) {
    return state;
  }

  const commodity = COMMODITY_MAP[commodityId];
  const price = getCurrentPrices(state)?.[commodityId];

  if (!commodity || !price) {
    return withMessage(state, 'Cannot buy — price unavailable.');
  }

  const totalCost = price * quantity;

  if (state.player.cash < totalCost) {
    return withMessage(
      state,
      `Not enough cash. Need $${totalCost}, have $${state.player.cash}.`
    );
  }

  const currentCount = getInventoryCount(state.player.inventory);
  if (currentCount + quantity > state.player.inventoryCapacity) {
    const space = state.player.inventoryCapacity - currentCount;
    return withMessage(
      state,
      `Inventory full (${currentCount}/${state.player.inventoryCapacity}). Only ${space} slots left.`
    );
  }

  const inventory = state.player.inventory.map((item) => {
    if (item.commodityId !== commodityId) {
      return item;
    }
    const totalQty = item.quantity + quantity;
    return {
      ...item,
      quantity: totalQty,
      avgCost: Math.round(
        (item.avgCost * item.quantity + price * quantity) / totalQty
      ),
    };
  });

  const hasItem = state.player.inventory.some((i) => i.commodityId === commodityId);
  const nextInventory = hasItem
    ? inventory
    : [...inventory, { commodityId, quantity, avgCost: price }];

  const heatGain = heatFromTrade(state, commodity.riskLevel, quantity, true);

  return finalizeAction(
    withMessage(
      {
        ...state,
        player: checkGameOver({
          ...state.player,
          cash: state.player.cash - totalCost,
          heat: clamp(state.player.heat + heatGain, 0, 100),
          inventory: nextInventory,
        }),
      },
      `Bought ${quantity} ${commodity.name} @ $${price}/ea ($${totalCost} total). Heat +${heatGain}.`
    )
  );
}

export function sellCommodity(
  state: GameState,
  commodityId: CommodityId,
  quantity: number
): GameState {
  if (quantity <= 0 || state.player.isGameOver) {
    return state;
  }

  const commodity = COMMODITY_MAP[commodityId];
  const existing = getInventoryItem(state.player.inventory, commodityId);

  if (!existing || existing.quantity < quantity) {
    const have = existing?.quantity ?? 0;
    return withMessage(
      state,
      `Cannot sell ${quantity} ${commodity?.name ?? 'item'} — you only have ${have}.`
    );
  }

  const price = getCurrentPrices(state)?.[commodityId];
  if (!price || !commodity) {
    return withMessage(state, 'Cannot sell — price unavailable.');
  }

  const dealerMult = 1 + getDealerSaleBonus(state);
  const totalGain = Math.round(price * quantity * dealerMult);
  const profit = (price - existing.avgCost) * quantity;
  const heatGain = heatFromTrade(state, commodity.riskLevel, quantity, false);
  const repGain = reputationFromProfit(profit, commodity.riskLevel);

  const inventory = state.player.inventory
    .map((item) =>
      item.commodityId === commodityId
        ? { ...item, quantity: item.quantity - quantity }
        : item
    )
    .filter((item) => item.quantity > 0);

  const profitLabel =
    profit >= 0 ? `Profit $${profit}` : `Loss $${Math.abs(profit)}`;
  const repLabel = repGain > 0 ? ` Rep +${repGain}.` : '';

  let updated = withMessage(
    {
      ...state,
      player: checkGameOver(
        addDirtyMoney(
          {
            ...state.player,
            heat: clamp(state.player.heat + heatGain, 0, 100),
            reputation: clamp(state.player.reputation + repGain, 0, 100),
            inventory,
          },
          totalGain
        )
      ),
    },
    `Sold ${quantity} ${commodity.name} @ $${price}/ea ($${totalGain} total, dirty). ${profitLabel}.${repLabel} Heat +${heatGain}.`
  );

  if (profit > 0) {
    updated = addLifetimeProfit(updated, profit);
  }

  if (
    !updated.player.isGameOver &&
    getInventoryLoadFactor(updated) > 0.4 &&
    Math.random() < 0.1
  ) {
    updated = tryRollEncounterOrLegacy(updated, 'marketAction', 'day_advance');
  }

  return finalizeAction(updated, {
    kind: 'sell',
    quantity,
    profit,
    commodityId,
  });
}

/** Move to another area in the same city — does NOT advance the day. */
export function travelToArea(
  state: GameState,
  areaId: AreaId
): GameState {
  if (state.player.isGameOver) {
    return state;
  }

  if (areaId === state.player.currentAreaId) {
    return withMessage(state, 'You are already in this area.');
  }

  const area = AREA_MAP[areaId];
  if (!area) {
    return withMessage(state, 'Unknown area.');
  }

  if (!ensureAreaBelongsToCity(state.player.currentCityId, areaId)) {
    return withMessage(state, 'That area is not in your current city.');
  }

  const areaKey = getAreaKey(state.player.currentCityId, areaId);
  const block = isTravelBlocked(state, areaKey);
  if (block.blocked) {
    return withMessage(state, block.reason ?? 'Travel blocked.');
  }

  if (state.player.cash < area.travelCost) {
    return withMessage(
      state,
      `Cannot travel — need $${area.travelCost}, have $${state.player.cash}.`
    );
  }

  const afterTravelSpend = spendMoney(state.player, area.travelCost, true);
  if (!afterTravelSpend) {
    return withMessage(
      state,
      `Cannot travel — need $${area.travelCost}, have $${state.player.cash}.`
    );
  }

  const travelHeatMult = getCombinedHeatMultiplier(state, areaKey);

  let updated: GameState = {
    ...state,
    player: {
      ...afterTravelSpend,
      currentAreaId: areaId,
      heat: clamp(
        state.player.heat +
          scalePositiveHeat(Math.round(2 * area.riskModifier), travelHeatMult),
        0,
        100
      ),
    },
  };

  updated = refreshAreaMarket(updated, state.player.currentCityId, areaId);

  const owner = getAreaOwnership(updated, state.player.currentCityId, areaId);
  const flavor = rollAreaFlavorMessage(updated, area.name, owner);
  const baseMsg =
    flavor ?? `Moved to ${area.name} (-$${area.travelCost}).`;

  updated = {
    ...updated,
    localHeatByCity: adjustLocalHeat(updated, state.player.currentCityId, 1),
  };

  if (!updated.player.isGameOver) {
    updated = tryRollEncounterOrLegacy(updated, 'areaTravel', 'travel');
    updated = applyCrewEncounterRisk(updated);
  }

  updated = refreshDealsAtLocation(updated);
  updated = tryTriggerIntelReveal(updated, 'travel_area');

  const { state: afterMove, movesToday, triggersDayAdvance } = recordAreaMove(updated);

  if (triggersDayAdvance) {
    let advanced = advanceDayState(
      afterMove,
      `${baseMsg} Third area move — day advances.`
    );
    if (!advanced.player.isGameOver) {
      advanced = tryRollEncounterOrLegacy(advanced, 'areaTravel', 'day_advance');
      advanced = applyCrewEncounterRisk(advanced);
    }
    return finalizeAction(advanced);
  }

  return finalizeAction(
    withMessage(
      afterMove,
      `${baseMsg} Area moves today: ${movesToday} / ${AREA_MOVES_BEFORE_DAY_ADVANCE}. 3rd area move advances the day.`
    )
  );
}

/** Move to another city — advances the day. */
export function travelToCity(
  state: GameState,
  cityId: string,
  areaId?: AreaId
): GameState {
  const destAreaId =
    areaId ?? getDefaultAreaForCity(cityId)?.id ?? `${cityId}_downtown`;
  if (state.player.isGameOver) {
    return state;
  }

  if (cityId === state.player.currentCityId && destAreaId === state.player.currentAreaId) {
    return withMessage(state, 'You are already here.');
  }

  const city = CITY_MAP[cityId];
  const area = AREA_MAP[destAreaId] ?? getAreasForCity(cityId).find((a) => a.id === destAreaId);
  if (!city || !area) {
    return withMessage(state, 'Unknown destination.');
  }

  const areaKey = getAreaKey(cityId, destAreaId);
  const block = isTravelBlocked(state, areaKey);
  if (block.blocked) {
    return withMessage(state, block.reason ?? 'Travel blocked.');
  }

  if (!isCityUnlocked(state, cityId)) {
    return withMessage(state, getCityUnlockHint(cityId));
  }

  const intraAreaCost =
    cityId === state.player.currentCityId ? area.travelCost : 0;
  const totalCost = city.travelCost + intraAreaCost;

  if (state.player.cash < totalCost) {
    return withMessage(
      state,
      `Cannot travel to ${city.name} — need $${totalCost}, have $${state.player.cash}.`
    );
  }

  const afterTravelSpend = spendMoney(state.player, totalCost, true);
  if (!afterTravelSpend) {
    return withMessage(
      state,
      `Cannot travel to ${city.name} — need $${totalCost}, have $${state.player.cash}.`
    );
  }

  const travelHeatMult = getCombinedHeatMultiplier(state, areaKey);

  let updated: GameState = {
    ...state,
    player: {
      ...afterTravelSpend,
      currentCityId: cityId,
      currentAreaId: destAreaId,
      heat: clamp(
        state.player.heat +
          scalePositiveHeat(
            Math.round(5 * city.riskModifier * area.riskModifier),
            travelHeatMult
          ),
        0,
        100
      ),
    },
  };

  updated = advanceDayState(
    updated,
    `Traveled to ${getAreaLabel(cityId, destAreaId)} (-$${totalCost}). Day advances.`
  );

  if (!updated.player.isGameOver) {
    updated = tryRollEncounterOrLegacy(updated, 'cityTravel', 'travel');
  }

  const localHeat = { ...(updated.localHeatByCity ?? {}) };
  if (cityId !== state.player.currentCityId) {
    const prevLocal = localHeat[state.player.currentCityId] ?? updated.player.heat;
    localHeat[state.player.currentCityId] = Math.max(0, prevLocal - 8);
    localHeat[cityId] = (localHeat[cityId] ?? 0) + 4;
    updated = { ...updated, localHeatByCity: localHeat };
  }

  updated = refreshDealsAtLocation(updated);
  updated = tryTriggerIntelReveal(updated, 'travel_city');
  return finalizeAction(updated, { kind: 'travel_city', cityId });
}
export function stayHere(state: GameState): GameState {
  if (state.player.isGameOver) {
    return state;
  }

  const { currentCityId, currentAreaId } = state.player;
  const areaName = AREA_MAP[currentAreaId]?.name ?? 'area';

  let updated = advanceDayState(
    state,
    `Stayed in ${areaName}. Day advances — interest, payroll, and upkeep apply.`
  );

  if (!updated.player.isGameOver) {
    updated = tryRollEncounterOrLegacy(updated, 'stay', 'day_advance');
    updated = applyCrewEncounterRisk(updated);
  }

  updated = refreshDealsAtLocation(updated);
  updated = tryTriggerIntelReveal(updated, 'stay');
  return finalizeAction(updated);
}

/** @deprecated Use travelToArea or travelToCity */
export function travelToLocation(state: GameState, locationId: string): GameState {
  return travelToArea(state, locationId as AreaId);
}

export function payDebt(state: GameState, amount: number): GameState {
  return payDebtTowardLoan(state, amount);
}

export function borrowMoney(state: GameState, amount: number): GameState {
  if (state.player.isGameOver) {
    return state;
  }

  if (!BORROW_AMOUNTS.includes(amount as (typeof BORROW_AMOUNTS)[number])) {
    return withMessage(state, 'Invalid borrow amount.');
  }

  if (state.player.debt + amount > MAX_DEBT) {
    return withMessage(
      state,
      `Loan shark won't go above $${MAX_DEBT} total debt. Current: $${state.player.debt}.`
    );
  }

  const repPenalty = amount >= 5000 ? 2 : 1;

  let player = addDirtyMoney(state.player, amount);
  player = normalizeMoneyFields({
    ...player,
    debt: state.player.debt + amount,
    heat: clamp(state.player.heat + 8, 0, 100),
    reputation: clamp(state.player.reputation - repPenalty, 0, 100),
  });

  let updated = withMessage(
    {
      ...state,
      player,
    },
    `Borrowed $${amount}. Debt now $${state.player.debt + amount}. Heat +8. Rep -${repPenalty}.`
  );

  updated = appendFinanceLog(
    updated,
    'borrow',
    amount,
    `Borrowed $${amount.toLocaleString()} from the loan shark.`
  );

  return updated;
}

export function restDay(state: GameState): GameState {
  if (state.player.isGameOver) {
    return state;
  }

  const area = AREA_MAP[state.player.currentAreaId];
  const healCost = area?.healCost ?? 200;

  if (state.player.health >= 100) {
    return withMessage(state, 'You feel fine. No need to rest.');
  }

  if (state.player.cash < healCost) {
    return withMessage(
      state,
      `Cannot rest — need $${healCost} for a safe hideout and supplies.`
    );
  }

  const afterSpend = spendMoney(state.player, healCost, true);
  if (!afterSpend) {
    return withMessage(
      state,
      `Cannot rest — need $${healCost} for a safe hideout and supplies.`
    );
  }

  const healAmount = Math.min(100 - state.player.health, 30);

  let updated: GameState = {
    ...state,
    player: {
      ...afterSpend,
      health: clamp(state.player.health + healAmount, 0, 100),
      heat: clamp(state.player.heat - 6, 0, 100),
    },
  };

  updated = advanceDayState(
    updated,
    `Rested at a motel (-$${healCost}). Health +${healAmount}. Heat -6. Day advances.`
  );

  if (!updated.player.isGameOver) {
    updated = rollRandomEvent(updated, 'rest');
    updated = { ...updated, player: checkGameOver(updated.player) };
  }

  return finalizeAction(updated);
}

export function chooseEventOption(state: GameState, choiceId: string): GameState {
  const normalized = normalizeGameState(state);
  if (!normalized.pendingEvent) {
    return normalized;
  }
  if (isEncounterChoice(choiceId)) {
    return resolveEncounterChoice(normalized, choiceId);
  }
  return finalizeAction(resolveEventChoice(normalized, choiceId));
}

export function getMaxBorrow(player: PlayerState): number {
  return Math.max(0, MAX_DEBT - player.debt);
}
