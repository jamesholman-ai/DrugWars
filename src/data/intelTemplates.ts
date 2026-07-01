import { IntelCategory } from '../types/intel';
import { CommodityId } from '../types/game';
import { COMMODITIES } from './commodities';
import { CITIES, getAreasForCity } from './locations';
import { fillScenarioTemplate, pickBuyer, pickFaction, pickSupplier } from './scenarioContext';

export interface IntelTemplate {
  category: IntelCategory;
  template: string;
  /** Higher = more likely when category matches context. */
  weight: number;
  vague?: boolean;
}

const MARKET_TEMPLATES: IntelTemplate[] = [
  { category: 'market', template: 'Street chatter says {drug} is drying up in {area}.', weight: 10 },
  { category: 'market', template: 'A supplier in {city} is quietly discounting {drug}.', weight: 9 },
  { category: 'market', template: 'Buyers in {area} are paying premiums for {drug}.', weight: 9 },
  { category: 'market', template: 'A warehouse leak may flood {city} with {drug} soon.', weight: 8 },
  { category: 'market', template: '{drug} prices trending {direction} about {priceChange} in {area}.', weight: 8 },
  { category: 'market', template: 'Wholesale on {drug} looks thin in {city} for {days} days.', weight: 7 },
  { category: 'market', template: 'Club buyers want {drug} bad tonight in {area}.', weight: 7 },
  { category: 'market', template: 'Port rumor: {drug} shipment delayed into {city}.', weight: 6 },
  { category: 'market', template: 'Something is off with {drug} supply near {area}.', weight: 5, vague: true },
  { category: 'market', template: 'Prices on {drug} feel wrong in {city}.', weight: 4, vague: true },
];

const POLICE_TEMPLATES: IntelTemplate[] = [
  { category: 'police', template: 'DEA vans were seen near {area}. Lay low for {days} days.', weight: 10 },
  { category: 'police', template: 'Airport police are watching couriers into {city}.', weight: 9 },
  { category: 'police', template: 'Checkpoint blitz rumored in {area} this week.', weight: 8 },
  { category: 'police', template: 'Undercover buys reported on {drug} in {area}.', weight: 8 },
  { category: 'police', template: 'Heat is rising. Consider using a property or lawyer.', weight: 7 },
  { category: 'police', template: 'Federal task force sniffing around {city}.', weight: 7 },
  { category: 'police', template: 'Cops heavy near {area} — {risk} risk.', weight: 6 },
  { category: 'police', template: 'Something big brewing with police in {city}.', weight: 4, vague: true },
];

const TRAVEL_TEMPLATES: IntelTemplate[] = [
  { category: 'travel', template: 'Travel through {area} is risky for {days} days.', weight: 9 },
  { category: 'travel', template: '{faction} is blocking routes through {area}.', weight: 9 },
  { category: 'travel', template: 'Smuggling lane into {city} may open soon.', weight: 8 },
  { category: 'travel', template: 'Airport lockdown chatter in {city} — plan around it.', weight: 8 },
  { category: 'travel', template: 'Cheaper {drug} rumored in {city} right now.', weight: 7 },
  { category: 'travel', template: 'Avoid {area} unless you need to move product.', weight: 6 },
  { category: 'travel', template: 'Routes feel hot near {area}.', weight: 4, vague: true },
];

const EMPIRE_TEMPLATES: IntelTemplate[] = [
  { category: 'empire', template: 'Businesses in {city} may face inspections soon.', weight: 9 },
  { category: 'empire', template: 'Your crew heard {faction} is watching {area}.', weight: 8 },
  { category: 'empire', template: 'Property near {area} could draw heat this week.', weight: 8 },
  { category: 'empire', template: '{supplier} wants meet in {area} — bring cash.', weight: 7 },
  { category: 'empire', template: 'Safehouse traffic flagged in {city}. Rotate spots.', weight: 7 },
  { category: 'empire', template: 'Crew payroll pressure rising — watch cash flow.', weight: 6 },
  { category: 'empire', template: 'Empire assets in {city} need attention.', weight: 5, vague: true },
];

