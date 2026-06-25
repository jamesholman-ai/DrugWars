import { GameState, MarketPrices, PlayerState } from '../types/game';
import {
  InventoryUpgradeDefinition,
  ProgressionState,
  RankDefinition,
  RankId,
  ReputationTierDefinition,
} from '../types/progression';
import {
  BASE_INVENTORY_CAPACITY,
  CITY_UNLOCK_REQUIREMENTS,
  INVENTORY_UPGRADES,
  INVENTORY_UPGRADE_MAP,
  RANKS,
  RANK_MAP,
  REPUTATION_TIERS,
  STASH_HOUSE_MAP,
  STASH_HOUSES,
  STARTING_UNLOCKED_CITIES,
  getStashAreaKey,
} from '../data/progression';
import {
  CITIES as ALL_CITIES,
  CITY_MAP,
  LEGACY_LOCATION_TO_CITY_AREA,
} from '../data/locations';
import { getNetWorth } from './economy';
import { withMessage } from './messages';
import { getPlayerAreaKey } from '../data/locations';
import { getRunnerCapacityBonus } from './crewBonuses';
import { getSafehouseRobberyProtection } from './safehouseSystem';

export function createInitialProgression(): ProgressionState {
  return {
    rankId: 'wannabe',
    lifetimeProfit: 0,
    unlockedCities: [...STARTING_UNLOCKED_CITIES],
    ownedStashHouses: [],
    purchasedInventoryUpgrades: [],
  };
}

export function getReputationTier(reputation: number): ReputationTierDefinition {
  let tier = REPUTATION_TIERS[0];
  for (const entry of REPUTATION_TIERS) {
    if (reputation >= entry.minReputation) {
      tier = entry;
    }
  }
  return tier;
}

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function meetsRequirements(
  req: RankDefinition['requirements'],
  stats: {
    reputation: number;
    netWorth: number;
    lifetimeProfit: number;
    daysSurvived: number;
  }
): boolean {
  if (req.reputation != null && stats.reputation < req.reputation) return false;
  if (req.netWorth != null && stats.netWorth < req.netWorth) return false;
  if (req.lifetimeProfit != null && stats.lifetimeProfit < req.lifetimeProfit) {
    return false;
  }
  if (req.daysSurvived != null && stats.daysSurvived < req.daysSurvived) return false;
  return true;
}

export function computeRankId(
  player: PlayerState,
  progression: ProgressionState,
  marketPrices: MarketPrices
): RankId {
  const stats = {
    reputation: player.reputation,
    netWorth: getNetWorth(player, marketPrices),
    lifetimeProfit: progression.lifetimeProfit,
    daysSurvived: player.day,
  };

  let best: RankId = 'wannabe';
  for (const rank of RANKS) {
    if (meetsRequirements(rank.requirements, stats)) {
      best = rank.id;
    }
  }
  return best;
}

export function getCurrentRank(state: GameState): RankDefinition {
  return RANK_MAP[state.progression.rankId] ?? RANK_MAP.wannabe;
}

