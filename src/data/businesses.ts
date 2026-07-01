import { BusinessDefinition, BusinessType } from '../types/businesses';
import { RankId } from '../types/progression';
import { BUSINESS_TYPE_TEMPLATES } from './businessTemplates';
import { BALANCE } from './balanceConfig';

function b(
  id: string,
  name: string,
  type: BusinessType,
  cityId: string,
  areaId: string,
  cost: number,
  income: number,
  launder: number,
  heat: number,
  risk: number,
  upkeep: number,
  description: string,
  unlock: { requiredRank?: RankId; requiredReputation?: number } = {}
): BusinessDefinition {
  return {
    id,
    name,
    type,
    cityId,
    areaId,
    purchaseCost: cost,
    dailyIncome: income,
    launderingCapacityPerDay: launder,
    heatReductionPerDay: heat,
    riskLevel: risk,
    upkeepPerDay: upkeep,
    description,
    ...unlock,
  };
}

export const BUSINESSES: BusinessDefinition[] = [
  // Early — NY / Miami / Atlanta
  b('biz_ny_harlem_pawn', 'Uptown Pawn', 'pawn_shop', 'new_york', 'new_york_brooklyn',
    3200, 120, 200, 1, 2, 42, 'Buy low, sell lower questions.'),
  b('biz_miami_havana_laundry', 'Blue Wave Laundromat', 'laundromat', 'miami', 'miami_little_havana',
    4200, 90, 450, 2, 2, 50, 'Spin cycles and spin books.'),
  b('biz_atl_zone6_bar', 'Zone 6 Sports Bar', 'bar', 'atlanta', 'atlanta_zone_6',
    5000, 140, 250, 1, 3, 60, 'Corner pours and back-room deals.'),
  b('biz_ny_brooklyn_wash', 'Brooklyn Auto Wash', 'car_wash', 'new_york', 'new_york_brooklyn',
    3800, 100, 180, 1, 2, 48, 'Soap, wax, and washed bills.'),
  // Mid
  b('biz_miami_beach_club', 'Neon Reef Club', 'nightclub', 'miami', 'miami_south_beach',
    12000, 320, 600, 2, 4, 140, 'VIP rooms and velvet ropes.', { requiredRank: 'hustler', requiredReputation: 28 }),
  b('biz_detroit_lot', 'Motor City Used Cars', 'used_car_lot', 'detroit', 'detroit_industrial',
    9500, 260, 500, 1, 3, 120, 'Titles clean enough.', { requiredRank: 'hustler' }),
  b('biz_vegas_strip_club', 'Velvet Room', 'strip_club', 'las_vegas', 'las_vegas_strip',
    15000, 400, 550, 2, 5, 180, 'Champagne rooms. Cash heavy.', { requiredRank: 'dealer', requiredReputation: 35 }),
  b('biz_chi_tow', 'South Side Tow Yard', 'tow_yard', 'chicago', 'chicago_south_side',
    8000, 220, 400, 1, 4, 110, 'Impound fees add up.', { requiredRank: 'dealer' }),
  b('biz_miami_port_warehouse', 'Port Import Warehouse', 'import_warehouse', 'miami', 'miami_port',
    18000, 350, 900, 2, 5, 200, 'Containers in, product rerouted.', { requiredRank: 'plug', requiredReputation: 42 }),
  // Late
  b('biz_ny_downtown_casino', 'Private Casino Room', 'casino_room', 'new_york', 'new_york_downtown',
    28000, 550, 1200, 3, 6, 320, 'High rollers, higher heat.', { requiredRank: 'shot_caller', requiredReputation: 55 }),
  b('biz_la_port_shipping', 'Pacific Shipping Co', 'shipping_company', 'los_angeles', 'los_angeles_harbor',
    32000, 480, 1500, 2, 6, 350, 'Freight manifests with gaps.', { requiredRank: 'kingpin', requiredReputation: 65 }),
  b('biz_ny_downtown_realestate', 'Skyline Realty', 'real_estate_office', 'new_york', 'new_york_downtown',
    25000, 420, 1100, 3, 4, 280, 'Luxury listings. Legitimate cover.', { requiredRank: 'kingpin', requiredReputation: 60 }),
  b('biz_london_central_bar', 'Mayfair Lounge', 'bar', 'london', 'london_central',
    14000, 380, 700, 2, 4, 190, 'Old money front.', { requiredRank: 'plug', requiredReputation: 45 }),
];

export const BUSINESS_MAP = Object.fromEntries(
  BUSINESSES.map((biz) => [biz.id, biz])
) as Record<string, BusinessDefinition>;

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = Object.fromEntries(
  Object.values(BUSINESS_TYPE_TEMPLATES).map((t) => [t.type, t.label])
) as Record<BusinessType, string>;

export const BUSINESS_REPAIR_COST = Math.round(800 * BALANCE.upgradeCostScale);
