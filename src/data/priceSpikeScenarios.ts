import { CommodityId } from '../types/game';
import { COMMODITIES } from './commodities';
import { CITIES } from './locations';
import { fillScenarioTemplate, ScenarioContext } from './scenarioContext';

const SPIKE_CORE: readonly string[] = [
  'Raccoons got into a hidden stash of {drug}; supply collapsed in {area}.',
  'DEA raid seized a shipment of {drug}; prices are exploding across {city}.',
  'Rival gang war blocked {drug} movement through {area}.',
  'Bad batch panic removed {drug} from street supply in {area}.',
  'Airport inspectors seized {drug}; sellers in {city} are charging premiums.',
  'Supplier vanished with {drug}; the {area} market is desperate.',
  'Club demand for {drug} exploded overnight in {area}.',
  'Celebrity party rumor drove {drug} prices up in {city}.',
  'Cartel convoy was intercepted; {drug} supply collapsed near {area}.',
  'Warehouse fire destroyed {drug} inventory in {area}.',
  '{faction} locked down routes; {drug} barely moving through {area}.',
  'Customs sweep at the port choked {drug} imports into {city}.',
  'Informants say {drug} dried up in {area} for the next {days} days.',
  'Wholesale shortage — {drug} moving at {priceChange} above normal in {city}.',
  'Nightlife buyers in {area} are paying anything for {drug}.',
  'Police seized a lab; {drug} prices spiked citywide in {city}.',
  'Smugglers rerouted after {event}; {drug} scarce in {area}.',
  'Dock strike delayed {drug} shipments into {city}.',
  'Rival crews hoarding {drug} before a turf push in {area}.',
  'Festival weekend emptied {drug} stock across {city}.',
];

const SPIKE_VARIANTS: readonly string[] = [
  'Street chatter: {drug} is {direction} {priceChange} in {area}.',
  'Buyers in {area} panic-bidding on {drug}.',
  '{supplier} ghosted — {drug} premiums in {city}.',
  'Heat on {drug} runners raised prices in {area}.',
  'Tunnel collapse blocked {drug} into {area}.',
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
        days: 2 + (i % 4),
        priceChange: `${15 + (i % 35)}%`,
      })
    );
    i++;
  }
  return out;
}

export const PRICE_SPIKE_SCENARIOS: readonly string[] = Object.freeze(
  expandTemplates(SPIKE_CORE, SPIKE_VARIANTS, COMMODITIES.map((c) => c.id), 100)
);

export function pickPriceSpikeScenario(
  random: () => number,
  ctx: Partial<ScenarioContext> = {}
): string {
  const template = SPIKE_CORE[Math.floor(random() * SPIKE_CORE.length)]!;
  return fillScenarioTemplate(template, ctx as ScenarioContext);
}

export function getPriceSpikeScenarioCount(): number {
  return PRICE_SPIKE_SCENARIOS.length;
}
