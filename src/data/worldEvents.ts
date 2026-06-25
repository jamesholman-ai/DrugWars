import { CommodityId, WorldEventSeverity, WorldEventType } from '../types/game';
import { WorldEventWeightModifiers } from '../types/game';
import { COMMODITIES } from './commodities';
import { getAllAreaKeys } from './locations';
import { isAirportArea } from './areas';

export interface WorldEventTemplate {
  type: WorldEventType;
  title: string;
  description: string;
  locationPool: string[];
  commodityPool: CommodityId[];
  maxAffectedLocations: number;
  maxAffectedCommodities: number;
  durationBySeverity: Record<WorldEventSeverity, number>;
  priceMultiplierBySeverity: Record<WorldEventSeverity, number>;
  heatMultiplierBySeverity: Record<WorldEventSeverity, number>;
  eventWeightModifiersBySeverity: Record<WorldEventSeverity, WorldEventWeightModifiers>;
  spawnWeight: number;
}

const ALL_AREA_KEYS = getAllAreaKeys();
const ALL_COMMODITY_IDS = COMMODITIES.map((c) => c.id) as CommodityId[];

const GANG_WAR_AREAS = ALL_AREA_KEYS.filter((key) => {
  const areaId = key.split(':')[1] ?? '';
  return (
    areaId.endsWith('_downtown') ||
    areaId.endsWith('_central') ||
    areaId.endsWith('_centrum') ||
    areaId.endsWith('_strip') ||
    areaId.includes('industrial') ||
    areaId.includes('zone_6') ||
    areaId.endsWith('_harlem') ||
    areaId.endsWith('_bronx') ||
    areaId.endsWith('_south_side')
  );
});

const AIRPORT_AREA_KEYS = ALL_AREA_KEYS.filter((key) => {
  const areaId = key.split(':')[1] ?? '';
  return isAirportArea(areaId);
});

export const WORLD_EVENT_TEMPLATES: WorldEventTemplate[] = [
  {
    type: 'market_shortage',
    title: 'Market Shortage',
    description: 'Supply dried up. Scarcity is driving prices through the roof.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 8,
    maxAffectedCommodities: 3,
    durationBySeverity: { low: 2, medium: 3, high: 5 },
    priceMultiplierBySeverity: { low: 2.5, medium: 4.0, high: 7.0 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 12,
  },
  {
    type: 'police_crackdown',
    title: 'Police Crackdown',
    description: 'Extra patrols, checkpoints, and raids. Heat sticks faster.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: [],
    maxAffectedLocations: 0,
    maxAffectedCommodities: 0,
    durationBySeverity: { low: 3, medium: 4, high: 6 },
    priceMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    heatMultiplierBySeverity: { low: 1.3, medium: 1.55, high: 1.85 },
    eventWeightModifiersBySeverity: {
      low: { police_stop: 1.4, police_raid: 1.3 },
      medium: { police_stop: 1.7, police_raid: 1.6 },
      high: { police_stop: 2.1, police_raid: 1.9 },
    },
    spawnWeight: 11,
  },
  {
    type: 'gang_war',
    title: 'Gang War',
    description: 'Territory lines are burning. Rivals and stick-up crews everywhere.',
    locationPool: GANG_WAR_AREAS,
    commodityPool: [],
    maxAffectedLocations: 6,
    maxAffectedCommodities: 0,
    durationBySeverity: { low: 2, medium: 4, high: 5 },
    priceMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    heatMultiplierBySeverity: { low: 1.1, medium: 1.2, high: 1.3 },
    eventWeightModifiersBySeverity: {
      low: { rival_dealer: 1.4, robbery_attempt: 1.3 },
      medium: { rival_dealer: 1.7, robbery_attempt: 1.5 },
      high: { rival_dealer: 2, robbery_attempt: 1.8 },
    },
    spawnWeight: 10,
  },
  {
    type: 'market_boom',
    title: 'Market Boom',
    description: 'Buyers are desperate. Prices are climbing worldwide.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 0,
    maxAffectedCommodities: 4,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 2.0, medium: 3.5, high: 6.0 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 10,
  },
  {
    type: 'market_crash',
    title: 'Market Crash',
    description: 'Flooded streets. Nobody wants to pay retail anymore.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 0,
    maxAffectedCommodities: 3,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 0.55, medium: 0.4, high: 0.25 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 10,
  },
  {
    type: 'airport_lockdown',
    title: 'Airport Lockdown',
    description: 'Federal sweep at the terminal. Flights grounded — smuggling routes closed.',
    locationPool: AIRPORT_AREA_KEYS,
    commodityPool: ['cocaine', 'heroin', 'weed'],
    maxAffectedLocations: 4,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 0.95, medium: 0.9, high: 0.85 },
    heatMultiplierBySeverity: { low: 1.35, medium: 1.55, high: 1.75 },
    eventWeightModifiersBySeverity: {
      low: { police_stop: 1.2 },
      medium: { police_stop: 1.35, police_raid: 1.2 },
      high: { police_stop: 1.5, police_raid: 1.35 },
    },
    spawnWeight: 7,
  },
  {
    type: 'supplier_flood',
    title: 'Supplier Flood',
    description: 'Wholesale hit the streets hard. Prices are bottoming out.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 6,
    maxAffectedCommodities: 3,
    durationBySeverity: { low: 3, medium: 4, high: 5 },
    priceMultiplierBySeverity: { low: 0.6, medium: 0.45, high: 0.3 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    eventWeightModifiersBySeverity: {
      low: { supplier_discount: 1.3 },
      medium: { supplier_discount: 1.5 },
      high: { supplier_discount: 1.7 },
    },
    spawnWeight: 9,
  },
  {
    type: 'informant_network_buzz',
    title: 'Informant Network Buzz',
    description: 'Whispers on every corner. Tips are flowing through the grapevine.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: [],
    maxAffectedLocations: 0,
    maxAffectedCommodities: 0,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    eventWeightModifiersBySeverity: {
      low: { informant_tip: 1.5 },
      medium: { informant_tip: 1.85 },
      high: { informant_tip: 2.25 },
    },
    spawnWeight: 8,
  },
];

export const WORLD_EVENT_TEMPLATE_MAP = Object.fromEntries(
  WORLD_EVENT_TEMPLATES.map((t) => [t.type, t])
) as Record<WorldEventType, WorldEventTemplate>;

export const MAX_ACTIVE_WORLD_EVENTS = 3;

export const WORLD_EVENT_ROLL_CHANCE = 0.14;

export const SEVERITY_WEIGHTS = [
  { severity: 'low' as WorldEventSeverity, weight: 50 },
  { severity: 'medium' as WorldEventSeverity, weight: 35 },
  { severity: 'high' as WorldEventSeverity, weight: 15 },
];

export { ALL_AREA_KEYS as ALL_LOCATION_IDS, ALL_COMMODITY_IDS };
