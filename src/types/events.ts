import { CommodityId } from './game';

export type NpcType =
  | 'rival'
  | 'informant'
  | 'supplier'
  | 'debt_collector'
  | 'street_buyer'
  | 'corrupt_cop';

export type EventType =
  | 'police_stop'
  | 'police_raid'
  | 'rival_dealer'
  | 'robbery_attempt'
  | 'supplier_discount'
  | 'price_spike'
  | 'price_crash'
  | 'informant_tip'
  | 'bulk_buyer_offer'
  | 'health_emergency'
  | 'debt_collector_warning';

export interface NpcMemoryFlags {
  helpedCop: boolean;
  snitchedOnRival: boolean;
  stiffedSupplier: boolean;
  paidCollector: boolean;
  soldToBuyer: boolean;
  bribedCop: boolean;
  ignoredInformant: boolean;
}

export interface NpcRelation {
  attitude: number;
  /** 0–100 relationship trust built over encounters. */
  trust: number;
  /** How many times this NPC appeared in an event. */
  encounters: number;
  lastSeenDay: number;
}

export interface NpcDefinition {
  id: string;
  name: string;
  type: NpcType;
  /** Base attitude toward player (-100 hostile … 100 friendly). */
  baseAttitude: number;
  dialogueLines: {
    lowRep: string[];
    highRep: string[];
    highHeat: string[];
    highDebt: string[];
    friendly: string[];
    hostile: string[];
  };
}

export interface EventContext {
  commodityId?: CommodityId;
  locationId?: string;
  amount?: number;
  secondaryAmount?: number;
  quantity?: number;
  priceMultiplier?: number;
  npcId?: string;
}

export interface EventChoice {
  id: string;
  label: string;
  /** When set, choice is visible but cannot be selected. */
  lockedReason?: string;
}

export interface GameEventNpc {
  id: string;
  name: string;
  type: NpcType;
  dialogue: string;
  attitude: number;
}

export interface GameEvent {
  id: string;
  eventType: EventType;
  title: string;
  description: string;
  npc?: GameEventNpc;
  choices: EventChoice[];
  context: EventContext;
}

export interface EventOutcomeDelta {
  cash?: number;
  health?: number;
  heat?: number;
  reputation?: number;
  debt?: number;
  memoryFlag?: keyof NpcMemoryFlags;
  npcAttitudeDelta?: number;
  npcTrustDelta?: number;
  inventoryRemoveQty?: number;
  inventoryAdd?: {
    commodityId: CommodityId;
    quantity: number;
    avgCost: number;
  };
  applyPriceMultiplier?: {
    commodityId: CommodityId;
    multiplier: number;
  };
}
