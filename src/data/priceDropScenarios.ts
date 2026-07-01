import { CommodityId } from '../types/game';
import { COMMODITIES } from './commodities';
import { CITIES } from './locations';
import { fillScenarioTemplate, ScenarioContext } from './scenarioContext';

const DROP_CORE: readonly string[] = [
  'Police warehouse was broken into; {drug} flooded the streets of {area}.',
  'Rival gang dumped cheap {drug} to undercut competitors in {city}.',
  'Supplier flood hit {area}; {drug} prices crashed.',
  'Bad debt liquidation pushed {drug} inventory into the {city} market.',
  'Customs leak flooded {city} with {drug}.',
  'Cartel overstock sent {drug} prices down across {area}.',
  'Stolen shipment of {drug} hit the streets in {area}.',
  'Club scene cooled off; {drug} demand dropped in {city}.',
  'New supplier route made {drug} common in {area}.',
  'Dealers panic-sold {drug} after crackdown rumors in {city}.',
  '{faction} flooded {area} with cut-rate {drug}.',
  'Port inspection backlog released a wave of {drug} into {city}.',
  'Warehouse leak may flood {city} with {drug} for {days} days.',
  'Wholesale broker offloading {drug} cheap in {area}.',
  'Seasonal slump — {drug} down {priceChange} in {city}.',
  'Rival bust left {drug} orphaned on the market in {area}.',
  'Import route reopened; {drug} prices bottoming in {city}.',
  'Night shift unload dumped {drug} across {area}.',
  'Buyers vanished; {drug} sitting on corners in {city}.',
  'Cartel dumping excess {drug} before tax season in {area}.',
];

const DROP_VARIANTS: readonly string[] = [
  'Street price for {drug} sliding {priceChange} in {area}.',
  '{buyer} stopped picking up {drug} in {city}.',
  '{supplier} over-delivered — {drug} everywhere in {area}.',
  'Heat scared off premium buyers for {drug} in {city}.',
  'Smuggling route opened; {drug} cheap in {area}.',
];

function expandTemplates(
  cores: readonly string[],
  variants: readonly string[],
  drugs: CommodityId[],
  minCount: number
): string[] {
  const out: string[] = [];
  let i = 0;
  while (out.length < minCount) {
    const base = cores[i % cores.length]!;
    const variant = variants[i % variants.length]!;
    const drug = drugs[i % drugs.length]!;
    const city = CITIES[i % CITIES.length]!.id;
    out.push(
      fillScenarioTemplate(`${base} ${variant}`, {
        drug,
        cityId: city,
        areaId: `${city}_downtown`,
        days: 1 + (i % 5),
        priceChange: `${10 + (i % 40)}%`,
      })
    );
    i++;
  }
  return out;
}

export const PRICE_DROP_SCENARIOS: readonly string[] = Object.freeze(
  expandTemplates(DROP_CORE, DROP_VARIANTS, COMMODITIES.map((c) => c.id), 100)
);

export function pickPriceDropScenario(
  random: () => number,
  ctx: Partial<ScenarioContext> = {}
): string {
  const template = DROP_CORE[Math.floor(random() * DROP_CORE.length)]!;
  return fillScenarioTemplate(template, ctx as ScenarioContext);
}

export function getPriceDropScenarioCount(): number {
  return PRICE_DROP_SCENARIOS.length;
}
