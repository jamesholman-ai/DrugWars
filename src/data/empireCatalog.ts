import {
  BusinessUpgradeKind,
  CrewAssignment,
  PropertyUpgradeKind,
} from '../types/empire';
import { CrewRole } from '../types/crew';

export const CREW_ROLE_ICONS: Record<CrewRole, string> = {
  runner: '🏃',
  lookout: '👁',
  enforcer: '🥊',
  smuggler: '🚢',
  accountant: '📊',
  fixer: '🎩',
  dealer: '💊',
  supplier_scout: '🔍',
};

export const CREW_ASSIGNMENT_LABELS: Record<CrewAssignment, string> = {
  idle: 'Idle',
  protect_player: 'Protect Player',
  run_local_sales: 'Run Local Sales',
  scout_suppliers: 'Scout Suppliers',
  gather_intel: 'Gather Intel',
  reduce_heat: 'Reduce Heat',
  manage_business: 'Manage Business',
  guard_property: 'Guard Property',
  assist_smuggling: 'Assist Smuggling',
  collect_debt: 'Collect Debt',
};

export const CREW_ASSIGNMENT_DESCRIPTIONS: Record<CrewAssignment, string> = {
  idle: 'On standby — low stress, no bonuses.',
  protect_player: 'Improves survival during encounters and travel.',
  run_local_sales: 'Small daily clean income; raises local heat slightly.',
  scout_suppliers: 'Better supplier offers and reliability in this city.',
  gather_intel: 'Chance to reveal a hidden lead each day.',
  reduce_heat: 'Slowly lowers personal and local heat.',
  manage_business: 'Boosts income and condition for assigned business.',
  guard_property: 'Lowers robbery and raid risk at assigned property.',
  assist_smuggling: 'Reduces city and airport travel risk.',
  collect_debt: 'Extra cash collection; may anger rivals.',
};

export const ALL_CREW_ASSIGNMENTS: CrewAssignment[] = [
  'idle',
  'protect_player',
  'run_local_sales',
  'scout_suppliers',
  'gather_intel',
  'reduce_heat',
  'manage_business',
  'guard_property',
  'assist_smuggling',
  'collect_debt',
];

export const BUSINESS_UPGRADE_LABELS: Record<BusinessUpgradeKind, string> = {
  security: 'Security',
  staff: 'Staff',
  laundering: 'Laundering',
  legitimacy: 'Front Legitimacy',
  expansion: 'Expansion',
};

export const BUSINESS_UPGRADE_DESCRIPTIONS: Record<BusinessUpgradeKind, string> = {
  security: 'Lowers police audit and raid risk.',
  staff: 'Increases daily income.',
  laundering: 'Increases laundering capacity.',
  legitimacy: 'Lowers business heat over time.',
  expansion: 'Higher income and upkeep ceiling.',
};

export const PROPERTY_UPGRADE_LABELS: Record<PropertyUpgradeKind, string> = {
  locks: 'Locks & Security',
  hiddenCompartments: 'Hidden Compartments',
  storageExpansion: 'Storage Expansion',
  escapeRoute: 'Escape Route',
  safeRoom: 'Safe Room',
  surveillance: 'Surveillance',
  cleanerCrew: 'Cleaner Crew',
};

export const PROPERTY_UPGRADE_DESCRIPTIONS: Record<PropertyUpgradeKind, string> = {
  locks: 'Lowers break-in and sweep risk.',
  hiddenCompartments: 'Protects stored inventory from seizures.',
  storageExpansion: 'Adds off-street storage capacity.',
  escapeRoute: 'Helps survive raids and sweeps.',
  safeRoom: 'Protects crew and player during heat actions.',
  surveillance: 'Early warnings and intel tips.',
  cleanerCrew: 'Lowers heat after incidents.',
};

/** Base upgrade cost scales with level. */
export function getBusinessUpgradeCost(kind: BusinessUpgradeKind, nextLevel: number): number {
  const base: Record<BusinessUpgradeKind, number> = {
    security: 1200,
    staff: 900,
    laundering: 1500,
    legitimacy: 1100,
    expansion: 2200,
  };
  return Math.round(base[kind] * (1 + (nextLevel - 1) * 0.65));
}

export function getPropertyUpgradeCost(kind: PropertyUpgradeKind, nextLevel: number): number {
  const base: Record<PropertyUpgradeKind, number> = {
    locks: 800,
    hiddenCompartments: 1000,
    storageExpansion: 1200,
    escapeRoute: 1400,
    safeRoom: 1800,
    surveillance: 1100,
    cleanerCrew: 900,
  };
  return Math.round(base[kind] * (1 + (nextLevel - 1) * 0.6));
}

/** Roles that excel at managing a business front. */
export const BUSINESS_MANAGER_ROLES: CrewRole[] = ['accountant', 'dealer', 'fixer'];

/** Roles suited to guard duty. */
export const PROPERTY_GUARD_ROLES: CrewRole[] = ['enforcer', 'lookout'];
