import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AreaId,
  CommodityId,
  GameState,
  InventoryItem,
  MarketPrices,
  PlayerState,
  PriceHistory,
  ActiveWorldEvent,
  WorldEventSeverity,
  WorldEventType,
  createEmptyMemoryFlags,
  createDefaultPlayerLegalFields,
  createDefaultHeatCooldowns,
} from '../types/game';
import { LegalStatus } from '../types/encounters';
import { NpcMemoryFlags, NpcRelation } from '../types/events';
import { COMMODITIES, COMMODITY_MAP, LEGACY_COMMODITY_MAP } from '../data/commodities';
import {
  AREA_MAP,
  CITY_MAP,
  LEGACY_LOCATION_TO_CITY_AREA,
  STARTING_AREA_ID,
  STARTING_CITY_ID,
  getAllAreaKeys,
  getAreaKey,
  parseAreaKey,
  resolveAreaIdForCity,
} from '../data/locations';
import {
  migrateAreaOwnership,
  migrateLocalHeatByCity,
} from './territory';
import {
  migrateSupplierOffers,
  migrateSupplierRelationships,
} from './supplierSystem';
import { migrateContracts } from './contractSystem';
import {
  migrateCrewRecruits,
  migrateHiredCrew,
  migrateCrewHistory,
} from './crewSystem';
import {
  migrateOwnedSafehouses,
  migrateStoredInventory,
} from './safehouseSystem';
import {
  migrateOwnedBusinesses,
  migrateBusinessHistory,
  migrateBusinessRaids,
  migrateDaySummary,
} from './businessSystem';
import {
  migrateMissionInstances,
  migrateDailyObjectives,
  migratePriceTips,
  migrateMissionProgress,
  initializeMissionState,
  generateDailyObjectives,
  syncMissionState,
} from './missionSystem';
import { migrateTutorial } from './tutorialSystem';
import {
  migrateIntelFromLegacy,
  initializeIntelState,
} from './intelSystem';
import { normalizeMoneyFields } from './money';
import {
  createInitialPlayerState,
  generateMarketPrices,
} from './engine';
import { normalizeGameState, migrateExtendedState } from './stateUtils';
import { MAX_ACTIVE_WORLD_EVENTS } from '../data/worldEvents';
import { migrateStoreInventory } from './storeInventory';
import { migrateLegacyProgression } from './progression';
import { createDefaultFinanceFields, migrateFinanceLog } from './financeSystem';
import {
  migrateDistrictBusinessListings,
  warmBusinessCache,
} from './businessPoolSystem';
import { migrateDistrictCrewListings } from './crewPoolSystem';
import {
  migrateDistrictPropertyListings,
  warmPropertyCache,
} from './propertyPoolSystem';
import { hashCombine } from '../utils/hash';

export const SAVE_KEY = '@neon_underworld/save';
export const SAVE_VERSION = 14;

export interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: GameState;
}

