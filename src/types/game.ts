import { GameEvent, NpcMemoryFlags, NpcRelation } from './events';
import { ProgressionState } from './progression';
import { OwnedEquipment } from './equipment';
import {
  EncounterHistoryEntry,
  HeatCooldowns,
  LegalStatus,
} from './encounters';
import { SupplierOffer, SupplierRelationship } from './suppliers';
import { BuyerContract } from './contracts';
import { CrewRecruitOffer, HiredCrewMember, CrewHistoryEntry } from './crew';
import { OwnedSafehouse, StoredInventoryBySafehouse } from './safehouses';
import {
  BusinessHistoryEntry,
  BusinessRaidRecord,
  DaySummary,
  OwnedBusiness,
} from './businesses';
import {
  DailyObjective,
  MissionInstance,
  MissionProgressFlags,
  PriceTip,
} from './missions';
import { TutorialState } from './tutorial';
import { StoreInventory } from './store';
import { FinanceLogEntry } from './finance';

export type WorldEventType =
  | 'market_shortage'
  | 'police_crackdown'
  | 'gang_war'
  | 'market_boom'
  | 'market_crash'
  | 'airport_lockdown'
  | 'supplier_flood'
  | 'informant_network_buzz';

export type WorldEventSeverity = 'low' | 'medium' | 'high';

/** Multipliers applied to street-event roll weights while a world event is active. */
export interface WorldEventWeightModifiers {
  police_stop?: number;
  police_raid?: number;
  rival_dealer?: number;
  robbery_attempt?: number;
  informant_tip?: number;
  supplier_discount?: number;
  bulk_buyer_offer?: number;
}

export interface ActiveWorldEvent {
  id: string;
  type: WorldEventType;
  title: string;
  description: string;
  affectedLocations: string[];
  affectedCommodities: CommodityId[];
  durationDays: number;
  priceMultiplier: number;
  heatMultiplier: number;
  eventWeightModifiers: WorldEventWeightModifiers;
  startDay: number;
  expiresDay: number;
  severity: WorldEventSeverity;
}

export type CommodityId =
  | 'weed'
  | 'cocaine'
  | 'crack'
  | 'heroin'
  | 'ecstasy'
  | 'lsd'
  | 'mushrooms'
  | 'meth'
  | 'ketamine'
  | 'mdma'
  | 'hashish'
  | 'opium'
  | 'morphine'
  | 'pcp'
  | 'speed';

export type PriceTrend = 'up' | 'down' | 'flat';

export interface Commodity {
  id: CommodityId;
  name: string;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  riskLevel: number;
}

export type AreaId = string;

export type TerritoryOwner =
  | 'neutral'
  | 'rival_gang'
  | 'cartel'
  | 'police_controlled'
  | 'player_controlled';

export type AreaRiskLevel = 1 | 2 | 3 | 4 | 5;

/** City-scoped district with territory and demand metadata. */
export interface CityAreaDefinition {
  id: AreaId;
  name: string;
  cityId: string;
  description: string;
  travelCost: number;
  healCost: number;
  riskLevel: AreaRiskLevel;
  /** 0–100 local law enforcement pressure. */
  policePresence: number;
  /** 0–100 cartel activity. */
  cartelInfluence: number;
  /** 0–100 rival gang activity. */
  rivalInfluence: number;
  /** Price multipliers per commodity (1.2 = +20%). */
  demandModifiers: Partial<Record<CommodityId, number>>;
  /** Legacy heat/travel scaling — derived from riskLevel if omitted. */
  riskModifier: number;
  priceModifier: number;
}

/** @deprecated Use CityAreaDefinition */
export type AreaDefinition = CityAreaDefinition;

export interface CityDefinition {
  id: string;
  name: string;
  description: string;
  travelCost: number;
  riskModifier: number;
  priceModifier: number;
  /** Drugs usually cheaper in this city (supply hubs). */
  specialtyDrugs: CommodityId[];
  /** Drugs usually more expensive here (demand / scarcity). */
  demandDrugs: CommodityId[];
}

/** @deprecated Flat district — kept for legacy migration only. */
export interface Location {
  id: string;
  name: string;
  description: string;
  travelCost: number;
  riskModifier: number;
  priceModifier: number;
  healCost: number;
}

export interface InventoryItem {
  commodityId: CommodityId;
  quantity: number;
  avgCost: number;
}

export interface PlayerState {
  cash: number;
  /** Untraceable street money — vulnerable to seizures. */
  dirtyCash?: number;
  /** Laundered / legitimate funds — preferred for legal purchases. */
  cleanCash?: number;
  debt: number;
  health: number;
  heat: number;
  reputation: number;
  day: number;
  currentCityId: string;
  /** Current district id within currentCityId (alias: currentArea). */
  currentAreaId: AreaId;
  inventoryCapacity: number;
  inventory: InventoryItem[];
  isGameOver: boolean;
  gameOverReason?: string;
  legalStatus: LegalStatus;
  /** 0–100 severity of active federal case. */
  federalCaseSeverity: number;
  /** Days remaining in jail (0 = not jailed). */
  daysInJail: number;
  /** Consecutive debt collector warnings ignored. */
  debtCollectorWarnings: number;
}

