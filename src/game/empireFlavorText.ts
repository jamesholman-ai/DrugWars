import { HiredCrewMember } from '../types/crew';
import { OwnedBusiness } from '../types/businesses';
import { OwnedSafehouse } from '../types/safehouses';
import { BUSINESS_MAP } from '../data/businesses';
import { SAFEHOUSE_MAP } from '../data/safehouses';
import { AREA_MAP } from '../data/locations';
import { appendEmpireEvent } from './empireDefaults';
import { randomInt } from '../utils/random';

/** Condition copy for property atmosphere — read-only. */
export function getPropertyConditionDescription(condition: number): string {
  if (condition >= 90) return 'Pristine — everything works, nothing squeaks.';
  if (condition >= 75) return 'Well kept — minor wear, fully functional.';
  if (condition >= 55) return 'Lived in — scuffs, patched locks, still secure.';
  if (condition >= 35) return 'Run down — neighbors notice the traffic.';
  if (condition >= 20) return 'Barely holding — repairs overdue.';
  return 'Critical — one raid away from useless.';
}

export function getPropertyNeighborhoodLine(cityId: string, areaId: string): string {
  const area = AREA_MAP[areaId];
  if (!area) return 'Quiet block. Low profile.';
  const police = area.policePresence ?? 40;
  const rivals = area.rivalInfluence ?? 40;
  if (police >= 55) return 'Heavy police presence — cameras on every corner.';
  if (rivals >= 55) return 'Hot block — rival crews watching the street.';
  if (area.cartelInfluence >= 50) return 'Cartel-adjacent — move quiet, move fast.';
  return area.description;
}

export function getPropertyAtmosphereSummary(record: OwnedSafehouse): string[] {
  const def = SAFEHOUSE_MAP[record.safehouseId];
  const lines: string[] = [];
  lines.push(getPropertyConditionDescription(record.condition));
  if (def) {
    lines.push(getPropertyNeighborhoodLine(def.cityId, def.areaId));
  }
  const upgrades = record.upgradeLevels;
  if (upgrades?.surveillance && upgrades.surveillance > 0) {
    lines.push('Security cameras active — motion alerts armed.');
  }
  if (upgrades?.hiddenCompartments && upgrades.hiddenCompartments > 0) {
    lines.push('Hidden compartments rated for seizure protection.');
  }
  const last = record.recentEvents?.[0];
  if (last) lines.push(`Latest: ${last.message}`);
  return lines;
}

export function getBusinessStoryLine(record: OwnedBusiness): string {
  const def = BUSINESS_MAP[record.businessId];
  const last = record.recentEvents?.[0];
  if (last) return last.message;
  if (record.condition < 40) return `${def?.name ?? 'Front'} struggling — needs repair.`;
  if ((record.reputation ?? 55) >= 70) return 'Regulars keep the register loud.';
  return 'Open for business — books look clean enough.';
}

export function getCrewPersonalityLine(member: HiredCrewMember): string {
  const last = member.recentEvents?.[0];
  if (last) return last.message;
  if (member.morale != null && member.morale >= 80) return 'Riding high — loyal and locked in.';
  if (member.stress != null && member.stress >= 70) return 'Running hot — watch for mistakes.';
  if (member.daysUnpaid > 0) return 'Payroll missed — trust eroding.';
  return `${member.specialty ?? member.role} on the roster.`;
}

const CREW_FLAVOR_LINES = [
  (n: string) => `${n} asked about a raise — reminded them who's signing checks.`,
  (n: string) => `${n} recommended a new supplier contact uptown.`,
  (n: string) => `${n}'s birthday — crew morale got a small bump.`,
  (n: string) => `${n} and another crew member argued over territory.`,
  (n: string) => `${n} brought intel on a rival moving product nearby.`,
  (n: string) => `${n} requested a few days off — denied for now.`,
  (n: string) => `${n} picked up a minor injury on a street run.`,
  (n: string) => `${n} warned you someone on payroll is talking.`,
];

const BUSINESS_FLAVOR_LINES = [
  'Celebrity spotted at the bar — record sales day.',
  'Liquor license inspection passed quietly.',
  'Neighborhood appreciation post — front looks legit.',
  'Tax audit scheduled — accountant watching the books.',
  'Graffiti tagged the alley — cleaned before opening.',
  'VIP table ran up a five-figure tab.',
];

const PROPERTY_FLAVOR_LINES = [
  'Security camera flagged motion at 3 AM — false alarm.',
  'Graffiti appeared on the block — scrubbed clean.',
  'Repair crew finished patching the back entrance.',
  'Neighbor posted about odd traffic — kept heads down.',
  'Hidden stash compartment tested — seals hold.',
];

/** Low-chance flavor append during daily ticks — uses existing recentEvents field. */
export function maybeAppendCrewFlavor(
  member: HiredCrewMember,
  day: number,
  random: () => number = Math.random
): Partial<HiredCrewMember> | null {
  if (member.status !== 'hired' || random() > 0.07) return null;
  const line = CREW_FLAVOR_LINES[randomInt(0, CREW_FLAVOR_LINES.length - 1)](member.name);
  return {
    recentEvents: appendEmpireEvent(member.recentEvents, day, line, 'neutral'),
  };
}

export function maybeAppendBusinessFlavor(
  record: OwnedBusiness,
  day: number,
  random: () => number = Math.random
): Partial<OwnedBusiness> | null {
  if (record.condition <= 0 || random() > 0.06) return null;
  const line = BUSINESS_FLAVOR_LINES[randomInt(0, BUSINESS_FLAVOR_LINES.length - 1)];
  return {
    recentEvents: appendEmpireEvent(record.recentEvents, day, line, 'neutral'),
  };
}

export function maybeAppendPropertyFlavor(
  record: OwnedSafehouse,
  day: number,
  random: () => number = Math.random
): Partial<OwnedSafehouse> | null {
  if (record.condition <= 0 || random() > 0.06) return null;
  const line = PROPERTY_FLAVOR_LINES[randomInt(0, PROPERTY_FLAVOR_LINES.length - 1)];
  return {
    recentEvents: appendEmpireEvent(record.recentEvents, day, line, 'neutral'),
  };
}

/** Celebratory copy for major actions — presentation only. */
export const ACTION_FEEDBACK = {
  businessPurchased: (name: string) => `Empire expanding — ${name} is yours.`,
  crewHired: (name: string) => `Welcome to the organization, ${name}.`,
  propertyPurchased: (name: string) => `New base secured — ${name}.`,
  propertyUpgraded: (label: string) => `Security increased — ${label} upgraded.`,
  businessUpgraded: (label: string) => `Front upgraded — ${label} improved.`,
  debtPaid: (amount: number) => `Loan reduced — $${amount.toLocaleString()} toward the shark.`,
  missionComplete: (title: string) => `Mission complete — ${title}. Payout incoming.`,
} as const;