const VALID_COMMODITY_IDS = new Set<string>(COMMODITIES.map((c) => c.id));
const VALID_AREA_KEYS = new Set<string>(getAllAreaKeys());
const VALID_WORLD_EVENT_TYPES = new Set<string>([
  'market_shortage',
  'local_shortage',
  'city_shortage',
  'regional_shortage',
  'local_surplus',
  'city_surplus',
  'bad_batch',
  'dea_raid',
  'police_warehouse_break_in',
  'gang_war_supply_block',
  'cartel_dumping_product',
  'festival_demand_surge',
  'port_seizure',
  'smuggling_route_opened',
  'police_crackdown',
  'gang_war',
  'market_boom',
  'market_crash',
  'airport_lockdown',
  'supplier_flood',
  'informant_network_buzz',
]);
const VALID_SEVERITIES = new Set<string>(['low', 'medium', 'high']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  let n = value;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function migrateCommodityId(raw: string): CommodityId | null {
  if (VALID_COMMODITY_IDS.has(raw)) return raw as CommodityId;
  const mapped = LEGACY_COMMODITY_MAP[raw];
  if (mapped) return mapped;
  return null;
}

function migrateAreaKey(raw: string): string | null {
  if (VALID_AREA_KEYS.has(raw)) return raw;
  if (raw in LEGACY_LOCATION_TO_CITY_AREA) {
    const mapped = LEGACY_LOCATION_TO_CITY_AREA[raw];
    return getAreaKey(mapped.cityId, mapped.areaId);
  }

  const colonIdx = raw.indexOf(':');
  if (colonIdx > 0) {
    const cityId = raw.slice(0, colonIdx);
    const areaSlug = raw.slice(colonIdx + 1);
    if (CITY_MAP[cityId]) {
      const resolved = resolveAreaIdForCity(cityId, areaSlug);
      const key = getAreaKey(cityId, resolved);
      if (VALID_AREA_KEYS.has(key)) return key;
    }
  }

  if (raw in CITY_MAP) {
    return getAreaKey(raw, resolveAreaIdForCity(raw, 'downtown'));
  }
  const parsed = parseAreaKey(raw);
  if (parsed && VALID_AREA_KEYS.has(getAreaKey(parsed.cityId, parsed.areaId))) {
    return getAreaKey(parsed.cityId, parsed.areaId);
  }
  return null;
}

function migrateMemoryFlags(raw: unknown): NpcMemoryFlags {
  const defaults = createEmptyMemoryFlags();
  if (!isRecord(raw)) {
    return defaults;
  }
  return {
    helpedCop: readBoolean(raw.helpedCop, defaults.helpedCop),
    snitchedOnRival: readBoolean(raw.snitchedOnRival, defaults.snitchedOnRival),
    stiffedSupplier: readBoolean(raw.stiffedSupplier, defaults.stiffedSupplier),
    paidCollector: readBoolean(raw.paidCollector, defaults.paidCollector),
    soldToBuyer: readBoolean(raw.soldToBuyer, defaults.soldToBuyer),
    bribedCop: readBoolean(raw.bribedCop, defaults.bribedCop),
    ignoredInformant: readBoolean(raw.ignoredInformant, defaults.ignoredInformant),
  };
}

function migrateNpcRelations(raw: unknown): Record<string, NpcRelation> {
  if (!isRecord(raw)) {
    return {};
  }
  const relations: Record<string, NpcRelation> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    relations[id] = {
      attitude: readNumber(value.attitude, 0, -100, 100),
      trust: readNumber(value.trust, 50, 0, 100),
      encounters: readNumber(value.encounters, 0, 0),
      lastSeenDay: readNumber(value.lastSeenDay, 0, 0),
    };
  }
  return relations;
}

function dedupeWorldEventsByType(events: ActiveWorldEvent[]): ActiveWorldEvent[] {
  const byType = new Map<WorldEventType, ActiveWorldEvent>();
  for (const event of events) {
    const existing = byType.get(event.type);
    if (!existing || event.expiresDay > existing.expiresDay) {
      byType.set(event.type, event);
    }
  }
  return Array.from(byType.values());
}

function migrateActiveWorldEvents(
  raw: unknown,
  currentDay: number
): { events: ActiveWorldEvent[]; refreshPrices: boolean } {
  if (!Array.isArray(raw)) {
    return { events: [], refreshPrices: false };
  }

  const parsed: ActiveWorldEvent[] = [];

  for (const entry of raw) {
    if (!isRecord(entry)) continue;

    const type = readString(entry.type, '');
    if (!VALID_WORLD_EVENT_TYPES.has(type)) continue;

    const severity = readString(entry.severity, 'low');
    if (!VALID_SEVERITIES.has(severity)) continue;

    const affectedLocations = Array.isArray(entry.affectedLocations)
      ? entry.affectedLocations
          .map((id) => (typeof id === 'string' ? migrateAreaKey(id) : null))
          .filter((id): id is string => id != null)
      : [];

    const affectedCommodities = Array.isArray(entry.affectedCommodities)
      ? entry.affectedCommodities
          .map((id) => (typeof id === 'string' ? migrateCommodityId(id) : null))
          .filter((id): id is CommodityId => id != null)
      : [];

    const startDay = readNumber(entry.startDay, currentDay, 1);
    const durationDays = readNumber(entry.durationDays, 3, 1);
    const expiresDay = readNumber(
      entry.expiresDay,
      startDay + durationDays,
      startDay + 1
    );

    const eventWeightModifiers: ActiveWorldEvent['eventWeightModifiers'] = {};
    if (isRecord(entry.eventWeightModifiers)) {
      for (const [key, value] of Object.entries(entry.eventWeightModifiers)) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          eventWeightModifiers[key as keyof ActiveWorldEvent['eventWeightModifiers']] = value;
        }
      }
    }

    parsed.push({
      id: readString(entry.id, `we_migrated_${parsed.length}`),
      type: type as WorldEventType,
      title: readString(entry.title, 'World Event'),
      description: readString(entry.description, ''),
      affectedLocations,
      affectedCommodities,
      durationDays,
      priceMultiplier: readNumber(entry.priceMultiplier, 1, 0.05, 12),
      heatMultiplier: readNumber(entry.heatMultiplier, 1, 0.1, 5),
      eventWeightModifiers,
      startDay,
      expiresDay,
      severity: severity as WorldEventSeverity,
    });
  }

  const deduped = dedupeWorldEventsByType(parsed);
  const nonExpired = deduped.filter((event) => event.expiresDay > currentDay);
  const events = nonExpired.slice(0, MAX_ACTIVE_WORLD_EVENTS);
  const refreshPrices =
    nonExpired.length !== events.length || deduped.length > nonExpired.length;

  return {
    events,
    refreshPrices,
  };
}

