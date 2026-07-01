import { CommodityId } from '../types/game';
import { COMMODITY_MAP } from './commodities';
import { CITY_MAP, getAreaLabel } from './locations';

export interface ScenarioContext {
  drug?: CommodityId;
  cityId?: string;
  areaId?: string;
  faction?: string;
  event?: string;
  days?: number;
  direction?: string;
  risk?: string;
  priceChange?: string;
  supplier?: string;
  buyer?: string;
}

const FACTIONS = ['Los Zetas', 'Sinaloa crew', 'MS-13', 'Triads', 'Bloods', 'Crips', 'Cartel Norte'];
const SUPPLIERS = ['Ghost Line', 'Red Door', 'Harbor Mike', 'The Chemist', 'Night Owl'];
const BUYERS = ['VIP table', 'Warehouse crew', 'Club buyers', 'Street runners', 'Wholesale broker'];

export function pickFaction(seed: number): string {
  return FACTIONS[seed % FACTIONS.length]!;
}

export function pickSupplier(seed: number): string {
  return SUPPLIERS[seed % SUPPLIERS.length]!;
}

export function pickBuyer(seed: number): string {
  return BUYERS[seed % BUYERS.length]!;
}

/** Replace {placeholders} in scenario/intel templates. */
export function fillScenarioTemplate(template: string, ctx: ScenarioContext): string {
  const drug = ctx.drug ? (COMMODITY_MAP[ctx.drug]?.name ?? ctx.drug) : 'product';
  const city = ctx.cityId ? (CITY_MAP[ctx.cityId]?.name ?? ctx.cityId) : 'the city';
  const area =
    ctx.areaId && ctx.cityId
      ? getAreaLabel(ctx.cityId, ctx.areaId)
      : ctx.areaId ?? 'the district';
  const faction = ctx.faction ?? pickFaction(3);
  const event = ctx.event ?? 'crackdown';
  const days = ctx.days != null ? String(ctx.days) : '2';
  const direction = ctx.direction ?? 'up';
  const risk = ctx.risk ?? 'high';
  const priceChange = ctx.priceChange ?? '30%';
  const supplier = ctx.supplier ?? pickSupplier(5);
  const buyer = ctx.buyer ?? pickBuyer(7);

  return template
    .replace(/\{drug\}/gi, drug)
    .replace(/\{city\}/gi, city)
    .replace(/\{area\}/gi, area)
    .replace(/\{faction\}/gi, faction)
    .replace(/\{event\}/gi, event)
    .replace(/\{days\}/gi, days)
    .replace(/\{direction\}/gi, direction)
    .replace(/\{risk\}/gi, risk)
    .replace(/\{priceChange\}/gi, priceChange)
    .replace(/\{supplier\}/gi, supplier)
    .replace(/\{buyer\}/gi, buyer);
}
