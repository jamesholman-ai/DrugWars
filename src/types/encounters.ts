import { EventOutcomeDelta } from './events';

export type EncounterFaction =
  | 'rival'
  | 'police'
  | 'dea'
  | 'airport_police'
  | 'thug'
  | 'civilian'
  | 'cartel';

export type EncounterTriggerContext =
  | 'stay'
  | 'areaTravel'
  | 'cityTravel'
  | 'marketAction'
  | 'highHeat';

export type EncounterActionType =
  | 'talk'
  | 'pay'
  | 'run'
  | 'fight'
  | 'bribe'
  | 'surrender'
  | 'negotiate'
  | 'call_contact'
  | 'use_weapon'
  | 'use_lawyer'
  | 'dump_inventory'
  | 'hide_stash';

export interface EncounterChoiceDef {
  id: string;
  label: string;
  actionType: EncounterActionType;
  /** Minimum cash required to attempt. */
  minCash?: number;
  /** Equipment id required (e.g. lawyer_retainer). */
  requiresEquipment?: string;
  /** Uses combat resolution when true. */
  usesCombat?: boolean;
  /** Base outcome before combat/modifiers. */
  outcome: EncounterOutcomeTemplate;
}

export interface EncounterOutcomeTemplate extends EventOutcomeDelta {
  legalEscalation?: number;
  legalDeescalation?: number;
  federalSeverity?: number;
  cartelStanding?: number;
  skipDays?: number;
  destroyInventoryPct?: number;
  destroyWeapons?: boolean;
  informantProtectionDays?: number;
  messageSuffix?: string;
}

export interface EncounterDefinition {
  id: string;
  faction: EncounterFaction;
  title: string;
  description: string;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  triggerContexts: EncounterTriggerContext[];
  baseWeight: number;
  choices: EncounterChoiceDef[];
  /** Base threat score for combat (1–100). */
  threatScore: number;
}

export interface EncounterHistoryEntry {
  encounterId: string;
  day: number;
  outcome: string;
}

export interface HeatCooldowns {
  layLowUntilDay: number;
  bribePoliceUntilDay: number;
  informantProtectionUntilDay: number;
  safehouseUsedUntilDay: number;
}

export type LegalStatus =
  | 'clean'
  | 'warning'
  | 'detained'
  | 'arrested'
  | 'jailed'
  | 'federal_case';