function migrateInventory(raw: unknown): InventoryItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const items: InventoryItem[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const commodityId = migrateCommodityId(readString(entry.commodityId, ''));
    if (!commodityId) continue;
    const quantity = readNumber(entry.quantity, 0, 0);
    if (quantity <= 0) continue;
    items.push({
      commodityId,
      quantity: Math.floor(quantity),
      avgCost: readNumber(entry.avgCost, 0, 0),
    });
  }
  return items;
}

function isLegacyPriceFormat(raw: Record<string, unknown>): boolean {
  return Object.keys(raw).some((key) => !key.includes(':') && key in LEGACY_LOCATION_TO_CITY_AREA);
}

function migrateMarketPrices(
  raw: unknown,
  fallback: MarketPrices,
  activeEvents: ActiveWorldEvent[]
): MarketPrices {
  if (!isRecord(raw) || isLegacyPriceFormat(raw)) {
    return generateMarketPrices(activeEvents);
  }

  const prices = generateMarketPrices(activeEvents);

  for (const areaKey of getAllAreaKeys()) {
    const locRaw = raw[areaKey];
    if (!isRecord(locRaw)) continue;

    for (const commodity of COMMODITIES) {
      const price = locRaw[commodity.id];
      if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        prices[areaKey][commodity.id] = Math.round(price);
      }
    }
  }

  return prices;
}

function migratePriceHistory(raw: unknown): PriceHistory {
  if (!isRecord(raw)) return {};
  const history: PriceHistory = {};

  for (const [key, value] of Object.entries(raw)) {
    const areaKey = migrateAreaKey(key);
    if (!areaKey || !isRecord(value)) continue;
    const entry: Partial<Record<CommodityId, number[]>> = {};
    for (const [commodityId, chain] of Object.entries(value)) {
      const id = migrateCommodityId(commodityId);
      if (!id || !Array.isArray(chain)) continue;
      entry[id] = chain
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
        .slice(-6);
    }
    history[areaKey] = entry;
  }

  return history;
}