const RUMOR_TEMPLATES: IntelTemplate[] = [
  { category: 'rumor', template: 'Someone said {drug} is everywhere in {city}. Might be noise.', weight: 6, vague: true },
  { category: 'rumor', template: 'Wild rumor: {faction} moving product through {area}.', weight: 5, vague: true },
  { category: 'rumor', template: 'Bar talk about a {event} hitting {city}.', weight: 5, vague: true },
  { category: 'rumor', template: 'Unverified: {buyer} wants bulk {drug} in {area}.', weight: 5, vague: true },
  { category: 'rumor', template: 'Could be nothing, but {area} feels tense.', weight: 4, vague: true },
];

export const INTEL_TEMPLATE_POOL: readonly IntelTemplate[] = Object.freeze([
  ...MARKET_TEMPLATES,
  ...POLICE_TEMPLATES,
  ...TRAVEL_TEMPLATES,
  ...EMPIRE_TEMPLATES,
  ...RUMOR_TEMPLATES,
]);

/** Expand templates × drugs × cities × areas for 1000+ unique messages. */
export function expandIntelCombinations(): string[] {
  const combos: string[] = [];
  const drugs = COMMODITIES.map((c) => c.id);
  for (const t of INTEL_TEMPLATE_POOL) {
    for (const city of CITIES) {
      const areas = getAreasForCity(city.id);
      for (let i = 0; i < drugs.length; i++) {
        const drug = drugs[i]!;
        const area = areas[i % Math.max(1, areas.length)]!;
        combos.push(
          fillScenarioTemplate(t.template, {
            drug,
            cityId: city.id,
            areaId: area.id,
            days: 1 + (i % 4),
            direction: i % 2 === 0 ? 'up' : 'down',
            priceChange: `${10 + (i % 30)}%`,
            faction: pickFaction(i),
            supplier: pickSupplier(i),
            buyer: pickBuyer(i),
            event: i % 3 === 0 ? 'crackdown' : 'raid',
            risk: i % 2 === 0 ? 'high' : 'moderate',
          })
        );
      }
    }
  }
  return combos;
}

let cachedComboCount: number | null = null;

export function getIntelCombinationCount(): number {
  if (cachedComboCount == null) {
    cachedComboCount = expandIntelCombinations().length;
  }
  return cachedComboCount;
}

export function pickIntelTemplate(
  category: IntelCategory | undefined,
  random: () => number
): IntelTemplate {
  const pool = category
    ? INTEL_TEMPLATE_POOL.filter((t) => t.category === category)
    : [...INTEL_TEMPLATE_POOL];
  const total = pool.reduce((s, t) => s + t.weight, 0);
  let roll = random() * total;
  for (const t of pool) {
    roll -= t.weight;
    if (roll <= 0) return t;
  }
  return pool[pool.length - 1]!;
}

export function buildIntelMessageFromTemplate(
  template: IntelTemplate,
  ctx: {
    drug?: CommodityId;
    cityId?: string;
    areaId?: string;
    days?: number;
    direction?: string;
    priceChange?: string;
    reputation?: number;
  },
  random: () => number
): { message: string; confidence: 'high' | 'low' } {
  const vague = template.vague === true || (ctx.reputation ?? 0) < 25;
  const message = fillScenarioTemplate(template.template, {
    drug: ctx.drug,
    cityId: ctx.cityId,
    areaId: ctx.areaId,
    days: ctx.days ?? 1 + Math.floor(random() * 3),
    direction: ctx.direction ?? (random() > 0.5 ? 'up' : 'down'),
    priceChange: ctx.priceChange ?? `${10 + Math.floor(random() * 25)}%`,
    faction: pickFaction(Math.floor(random() * 100)),
    supplier: pickSupplier(Math.floor(random() * 100)),
    buyer: pickBuyer(Math.floor(random() * 100)),
    event: random() > 0.5 ? 'crackdown' : 'raid',
    risk: random() > 0.6 ? 'high' : 'moderate',
  });
  return { message, confidence: vague ? 'low' : 'high' };
}

export const INTEL_CATEGORY_LABELS: Record<IntelCategory, string> = {
  market: 'Market',
  police: 'Police',
  travel: 'Travel',
  empire: 'Empire',
  rumor: 'Rumor',
};
