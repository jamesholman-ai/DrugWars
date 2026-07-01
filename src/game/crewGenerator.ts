import { CrewBonuses, CrewRole } from '../types/crew';
import { RankId } from '../types/progression';
import { BALANCE } from '../data/balanceConfig';
import { CREW_ROLE_WEIGHTS, DistrictArchetype, getDistrictArchetype } from '../data/districtFlavor';
import { CITY_AREA_MAP } from '../data/areas';
import { DISTRICT_CREW_POOL_SIZE } from '../data/businessTemplates';
import { getCrewSkillCapForRank } from '../data/rankBenefits';
import { CrewTemplate, templateToOffer } from '../data/crewCatalog';
import { createSeededRandom } from '../utils/seededRandom';
import { hashCombine } from '../utils/hash';
import { clamp } from '../utils/random';

const FIRST_NAMES = [
  'Marcus', 'Tiana', 'Diego', 'Keisha', 'Vince', 'Rosa', 'Jamal', 'Nina', 'Omar', 'Lena',
  'Tyrell', 'Sasha', 'Rico', 'Ava', 'Dante', 'Mia', 'Andre', 'Zoe', 'Carlos', 'Jade',
  'Malik', 'Priya', 'Leo', 'Crystal', 'Renzo', 'Aaliyah', 'Ghost', 'Blaze', 'Nova', 'King',
];

const LAST_NAMES = [
  'Morales', 'Washington', 'Chen', 'Rivera', 'Brooks', 'Nguyen', 'Carter', 'Silva', 'Hayes', 'Torres',
  'Kim', 'Jackson', 'Patel', 'Flores', 'Wright', 'Diaz', 'Murphy', 'Singh', 'Reed', 'Banks',
];

const STREET_NAMES = [
  'Little Tee', 'Iron Mike', 'Silk', 'Ghost', 'Blaze', 'Razor', 'Stacks', 'Dice', 'Smoke', 'Chain',
  'Neon', 'Cash', 'Viper', 'Ghostface', 'Brick', 'Slick', 'Torch', 'Grime', 'Ace', 'Bolt',
];

const PERSONALITY_LINES = [
  'Keeps their head down and hands clean.',
  'All business — no small talk.',
  'Loyal until the money stops.',
  'Knows every back door on the block.',
  'Never misses a shift.',
  'Runs hot when the pressure rises.',
  'Quiet eyes, loud results.',
  'Always scouting the next angle.',
  'Old-school street discipline.',
  'Thrives in chaos.',
];

const ROLE_SPECIALTIES: Record<CrewRole, string[]> = {
  runner: ['Quick drops', 'Corner routes', 'Last-mile delivery'],
  lookout: ['Police patterns', 'Rooftop watch', 'Radio silence'],
  enforcer: ['Collections', 'Door muscle', 'Territory pressure'],
  smuggler: ['Port runs', 'Border lanes', 'Customs gaps'],
  accountant: ['Clean books', 'Debt tracking', 'Shell invoices'],
  fixer: ['City hall', 'Permit grease', 'Witness quiet'],
  dealer: ['VIP clients', 'Bulk moves', 'Night shift sales'],
  supplier_scout: ['Wholesale leads', 'Trust building', 'Price intel'],
};

const ROLE_BONUS_BUILDERS: Record<CrewRole, (skill: number, random: () => number) => CrewBonuses> = {
  runner: (skill) => ({ carryCapacity: 8 + Math.floor(skill / 5) }),
  lookout: (skill) => ({ policeEncounterReduction: 0.04 + skill / 500 }),
  enforcer: (skill) => ({ combatBonus: 4 + Math.floor(skill / 8) }),
  smuggler: (skill) => ({ travelRiskReduction: 0.08 + skill / 400 }),
  accountant: (skill) => ({ debtInterestReduction: 0.08 + skill / 500 }),
  fixer: (skill) => ({ heatReductionBonus: 1 + Math.floor(skill / 25), bribeBonus: 0.05 + skill / 600 }),
  dealer: (skill) => ({ salePriceBonus: 0.04 + skill / 500, contractPayoutBonus: 0.03 + skill / 600 }),
  supplier_scout: (skill) => ({
    supplierDiscountBonus: 0.03 + skill / 600,
    supplierReliabilityBonus: 0.04 + skill / 500,
  }),
};

const RISK_TRAITS = [
  'Paranoid', 'Reckless', 'Talkative', 'Violent past', 'Connected', 'Night owl', 'Bilingual',
  'Strip savvy', 'Old money', 'Cartel ties', 'Gambling habit', 'Short fuse',
];