export function getNextRank(rankId: RankId): RankDefinition | null {
  const idx = rankIndex(rankId);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

export function getRankProgress(
  state: GameState
): { current: RankDefinition; next: RankDefinition | null; stats: Record<string, number> } {
  const stats = {
    reputation: state.player.reputation,
    netWorth: getNetWorth(state.player, state.marketPrices),
    lifetimeProfit: state.progression.lifetimeProfit,
    daysSurvived: state.player.day,
  };
  return {
    current: getCurrentRank(state),
    next: getNextRank(state.progression.rankId),
    stats,
  };
}

function meetsCityUnlock(cityId: string, state: GameState): boolean {
  if (STARTING_UNLOCKED_CITIES.includes(cityId as (typeof STARTING_UNLOCKED_CITIES)[number])) {
    return true;
  }

  const req = CITY_UNLOCK_REQUIREMENTS[cityId];
  if (!req) return true;

  const { player, progression, marketPrices } = state;
  const netWorth = getNetWorth(player, marketPrices);
  const rankIdx = rankIndex(progression.rankId);
  const requiredRankIdx = req.rankId ? rankIndex(req.rankId) : -1;

  if (requiredRankIdx >= 0 && rankIdx >= requiredRankIdx) return true;
  if (req.reputation != null && player.reputation >= req.reputation) return true;
  if (req.cash != null && player.cash >= req.cash) return true;
  if (req.netWorth != null && netWorth >= req.netWorth) return true;
  if (req.daysSurvived != null && player.day >= req.daysSurvived) return true;

  return false;
}

export function getCityUnlockHint(cityId: string): string {
  const req = CITY_UNLOCK_REQUIREMENTS[cityId];
  const cityName = CITY_MAP[cityId]?.name ?? cityId;
  if (!req) return `${cityName} is available`;

  const parts: string[] = [];
  if (req.rankId) parts.push(`${RANK_MAP[req.rankId]?.name ?? req.rankId} rank`);
  if (req.reputation != null) parts.push(`${req.reputation}+ rep`);
  if (req.cash != null) parts.push(`$${req.cash} cash`);
  if (req.netWorth != null) parts.push(`$${req.netWorth} net worth`);
  if (req.daysSurvived != null) parts.push(`day ${req.daysSurvived}+`);

  return `${cityName} locked — ${parts.join(' · ')} (any)`;
}

export function isCityUnlocked(state: GameState, cityId: string): boolean {
  return state.progression.unlockedCities.includes(cityId);
}

/** @deprecated Use isCityUnlocked */
export function isLocationUnlocked(state: GameState, locationId: string): boolean {
  const mapped = LEGACY_LOCATION_TO_CITY_AREA[locationId];
  if (mapped) return isCityUnlocked(state, mapped.cityId);
  return state.progression.unlockedCities.includes(locationId);
}

/** @deprecated Use getCityUnlockHint */
export function getLocationUnlockHint(locationId: string): string {
  const mapped = LEGACY_LOCATION_TO_CITY_AREA[locationId];
  if (mapped) return getCityUnlockHint(mapped.cityId);
  return getCityUnlockHint(locationId);
}

export function computeUnlockedCities(state: GameState): string[] {
  const unlocked = new Set<string>([
    ...STARTING_UNLOCKED_CITIES,
    ...state.progression.unlockedCities,
    state.player.currentCityId,
  ]);

  for (const city of ALL_CITIES) {
    if (meetsCityUnlock(city.id, state)) {
      unlocked.add(city.id);
    }
  }

  return ALL_CITIES.filter((c) => unlocked.has(c.id)).map((c) => c.id);
}

export function sanitizePurchasedUpgrades(purchased: string[]): string[] {
  const valid: string[] = [];
  for (const upgrade of INVENTORY_UPGRADES) {
    if (purchased.includes(upgrade.id)) {
      valid.push(upgrade.id);
    } else {
      break;
    }
  }
  return valid;
}

export function computeInventoryCapacity(
  progression: ProgressionState,
  state?: GameState
): number {
  let capacity = BASE_INVENTORY_CAPACITY;
  const upgrades = sanitizePurchasedUpgrades(progression.purchasedInventoryUpgrades);

  for (const upgradeId of upgrades) {
    capacity += INVENTORY_UPGRADE_MAP[upgradeId]?.capacityBonus ?? 0;
  }

  const ownedStash = [...new Set(progression.ownedStashHouses)];
  for (const stashId of ownedStash) {
    capacity += STASH_HOUSE_MAP[stashId]?.capacityBonus ?? 0;
  }

  if (state) {
    capacity += getRunnerCapacityBonus(state);
  }

  return capacity;
}

export function getExtraHeatDecayAtLocation(
  progression: ProgressionState,
  areaKey: string
): number {
  let bonus = 0;
  for (const stashId of progression.ownedStashHouses) {
    const stash = STASH_HOUSE_MAP[stashId];
    if (stash && getStashAreaKey(stash) === areaKey) {
      bonus += stash.extraHeatDecay;
    }
  }
  return bonus;
}

export function getRobberyWeightMultiplier(state: GameState): number {
  const areaKey = getPlayerAreaKey(state.player);
  let reduction = getSafehouseRobberyProtection(state);

  for (const stashId of state.progression.ownedStashHouses) {
    const stash = STASH_HOUSE_MAP[stashId];
    if (stash && getStashAreaKey(stash) === areaKey) {
      reduction = Math.max(reduction, stash.robberyReduction);
    }
  }

  return Math.max(0.4, 1 - reduction);
}

export function getNextInventoryUpgrade(
  progression: ProgressionState
): InventoryUpgradeDefinition | null {
  const valid = sanitizePurchasedUpgrades(progression.purchasedInventoryUpgrades);
  if (valid.length >= INVENTORY_UPGRADES.length) {
    return null;
  }
  return INVENTORY_UPGRADES[valid.length] ?? null;
}

export function syncProgression(
  state: GameState,
  options: { announceRankUp?: boolean } = {}
): GameState {
  const progression = state.progression ?? createInitialProgression();
  const previousRankId = progression.rankId;

  const rankId = computeRankId(state.player, progression, state.marketPrices);
  const syncedProgression: ProgressionState = {
    ...progression,
    rankId,
    purchasedInventoryUpgrades: sanitizePurchasedUpgrades(
      progression.purchasedInventoryUpgrades
    ),
    ownedStashHouses: [...new Set(progression.ownedStashHouses)],
  };
  const unlockedCities = computeUnlockedCities({
    ...state,
    progression: syncedProgression,
  });
  const inventoryCapacity = computeInventoryCapacity(
    {
      ...syncedProgression,
      unlockedCities,
    },
    { ...state, progression: { ...syncedProgression, unlockedCities } }
  );

  let updated: GameState = {
    ...state,
    progression: {
      ...syncedProgression,
      unlockedCities,
    },
    player: {
      ...state.player,
      inventoryCapacity,
    },
  };

  if (options.announceRankUp && rankId !== previousRankId && rankIndex(rankId) > rankIndex(previousRankId)) {
    const rank = RANK_MAP[rankId];
    updated = withMessage(
      updated,
      `RANK UP — You are now a ${rank.name}. ${rank.description}`
    );
  }

  return updated;
}

export function applyProgressionAfterAction(state: GameState): GameState {
  return syncProgression(state, { announceRankUp: true });
}

export function addLifetimeProfit(state: GameState, profit: number): GameState {
  if (profit <= 0) return state;
  return {
    ...state,
    progression: {
      ...state.progression,
      lifetimeProfit: state.progression.lifetimeProfit + profit,
    },
  };
}

export function purchaseInventoryUpgrade(state: GameState): GameState {
  const next = getNextInventoryUpgrade(state.progression);
  if (!next) {
    return withMessage(state, 'All inventory upgrades purchased.');
  }

  if (state.player.cash < next.cost) {
    return withMessage(
      state,
      `Need $${next.cost} for ${next.name}. You have $${state.player.cash}.`
    );
  }

  const cashAfter = Math.max(0, state.player.cash - next.cost);

  let updated: GameState = {
    ...state,
    player: {
      ...state.player,
      cash: cashAfter,
    },
    progression: {
      ...state.progression,
      purchasedInventoryUpgrades: [
        ...sanitizePurchasedUpgrades(state.progression.purchasedInventoryUpgrades),
        next.id,
      ],
    },
  };

  updated = applyProgressionAfterAction(updated);
  return withMessage(
    updated,
    `Purchased ${next.name} (+${next.capacityBonus} stash). Capacity: ${updated.player.inventoryCapacity}.`
  );
}

export function purchaseStashHouse(state: GameState, stashId: string): GameState {
  const stash = STASH_HOUSE_MAP[stashId];
  if (!stash) {
    return withMessage(state, 'Unknown stash house.');
  }

  if (state.progression.ownedStashHouses.includes(stashId)) {
    return withMessage(state, 'You already own this stash house.');
  }

  const ownsStashInCity = state.progression.ownedStashHouses.some(
    (id) => STASH_HOUSE_MAP[id]?.cityId === stash.cityId
  );
  if (ownsStashInCity) {
    const cityName = CITY_MAP[stash.cityId]?.name ?? stash.cityId;
    return withMessage(state, `You already have a stash house in ${cityName}.`);
  }

  if (!isCityUnlocked(state, stash.cityId)) {
    const cityName = CITY_MAP[stash.cityId]?.name ?? stash.cityId;
    return withMessage(state, `${cityName} must be unlocked before buying a stash there.`);
  }

  if (state.player.cash < stash.cost) {
    return withMessage(
      state,
      `Need $${stash.cost} for ${stash.name}. You have $${state.player.cash}.`
    );
  }

  const cashAfter = Math.max(0, state.player.cash - stash.cost);

  let updated: GameState = {
    ...state,
    player: {
      ...state.player,
      cash: cashAfter,
    },
    progression: {
      ...state.progression,
      ownedStashHouses: [...state.progression.ownedStashHouses, stashId],
    },
  };

  updated = applyProgressionAfterAction(updated);
  const cityName = CITY_MAP[stash.cityId]?.name ?? stash.cityId;
  return withMessage(
    updated,
    `Bought ${stash.name} in ${cityName} (+${stash.capacityBonus} stash, −${Math.round(stash.robberyReduction * 100)}% robbery risk there).`
  );
}

export function formatNextRankRequirements(state: GameState): string[] {
  const next = getNextRank(state.progression.rankId);
  if (!next) return ['Maximum rank reached.'];

  const { stats } = getRankProgress(state);
  const req = next.requirements;
  const lines: string[] = [];

  if (req.reputation != null) {
    lines.push(`Rep ${stats.reputation}/${req.reputation}`);
  }
  if (req.netWorth != null) {
    lines.push(`Net worth $${stats.netWorth}/$${req.netWorth}`);
  }
  if (req.lifetimeProfit != null) {
    lines.push(`Lifetime profit $${stats.lifetimeProfit}/$${req.lifetimeProfit}`);
  }
  if (req.daysSurvived != null) {
    lines.push(`Days ${stats.daysSurvived}/${req.daysSurvived}`);
  }

  return lines.length > 0 ? lines : ['Keep grinding.'];
}

function legacyLocationToCity(locationId: string): string | null {
  const mapped = LEGACY_LOCATION_TO_CITY_AREA[locationId];
  if (mapped) return mapped.cityId;
  if (locationId in CITY_MAP) return locationId;
  return null;
}

export function migrateLegacyProgression(
  raw: unknown,
  player: PlayerState,
  marketPrices: MarketPrices,
  isLegacySave: boolean
): ProgressionState {
  const defaults = createInitialProgression();

  if (!isRecord(raw)) {
    if (isLegacySave) {
      const legacy: ProgressionState = {
        ...defaults,
        unlockedCities: ALL_CITIES.map((c) => c.id),
      };
      legacy.rankId = computeRankId(player, legacy, marketPrices);
      return legacy;
    }
    return defaults;
  }

  const rankIdRaw = readString(raw.rankId, defaults.rankId);
  const rankId = RANK_MAP[rankIdRaw as RankId] ? (rankIdRaw as RankId) : defaults.rankId;

  let unlockedCities: string[] = [];

  if (Array.isArray(raw.unlockedCities)) {
    unlockedCities = raw.unlockedCities.filter(
      (id): id is string => typeof id === 'string' && id in CITY_MAP
    );
  } else if (Array.isArray(raw.unlockedLocations)) {
    const citySet = new Set<string>([...STARTING_UNLOCKED_CITIES]);
    for (const loc of raw.unlockedLocations) {
      if (typeof loc !== 'string') continue;
      const city = legacyLocationToCity(loc);
      if (city) citySet.add(city);
    }
    unlockedCities = [...citySet];
  } else if (isLegacySave) {
    unlockedCities = ALL_CITIES.map((c) => c.id);
  } else {
    unlockedCities = [...STARTING_UNLOCKED_CITIES];
  }

  const purchasedInventoryUpgrades = sanitizePurchasedUpgrades(
    Array.isArray(raw.purchasedInventoryUpgrades)
      ? raw.purchasedInventoryUpgrades.filter(
          (id): id is string => typeof id === 'string' && id in INVENTORY_UPGRADE_MAP
        )
      : []
  );

  const ownedStashHouses = [
    ...new Set(
      Array.isArray(raw.ownedStashHouses)
        ? raw.ownedStashHouses.filter(
            (id): id is string => typeof id === 'string' && id in STASH_HOUSE_MAP
          )
        : []
    ),
  ];

  const progression: ProgressionState = {
    rankId,
    lifetimeProfit: readNumber(raw.lifetimeProfit, defaults.lifetimeProfit, 0),
    unlockedCities,
    ownedStashHouses,
    purchasedInventoryUpgrades,
  };

  if (!progression.unlockedCities.includes(player.currentCityId)) {
    progression.unlockedCities.push(player.currentCityId);
  }

  progression.rankId = computeRankId(player, progression, marketPrices);

  if (isLegacySave) {
    progression.unlockedCities = ALL_CITIES.map((c) => c.id);
  }

  return progression;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback: number, min?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return min != null ? Math.max(min, value) : value;
}
