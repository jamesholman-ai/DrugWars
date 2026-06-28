/** Shared empire-management types for crew, businesses, and properties. */

export type CrewAssignment =
  | 'idle'
  | 'protect_player'
  | 'run_local_sales'
  | 'scout_suppliers'
  | 'gather_intel'
  | 'reduce_heat'
  | 'manage_business'
  | 'guard_property'
  | 'assist_smuggling'
  | 'collect_debt';

export type RiskProfile = 'low' | 'medium' | 'high';

export type BusinessUpgradeKind =
  | 'security'
  | 'staff'
  | 'laundering'
  | 'legitimacy'
  | 'expansion';

export type PropertyUpgradeKind =
  | 'locks'
  | 'hiddenCompartments'
  | 'storageExpansion'
  | 'escapeRoute'
  | 'safeRoom'
  | 'surveillance'
  | 'cleanerCrew';

export interface EmpireEventEntry {
  id: string;
  day: number;
  message: string;
  tone?: 'good' | 'bad' | 'neutral';
}

export interface BusinessUpgradeLevels {
  security: number;
  staff: number;
  laundering: number;
  legitimacy: number;
  expansion: number;
}

export interface PropertyUpgradeLevels {
  locks: number;
  hiddenCompartments: number;
  storageExpansion: number;
  escapeRoute: number;
  safeRoom: number;
  surveillance: number;
  cleanerCrew: number;
}

export const MAX_EMPIRE_EVENTS = 5;
export const MAX_UPGRADE_LEVEL = 3;