/** Keys are `${cityId}:${areaId}`. */
export type MarketPrices = Record<string, Record<CommodityId, number>>;

export type PriceHistory = Record<string, Partial<Record<CommodityId, number[]>>>;

export interface GameState {
  player: PlayerState;
  marketPrices: MarketPrices;
  priceHistory: PriceHistory;
  pendingEvent: GameEvent | null;
  lastMessage: string;
  messageLog: string[];
  memoryFlags: NpcMemoryFlags;
  npcRelations: Record<string, NpcRelation>;
  activeWorldEvents: ActiveWorldEvent[];
  progression: ProgressionState;
  equipment: OwnedEquipment[];
  cartelStanding: number;
  cartelBetrayals: number;
  localHeatByCity: Record<string, number>;
  /** Territory control keyed by `${cityId}:${areaId}`. */
  areaOwnership: Record<string, TerritoryOwner>;
  /** Known supplier relationships keyed by supplier id. */
  supplierRelationships: Record<string, SupplierRelationship>;
  /** Active special offers from suppliers. */
  supplierOffers: SupplierOffer[];
  /** Contracts available to accept. */
  contractOffers: BuyerContract[];
  activeContracts: BuyerContract[];
  completedContracts: BuyerContract[];
  failedContracts: BuyerContract[];
  availableCrew: CrewRecruitOffer[];
  hiredCrew: HiredCrewMember[];
  crewHistory: CrewHistoryEntry[];
  ownedSafehouses: OwnedSafehouse[];
  storedInventoryBySafehouse: StoredInventoryBySafehouse;
  ownedBusinesses?: OwnedBusiness[];
  businessHistory?: BusinessHistoryEntry[];
  businessRaids?: BusinessRaidRecord[];
  lastDaySummary?: DaySummary | null;
  missions?: string[];
  activeMissions?: MissionInstance[];
  completedMissions?: MissionInstance[];
  failedMissions?: MissionInstance[];
  dailyObjectives?: DailyObjective[];
  currentStoryArc?: string | null;
  missionProgress?: MissionProgressFlags;
  activePriceTips?: PriceTip[];
  /** Unrevealed opportunity intel — hidden until discovered. */
  hiddenOpportunities?: import('./intel').IntelEntry[];
  /** Revealed, non-expired intel tips. */
  activeIntel?: import('./intel').IntelEntry[];
  /** Expired intel history (limited). */
  expiredIntel?: import('./intel').IntelEntry[];
  /** Free reveal tokens earned in-run (IAP tokens live in PlayerProfile). */
  intelRevealTokens?: number;
  tutorial?: TutorialState;
  heatCooldowns: HeatCooldowns;
  encounterHistory: EncounterHistoryEntry[];
  /** Consumable IAP inventory and timed boosts for the active run. */
  storeInventory?: StoreInventory;
  /** Area moves within the current day (resets on day advance). */
  areaMovesToday?: number;
  /** Game day when areaMovesToday was last updated. */
  lastAreaMoveDay?: number;
  /** Recent finance activity (newest first). */
  financeLog?: FinanceLogEntry[];
}

export type RootStackParamList = {
  Title: undefined;
  Home: undefined;
  Game: undefined;
  Market: undefined;
  Travel: undefined;
  Inventory: undefined;
  Contacts: undefined;
  Progress: undefined;
  Upgrades: undefined;
  Suppliers: undefined;
  Contracts: undefined;
  Crew: undefined;
  Safehouses: undefined;
  Businesses: undefined;
  Missions: undefined;
  About: undefined;
  Store: undefined;
  Intel: undefined;
  Finance: undefined;
  OperationsDashboard: undefined;
  EmpireDashboard: undefined;
  MoreScreen: undefined;
  CrewDetail: { crewId: string };
  BusinessDetail: { businessId: string };
  PropertyDetail: { safehouseId: string };
};

export function createDefaultHeatCooldowns(): HeatCooldowns {
  return {
    layLowUntilDay: 0,
    bribePoliceUntilDay: 0,
    informantProtectionUntilDay: 0,
    safehouseUsedUntilDay: 0,
  };
}

export function createDefaultPlayerLegalFields(): Pick<
  PlayerState,
  'legalStatus' | 'federalCaseSeverity' | 'daysInJail' | 'debtCollectorWarnings'
> {
  return {
    legalStatus: 'clean',
    federalCaseSeverity: 0,
    daysInJail: 0,
    debtCollectorWarnings: 0,
  };
}

export function createEmptyMemoryFlags(): NpcMemoryFlags {
  return {
    helpedCop: false,
    snitchedOnRival: false,
    stiffedSupplier: false,
    paidCollector: false,
    soldToBuyer: false,
    bribedCop: false,
    ignoredInformant: false,
  };
}