function migratePlayer(raw: unknown): PlayerState {
  const defaults = createInitialPlayerState();
  if (!isRecord(raw)) {
    return defaults;
  }

  let currentCityId = readString(raw.currentCityId, defaults.currentCityId);
  let currentAreaId = readString(raw.currentAreaId, defaults.currentAreaId) as AreaId;

  if (typeof raw.currentLocation === 'string') {
    const legacy = LEGACY_LOCATION_TO_CITY_AREA[raw.currentLocation];
    if (legacy) {
      currentCityId = legacy.cityId;
      currentAreaId = legacy.areaId;
    } else if (raw.currentLocation.includes(':')) {
      const parsed = parseAreaKey(raw.currentLocation);
      if (parsed) {
        currentCityId = parsed.cityId;
        currentAreaId = parsed.areaId;
      }
    } else if (raw.currentLocation in CITY_MAP) {
      currentCityId = raw.currentLocation;
      currentAreaId = resolveAreaIdForCity(currentCityId, 'downtown') as AreaId;
    }
  }

  if (!CITY_MAP[currentCityId]) {
    currentCityId = STARTING_CITY_ID;
  }
  currentAreaId = resolveAreaIdForCity(currentCityId, currentAreaId) as AreaId;
  if (!AREA_MAP[currentAreaId]) {
    currentAreaId = STARTING_AREA_ID;
  }

  const inventory = migrateInventory(raw.inventory);
  const inventoryCapacity = readNumber(
    raw.inventoryCapacity,
    defaults.inventoryCapacity,
    1
  );

  const legalDefaults = createDefaultPlayerLegalFields();
  const legalRaw = typeof raw.legalStatus === 'string' ? raw.legalStatus : legalDefaults.legalStatus;
  const validLegal: LegalStatus[] = [
    'clean',
    'warning',
    'detained',
    'arrested',
    'jailed',
    'federal_case',
  ];
  const legalStatus = validLegal.includes(legalRaw as LegalStatus)
    ? (legalRaw as LegalStatus)
    : legalDefaults.legalStatus;

  return normalizeMoneyFields({
    cash: readNumber(raw.cash, defaults.cash, 0),
    dirtyCash:
      typeof raw.dirtyCash === 'number'
        ? readNumber(raw.dirtyCash, 0, 0)
        : readNumber(raw.cash, defaults.cash, 0),
    cleanCash:
      typeof raw.cleanCash === 'number'
        ? readNumber(raw.cleanCash, 0, 0)
        : typeof raw.dirtyCash === 'number'
          ? 0
          : 0,
    debt: readNumber(raw.debt, defaults.debt, 0),
    health: readNumber(raw.health, defaults.health, 0, 100),
    heat: readNumber(raw.heat, defaults.heat, 0, 100),
    reputation: readNumber(raw.reputation, defaults.reputation, 0, 100),
    day: readNumber(raw.day, defaults.day, 1),
    currentCityId,
    currentAreaId,
    inventoryCapacity,
    inventory,
    isGameOver: readBoolean(raw.isGameOver, defaults.isGameOver),
    gameOverReason:
      typeof raw.gameOverReason === 'string' ? raw.gameOverReason : undefined,
    legalStatus,
    federalCaseSeverity: readNumber(
      raw.federalCaseSeverity,
      legalDefaults.federalCaseSeverity,
      0,
      100
    ),
    daysInJail: readNumber(raw.daysInJail, legalDefaults.daysInJail, 0),
    debtCollectorWarnings: readNumber(
      raw.debtCollectorWarnings,
      legalDefaults.debtCollectorWarnings,
      0
    ),
    homeBaseId:
      typeof raw.homeBaseId === 'string'
        ? raw.homeBaseId
        : raw.homeBaseId === null
          ? null
          : undefined,
  });
}

