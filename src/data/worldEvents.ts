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
    areaId.includes('club_district') ||
    areaId.includes('compton') ||
    areaId.includes('zone_6') ||
    areaId.endsWith('_south_side')
  );
});

const PORT_AREA_KEYS = ALL_AREA_KEYS.filter((key) => {
  const areaId = key.split(':')[1] ?? '';
  return areaId.includes('port') || areaId.includes('harbor') || areaId.includes('dock');
});

const CLUB_AREA_KEYS = ALL_AREA_KEYS.filter((key) => {
  const areaId = key.split(':')[1] ?? '';
  return (
    areaId.includes('strip') ||
    areaId.includes('south_beach') ||
    areaId.includes('club_district') ||
    areaId.includes('hollywood') ||
    areaId.includes('red_light')
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
  {
    type: 'local_shortage',
    title: 'Local Shortage',
    description: 'Supply dried up in one district. Scarcity is spiking prices.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 1,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 1, medium: 2, high: 3 },
    priceMultiplierBySeverity: { low: 2.2, medium: 3.5, high: 5.5 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 8,
  },
  {
    type: 'city_shortage',
    title: 'City Shortage',
    description: 'Citywide supply crunch. Prices climbing across districts.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 4,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 2.0, medium: 3.0, high: 4.5 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 7,
  },
  {
    type: 'local_surplus',
    title: 'Local Surplus',
    description: 'Flooded corners in one district. Prices collapsing locally.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 1,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 1, medium: 2, high: 3 },
    priceMultiplierBySeverity: { low: 0.65, medium: 0.5, high: 0.35 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 8,
  },
  {
    type: 'city_surplus',
    title: 'City Surplus',
    description: 'Wholesale hit the streets. Citywide price drop.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 4,
    maxAffectedCommodities: 3,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 0.7, medium: 0.55, high: 0.4 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 7,
  },
  {
    type: 'bad_batch',
    title: 'Bad Batch Panic',
    description: 'Bad product scare pulled supply off the street.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 2,
    maxAffectedCommodities: 1,
    durationBySeverity: { low: 1, medium: 2, high: 3 },
    priceMultiplierBySeverity: { low: 1.8, medium: 2.5, high: 4.0 },
    heatMultiplierBySeverity: { low: 1.1, medium: 1.2, high: 1.3 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 6,
  },
  {
    type: 'dea_raid',
    title: 'DEA Raid',
    description: 'Federal sweep seized product. Shortages and heat rising.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 3,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 5 },
    priceMultiplierBySeverity: { low: 2.0, medium: 3.0, high: 5.0 },
    heatMultiplierBySeverity: { low: 1.4, medium: 1.6, high: 1.85 },
    eventWeightModifiersBySeverity: {
      low: { police_raid: 1.4 },
      medium: { police_raid: 1.6, police_stop: 1.3 },
      high: { police_raid: 1.9, police_stop: 1.5 },
    },
    spawnWeight: 6,
  },
  {
    type: 'police_warehouse_break_in',
    title: 'Evidence Room Leak',
    description: 'Stolen police evidence flooded the streets.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 2,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 1, medium: 2, high: 3 },
    priceMultiplierBySeverity: { low: 0.6, medium: 0.45, high: 0.3 },
    heatMultiplierBySeverity: { low: 1.2, medium: 1.35, high: 1.5 },
    eventWeightModifiersBySeverity: { low: { police_stop: 1.2 }, medium: { police_stop: 1.35 }, high: { police_stop: 1.5 } },
    spawnWeight: 5,
  },
  {
    type: 'gang_war_supply_block',
    title: 'Supply Blockade',
    description: 'Gang war choked movement through contested blocks.',
    locationPool: GANG_WAR_AREAS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 3,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 2.0, medium: 3.0, high: 4.5 },
    heatMultiplierBySeverity: { low: 1.15, medium: 1.25, high: 1.4 },
    eventWeightModifiersBySeverity: {
      low: { rival_dealer: 1.5, robbery_attempt: 1.3 },
      medium: { rival_dealer: 1.8, robbery_attempt: 1.5 },
      high: { rival_dealer: 2.1, robbery_attempt: 1.7 },
    },
    spawnWeight: 6,
  },
  {
    type: 'cartel_dumping_product',
    title: 'Cartel Dump',
    description: 'Cartel dumping product to undercut rivals.',
    locationPool: ALL_AREA_KEYS,
    commodityPool: ALL_COMMODITY_IDS,
    maxAffectedLocations: 5,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 0.65, medium: 0.5, high: 0.35 },
    heatMultiplierBySeverity: { low: 1.05, medium: 1.1, high: 1.15 },
    eventWeightModifiersBySeverity: { low: { rival_dealer: 1.2 }, medium: { rival_dealer: 1.35 }, high: { rival_dealer: 1.5 } },
    spawnWeight: 6,
  },
  {
    type: 'festival_demand_surge',
    title: 'Festival Demand Surge',
    description: 'Weekend crowds emptied party-district stock.',
    locationPool: CLUB_AREA_KEYS.length > 0 ? CLUB_AREA_KEYS : ALL_AREA_KEYS,
    commodityPool: ['ecstasy', 'mdma', 'cocaine', 'ketamine', 'lsd', 'mushrooms'],
    maxAffectedLocations: 3,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 1, medium: 2, high: 3 },
    priceMultiplierBySeverity: { low: 1.8, medium: 2.5, high: 3.5 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1.05 },
    eventWeightModifiersBySeverity: { low: {}, medium: {}, high: {} },
    spawnWeight: 7,
  },
  {
    type: 'port_seizure',
    title: 'Port Seizure',
    description: 'Customs seized import shipments at the docks.',
    locationPool: PORT_AREA_KEYS.length > 0 ? PORT_AREA_KEYS : ALL_AREA_KEYS,
    commodityPool: ['cocaine', 'heroin', 'meth', 'hashish', 'opium'],
    maxAffectedLocations: 2,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 2.0, medium: 3.0, high: 4.5 },
    heatMultiplierBySeverity: { low: 1.2, medium: 1.35, high: 1.5 },
    eventWeightModifiersBySeverity: { low: { police_stop: 1.2 }, medium: { police_stop: 1.35 }, high: { police_stop: 1.5 } },
    spawnWeight: 6,
  },
  {
    type: 'smuggling_route_opened',
    title: 'Smuggling Route Opened',
    description: 'New import lane opened — product flooding in.',
    locationPool: PORT_AREA_KEYS.length > 0 ? PORT_AREA_KEYS : ALL_AREA_KEYS,
    commodityPool: ['cocaine', 'heroin', 'meth', 'hashish', 'weed'],
    maxAffectedLocations: 3,
    maxAffectedCommodities: 2,
    durationBySeverity: { low: 2, medium: 3, high: 4 },
    priceMultiplierBySeverity: { low: 0.75, medium: 0.6, high: 0.45 },
    heatMultiplierBySeverity: { low: 1, medium: 1, high: 1 },
    eventWeightModifiersBySeverity: { low: { supplier_discount: 1.2 }, medium: { supplier_discount: 1.35 }, high: { supplier_discount: 1.5 } },
    spawnWeight: 6,
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
