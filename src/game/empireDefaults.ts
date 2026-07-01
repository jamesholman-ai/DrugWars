import { HiredCrewMember, CrewRole } from '../types/crew';
import { OwnedBusiness } from '../types/businesses';
import { OwnedSafehouse, SafehouseDefinition } from '../types/safehouses';
import {
  BusinessUpgradeLevels,
  CrewAssignment,
  EmpireEventEntry,
  MAX_EMPIRE_EVENTS,
  MAX_UPGRADE_LEVEL,
  PropertyUpgradeLevels,
  RiskProfile,
} from '../types/empire';
import { clamp } from '../utils/random';

export const DEFAULT_BUSINESS_UPGRADES: BusinessUpgradeLevels = {
  security: 0,
  staff: 0,
  laundering: 0,
  legitimacy: 0,
  expansion: 0,
};

export const DEFAULT_PROPERTY_UPGRADES: PropertyUpgradeLevels = {
  locks: 0,
  hiddenCompartments: 0,
  storageExpansion: 0,
  escapeRoute: 0,
  safeRoom: 0,
  surveillance: 0,
  cleanerCrew: 0,
};

export function deriveRiskProfile(traits: string[]): RiskProfile {
  const risky = traits.some((t) =>
    /violent|reckless|paranoid|addict|unstable/i.test(t)
  );
  const calm = traits.some((t) =>
    /connected|clean|professional|loyal|calm/i.test(t)
  );
  if (risky) return 'high';
  if (calm) return 'low';
  return 'medium';
}

export function deriveSpecialty(role: CrewRole): string {
  const map: Record<CrewRole, string> = {
    runner: 'Street runs',
    lookout: 'Surveillance',
    enforcer: 'Muscle',
    smuggler: 'Cross-border moves',
    accountant: 'Books & debt',
    fixer: 'Politics & bribes',
    dealer: 'Retail sales',
    supplier_scout: 'Supplier networks',
  };
  return map[role] ?? 'General ops';
}

export function migrateEmpireEvents(raw: unknown): EmpireEventEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is EmpireEventEntry => {
      if (!e || typeof e !== 'object') return false;
      const entry = e as EmpireEventEntry;
      return (
        typeof entry.id === 'string' &&
        typeof entry.day === 'number' &&
        typeof entry.message === 'string'
      );
    })
    .slice(0, MAX_EMPIRE_EVENTS);
}

export function migrateBusinessUpgrades(raw: unknown): BusinessUpgradeLevels {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BUSINESS_UPGRADES };
  const e = raw as Record<string, unknown>;
  const level = (v: unknown) =>
    typeof v === 'number' ? clamp(Math.floor(v), 0, MAX_UPGRADE_LEVEL) : 0;
  return {
    security: level(e.security),
    staff: level(e.staff),
    laundering: level(e.laundering),
    legitimacy: level(e.legitimacy),
    expansion: level(e.expansion),
  };
}

export function migratePropertyUpgrades(raw: unknown): PropertyUpgradeLevels {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PROPERTY_UPGRADES };
  const e = raw as Record<string, unknown>;
  const level = (v: unknown) =>
    typeof v === 'number' ? clamp(Math.floor(v), 0, MAX_UPGRADE_LEVEL) : 0;
  return {
    locks: level(e.locks),
    hiddenCompartments: level(e.hiddenCompartments),
    storageExpansion: level(e.storageExpansion),
    escapeRoute: level(e.escapeRoute),
    safeRoom: level(e.safeRoom),
    surveillance: level(e.surveillance),
    cleanerCrew: level(e.cleanerCrew),
  };
}

export function normalizeHiredCrewMember(member: HiredCrewMember): HiredCrewMember {
  const traits = member.riskTraits ?? [];
  return {
    ...member,
    morale: clamp(member.morale ?? 72, 0, 100),
    stress: clamp(member.stress ?? 18, 0, 100),
    specialty: member.specialty ?? deriveSpecialty(member.role),
    riskProfile: member.riskProfile ?? deriveRiskProfile(traits),
    currentAssignment: (member.currentAssignment ?? 'idle') as CrewAssignment,
    relationshipLevel: clamp(
      member.relationshipLevel ?? Math.round(member.loyalty * 0.85),
      0,
      100
    ),
    recentEvents: migrateEmpireEvents(member.recentEvents),
  };
}