export function migrateGameState(raw: unknown): GameState | null {
  let stateRaw: unknown = raw;

  if (isRecord(raw) && 'state' in raw) {
    const envelope = raw as Partial<SaveEnvelope>;
    stateRaw = envelope.state;
  }

  if (!isRecord(stateRaw)) {
    return null;
  }

  const player = migratePlayer(stateRaw.player);
  const { events: activeWorldEvents, refreshPrices } = migrateActiveWorldEvents(
    stateRaw.activeWorldEvents,
    player.day
  );

  const fallbackPrices = generateMarketPrices(activeWorldEvents);
  let marketPrices = migrateMarketPrices(
    stateRaw.marketPrices,
    fallbackPrices,
    activeWorldEvents
  );
  if (refreshPrices) {
    marketPrices = generateMarketPrices(activeWorldEvents);
  }

  const isLegacySave =
    !isRecord(stateRaw.progression) ||
    (isRecord(stateRaw.player) &&
      'currentLocation' in stateRaw.player &&
      !('currentCityId' in stateRaw.player));

  const progression = migrateLegacyProgression(
    stateRaw.progression,
    player,
    marketPrices,
    isLegacySave
  );

  const extended = isRecord(stateRaw) ? migrateExtendedState(stateRaw) : {
    equipment: [],
    cartelStanding: 0,
    cartelBetrayals: 0,
    localHeatByCity: {},
    heatCooldowns: createDefaultHeatCooldowns(),
    encounterHistory: [],
  };

  const areaOwnership = migrateAreaOwnership(
    isRecord(stateRaw) ? stateRaw.areaOwnership : undefined
  );
  const localHeatByCity = migrateLocalHeatByCity(
    extended.localHeatByCity,
    player.heat
  );

  const supplierRelationships = migrateSupplierRelationships(
    isRecord(stateRaw) ? stateRaw.supplierRelationships : undefined
  );
  const supplierOffers = migrateSupplierOffers(
    isRecord(stateRaw) ? stateRaw.supplierOffers : undefined
  );
  const contractOffers = migrateContracts(
    isRecord(stateRaw) ? stateRaw.contractOffers : undefined,
    'offers'
  );
  const activeContracts = migrateContracts(
    isRecord(stateRaw) ? stateRaw.activeContracts : undefined,
    'active'
  );
  const completedContracts = migrateContracts(
    isRecord(stateRaw) ? stateRaw.completedContracts : undefined,
    'completed'
  );
  const failedContracts = migrateContracts(
    isRecord(stateRaw) ? stateRaw.failedContracts : undefined,
    'failed'
  );
  const availableCrew = migrateCrewRecruits(
    isRecord(stateRaw) ? stateRaw.availableCrew : undefined
  );
  const hiredCrew = migrateHiredCrew(
    isRecord(stateRaw) ? stateRaw.hiredCrew : undefined
  );
  const crewHistory = migrateCrewHistory(
    isRecord(stateRaw) ? stateRaw.crewHistory : undefined
  );
  const provisionalRunSeed =
    isRecord(stateRaw) && typeof stateRaw.runSeed === 'number' && stateRaw.runSeed > 0
      ? stateRaw.runSeed
      : hashCombine('migrate', player.day, progression.lifetimeProfit, 0);
  const ownedSafehouses = migrateOwnedSafehouses(
    isRecord(stateRaw) ? stateRaw.ownedSafehouses : undefined,
    provisionalRunSeed
  );
  const storedInventoryBySafehouse = migrateStoredInventory(
    isRecord(stateRaw) ? stateRaw.storedInventoryBySafehouse : undefined,
    ownedSafehouses.map((o) => o.safehouseId)
  );
  const ownedBusinesses = migrateOwnedBusinesses(
    isRecord(stateRaw) ? stateRaw.ownedBusinesses : undefined
  );
  const businessHistory = migrateBusinessHistory(
    isRecord(stateRaw) ? stateRaw.businessHistory : undefined
  );
  const businessRaids = migrateBusinessRaids(
    isRecord(stateRaw) ? stateRaw.businessRaids : undefined
  );
  const lastDaySummary = migrateDaySummary(
    isRecord(stateRaw) ? stateRaw.lastDaySummary : undefined
  );
  const activeMissions = migrateMissionInstances(
    isRecord(stateRaw) ? stateRaw.activeMissions : undefined
  );
  const completedMissions = migrateMissionInstances(
    isRecord(stateRaw) ? stateRaw.completedMissions : undefined
  );
  const failedMissions = migrateMissionInstances(
    isRecord(stateRaw) ? stateRaw.failedMissions : undefined
  );
  const dailyObjectives = migrateDailyObjectives(
    isRecord(stateRaw) ? stateRaw.dailyObjectives : undefined
  );
  const missionProgress = migrateMissionProgress(
    isRecord(stateRaw) ? stateRaw.missionProgress : undefined
  );
  const activePriceTips = migratePriceTips(
    isRecord(stateRaw) ? stateRaw.activePriceTips : undefined
  );
  const currentStoryArc =
    isRecord(stateRaw) && typeof stateRaw.currentStoryArc === 'string'
      ? stateRaw.currentStoryArc
      : null;
  const missionsRaw = isRecord(stateRaw) && Array.isArray(stateRaw.missions)
    ? stateRaw.missions.filter((m): m is string => typeof m === 'string')
    : undefined;

  const hasExistingProgress =
    player.day > 1 ||
    player.cash !== createInitialPlayerState().cash ||
    (Array.isArray(stateRaw.activeMissions) && stateRaw.activeMissions.length > 0);

  const tutorial = migrateTutorial(
    isRecord(stateRaw) ? stateRaw.tutorial : undefined,
    hasExistingProgress
  );

  const financeDefaults = createDefaultFinanceFields(player.day);

  const migrated: GameState = {
    player,
    marketPrices,
    priceHistory: migratePriceHistory(stateRaw.priceHistory),
    pendingEvent: null,
    lastMessage: readString(stateRaw.lastMessage, 'Game loaded.'),
    messageLog: Array.isArray(stateRaw.messageLog)
      ? stateRaw.messageLog.filter((m): m is string => typeof m === 'string').slice(0, 20)
      : [],
    memoryFlags: migrateMemoryFlags(stateRaw.memoryFlags),
    npcRelations: migrateNpcRelations(stateRaw.npcRelations),
    activeWorldEvents,
    progression,
    ...extended,
    localHeatByCity,
    areaOwnership,
    supplierRelationships,
    supplierOffers,
    contractOffers,
    activeContracts,
    completedContracts,
    failedContracts,
    availableCrew,
    hiredCrew,
    crewHistory,
    ownedSafehouses,
    storedInventoryBySafehouse,
    ownedBusinesses,
    businessHistory,
    businessRaids,
    lastDaySummary,
    missions: missionsRaw,
    activeMissions,
    completedMissions,
    failedMissions,
    dailyObjectives,
    currentStoryArc,
    missionProgress,
    activePriceTips,
    tutorial,
    storeInventory: migrateStoreInventory(
      isRecord(stateRaw) ? stateRaw.storeInventory : undefined
    ),
    areaMovesToday:
      isRecord(stateRaw) && typeof stateRaw.areaMovesToday === 'number'
        ? stateRaw.areaMovesToday
        : financeDefaults.areaMovesToday,
    lastAreaMoveDay:
      isRecord(stateRaw) && typeof stateRaw.lastAreaMoveDay === 'number'
        ? stateRaw.lastAreaMoveDay
        : financeDefaults.lastAreaMoveDay,
    financeLog: migrateFinanceLog(isRecord(stateRaw) ? stateRaw.financeLog : undefined),
    runSeed:
      isRecord(stateRaw) && typeof stateRaw.runSeed === 'number' && stateRaw.runSeed > 0
        ? stateRaw.runSeed
        : hashCombine('migrate', player.day, progression.lifetimeProfit, ownedBusinesses.length),
    districtBusinessListings: migrateDistrictBusinessListings(
      isRecord(stateRaw) ? stateRaw.districtBusinessListings : undefined
    ),
    districtCrewListings: migrateDistrictCrewListings(
      isRecord(stateRaw) ? stateRaw.districtCrewListings : undefined
    ),
    districtPropertyListings: migrateDistrictPropertyListings(
      isRecord(stateRaw) ? stateRaw.districtPropertyListings : undefined
    ),
  };

  if (!CITY_MAP[migrated.player.currentCityId]) {
    migrated.player.currentCityId = STARTING_CITY_ID;
  }
  migrated.player.currentAreaId = resolveAreaIdForCity(
    migrated.player.currentCityId,
    migrated.player.currentAreaId
  ) as AreaId;
  if (!AREA_MAP[migrated.player.currentAreaId]) {
    migrated.player.currentAreaId = STARTING_AREA_ID;
  }

  const areaKey = getAreaKey(migrated.player.currentCityId, migrated.player.currentAreaId);
  if (!migrated.marketPrices[areaKey]) {
    migrated.marketPrices = generateMarketPrices(activeWorldEvents);
  }

  let normalized = normalizeGameState(migrated);
  warmBusinessCache(normalized);
  warmPropertyCache(normalized);
  normalized = migrateIntelFromLegacy(normalized, activePriceTips);

  const needsMissionInit =
    (normalized.activeMissions ?? []).length === 0 &&
    (normalized.completedMissions ?? []).length === 0;
  if (needsMissionInit) {
    normalized = initializeMissionState(normalized);
    normalized = syncMissionState(normalized);
  }

  const todaysObjectives = (normalized.dailyObjectives ?? []).filter(
    (o) => o.generatedDay === normalized.player.day
  );
  if (todaysObjectives.length === 0) {
    normalized = generateDailyObjectives(normalized);
  }

  if ((normalized.hiddenOpportunities ?? []).length === 0) {
    normalized = initializeIntelState(normalized);
  }

  return normalized;
}

export async function saveGameState(state: GameState): Promise<void> {
  const envelope: SaveEnvelope = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: normalizeGameState(state),
  };
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const json = await AsyncStorage.getItem(SAVE_KEY);
    if (!json) {
      return null;
    }
    const parsed: unknown = JSON.parse(json);
    return migrateGameState(parsed);
  } catch {
    return null;
  }
}

export async function hasSavedGame(): Promise<boolean> {
  try {
    const json = await AsyncStorage.getItem(SAVE_KEY);
    return json !== null && json.length > 0;
  } catch {
    return false;
  }
}

export async function clearSavedGame(): Promise<void> {
  await AsyncStorage.removeItem(SAVE_KEY);
}