function pickWeightedRole(archetype: DistrictArchetype, random: () => number): CrewRole {
  const weights = CREW_ROLE_WEIGHTS[archetype] ?? CREW_ROLE_WEIGHTS.general;
  const entries = Object.entries(weights) as [CrewRole, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [role, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return role;
  }
  return 'runner';
}

function generateCrewName(random: () => number): string {
  const style = Math.floor(random() * 3);
  if (style === 0) return STREET_NAMES[Math.floor(random() * STREET_NAMES.length)] ?? 'Ghost';
  if (style === 1) {
    return `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]}`;
  }
  return `${FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]} "${STREET_NAMES[Math.floor(random() * STREET_NAMES.length)]}"`;
}

function tierForSkill(skill: number): number {
  if (skill >= 85) return 5;
  if (skill >= 72) return 4;
  if (skill >= 58) return 3;
  if (skill >= 45) return 2;
  return 1;
}

function minRankForSkill(skill: number): RankId | undefined {
  const tier = tierForSkill(skill);
  if (tier <= 1) return undefined;
  if (tier === 2) return 'runner';
  if (tier === 3) return 'hustler';
  if (tier === 4) return 'dealer';
  if (tier === 5) return 'plug';
  return 'shot_caller';
}

export function generateCrewTemplate(
  cityId: string,
  areaId: string,
  seedIndex: number,
  runSeed: number,
  playerRank: RankId,
  playerReputation: number
): CrewTemplate {
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, 'crew', seedIndex));
  const archetype = getDistrictArchetype(areaId);
  const role = pickWeightedRole(archetype, rng);
  const skillCap = getCrewSkillCapForRank(playerRank);
  const qualityBias = Math.min(0.35, playerReputation / 300);
  const skill = clamp(
    Math.round(28 + rng() * (skillCap - 28) * (0.65 + qualityBias)),
    25,
    skillCap
  );
  const loyalty = clamp(Math.round(48 + skill / 4 + rng() * 12), 40, 95);
  const riskRoll = rng();
  const salaryPerDay = Math.round((55 + skill * 1.8 + rng() * 40) * BALANCE.payrollScale);
  const hireCost = Math.round((400 + skill * 12 + rng() * 800) * BALANCE.payrollScale);
  const bonuses = ROLE_BONUS_BUILDERS[role](skill, rng);
  const traits = [
    RISK_TRAITS[Math.floor(rng() * RISK_TRAITS.length)] ?? 'Connected',
    ...(riskRoll > 0.72 ? [RISK_TRAITS[Math.floor(rng() * RISK_TRAITS.length)] ?? 'Reckless'] : []),
  ];
  const minRank = minRankForSkill(skill);
  const minReputation = skill >= 70 ? 40 : skill >= 55 ? 25 : skill >= 42 ? 12 : undefined;

  return {
    id: `${areaId}_crew_${seedIndex}`,
    name: generateCrewName(rng),
    role,
    cityId,
    areaId,
    skill,
    loyalty,
    salaryPerDay,
    hireCost,
    bonuses,
    riskTraits: traits,
    minRank,
    minReputation,
  };
}

export function parseGeneratedCrewTemplateId(
  templateId: string
): { cityId: string; areaId: string; seedIndex: number } | null {
  const marker = '_crew_';
  const idx = templateId.lastIndexOf(marker);
  if (idx < 0) return null;
  const areaId = templateId.slice(0, idx);
  const seedIndex = Number(templateId.slice(idx + marker.length));
  if (!Number.isFinite(seedIndex)) return null;
  const area = CITY_AREA_MAP[areaId];
  if (!area) return null;
  return { cityId: area.cityId, areaId, seedIndex };
}

export function getCrewPersonalityLine(templateId: string, runSeed: number): string {
  const rng = createSeededRandom(hashCombine(runSeed, templateId, 'personality'));
  return PERSONALITY_LINES[Math.floor(rng() * PERSONALITY_LINES.length)] ?? PERSONALITY_LINES[0];
}

export function getCrewSpecialty(role: CrewRole, seedIndex: number, runSeed: number): string {
  const options = ROLE_SPECIALTIES[role];
  const rng = createSeededRandom(hashCombine(runSeed, role, seedIndex, 'specialty'));
  return options[Math.floor(rng() * options.length)] ?? role;
}

export function generateDistrictCrewPool(
  cityId: string,
  areaId: string,
  runSeed: number,
  playerRank: RankId,
  playerReputation: number,
  poolSize = DISTRICT_CREW_POOL_SIZE
): CrewTemplate[] {
  const pool: CrewTemplate[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < poolSize; i++) {
    let template = generateCrewTemplate(cityId, areaId, i, runSeed, playerRank, playerReputation);
    let attempts = 0;
    while (usedNames.has(template.name) && attempts < 6) {
      template = generateCrewTemplate(cityId, areaId, i + attempts * 503, runSeed, playerRank, playerReputation);
      attempts++;
    }
    usedNames.add(template.name);
    pool.push(template);
  }
  return pool;
}

export { templateToOffer };