export function normalizeOwnedBusiness(record: OwnedBusiness): OwnedBusiness {
  return {
    ...record,
    reputation: clamp(record.reputation ?? 55, 0, 100),
    heat: clamp(record.heat ?? 12, 0, 100),
    assignedCrewId: record.assignedCrewId ?? null,
    upgradeLevels: migrateBusinessUpgrades(record.upgradeLevels),
    recentEvents: migrateEmpireEvents(record.recentEvents),
  };
}

export function normalizeOwnedSafehouse(record: OwnedSafehouse): OwnedSafehouse {
  return {
    ...record,
    rentOrOwn: record.rentOrOwn === 'rent' ? 'rent' : 'own',
    condition: clamp(record.condition, 0, 100),
    comfortLevel: clamp(record.comfortLevel ?? 50, 0, 100),
    securityLevel: clamp(record.securityLevel ?? 50, 0, 100),
    secrecyLevel: clamp(record.secrecyLevel ?? 50, 0, 100),
    assignedGuardCrewId: record.assignedGuardCrewId ?? null,
    upgradeLevels: migratePropertyUpgrades(record.upgradeLevels),
    recentEvents: migrateEmpireEvents(record.recentEvents),
  };
}

export function createDefaultHiredCrewFields(
  member: Omit<HiredCrewMember, 'morale' | 'stress' | 'specialty' | 'riskProfile' | 'currentAssignment' | 'relationshipLevel' | 'recentEvents'>
): HiredCrewMember {
  return normalizeHiredCrewMember({
    ...member,
    morale: 72,
    stress: 15,
    specialty: deriveSpecialty(member.role),
    riskProfile: deriveRiskProfile(member.riskTraits),
    currentAssignment: 'idle',
    relationshipLevel: Math.round(member.loyalty * 0.85),
    recentEvents: [],
  });
}

export function createDefaultOwnedBusinessFields(
  businessId: string,
  purchasedDay: number
): OwnedBusiness {
  return normalizeOwnedBusiness({
    businessId,
    purchasedDay,
    condition: 100,
    upkeepMissedDays: 0,
    reputation: 55,
    heat: 12,
    assignedCrewId: null,
    upgradeLevels: { ...DEFAULT_BUSINESS_UPGRADES },
    recentEvents: [],
  });
}

export function createDefaultOwnedSafehouseFields(
  safehouseId: string,
  purchasedDay: number,
  rentOrOwn: 'rent' | 'own' = 'own',
  def?: Pick<SafehouseDefinition, 'comfortLevel' | 'securityLevel' | 'secrecyLevel'>
): OwnedSafehouse {
  return normalizeOwnedSafehouse({
    safehouseId,
    purchasedDay,
    rentOrOwn,
    condition: 100,
    upkeepMissedDays: 0,
    comfortLevel: def?.comfortLevel ?? 50,
    securityLevel: def?.securityLevel ?? 50,
    secrecyLevel: def?.secrecyLevel ?? 50,
    assignedGuardCrewId: null,
    upgradeLevels: { ...DEFAULT_PROPERTY_UPGRADES },
    recentEvents: [],
  });
}

export function appendEmpireEvent(
  events: EmpireEventEntry[] | undefined,
  day: number,
  message: string,
  tone: EmpireEventEntry['tone'] = 'neutral'
): EmpireEventEntry[] {
  const entry: EmpireEventEntry = {
    id: `evt_${day}_${Math.floor(Math.random() * 1e6)}`,
    day,
    message,
    tone,
  };
  return [entry, ...(events ?? [])].slice(0, MAX_EMPIRE_EVENTS);
}
