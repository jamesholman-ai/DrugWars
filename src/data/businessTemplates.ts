import { BusinessType } from '../types/businesses';
import { RankId } from '../types/progression';
import { DistrictArchetype } from './districtFlavor';

export type BusinessTier = 1 | 2 | 3 | 4 | 5;

export interface BusinessTypeTemplate {
  type: BusinessType;
  label: string;
  tier: BusinessTier;
  baseCost: number;
  baseIncome: number;
  baseLaunder: number;
  baseHeatReduction: number;
  baseRisk: number;
  baseUpkeep: number;
  archetypes: DistrictArchetype[];
  namePrefixes: string[];
  nameSuffixes: string[];
  descriptions: string[];
}

const PREFIXES = ['Metro', 'City', 'Golden', 'Silver', 'Blue', 'Red Door', 'Corner', 'Prime', 'Union', 'Harbor', 'River', 'Park', 'East', 'West', 'North', 'South'];
const SUFFIXES = ['LLC', 'Group', 'Holdings', 'Partners', 'Co.', 'Enterprises', '& Sons', 'International'];

function tpl(
  type: BusinessType,
  label: string,
  tier: BusinessTier,
  cost: number,
  income: number,
  launder: number,
  heat: number,
  risk: number,
  upkeep: number,
  archetypes: DistrictArchetype[],
  descriptions: string[]
): BusinessTypeTemplate {
  return {
    type,
    label,
    tier,
    baseCost: cost,
    baseIncome: income,
    baseLaunder: launder,
    baseHeatReduction: heat,
    baseRisk: risk,
    baseUpkeep: upkeep,
    archetypes,
    namePrefixes: PREFIXES,
    nameSuffixes: SUFFIXES,
    descriptions,
  };
}

export const BUSINESS_TYPE_TEMPLATES: Record<BusinessType, BusinessTypeTemplate> = {
  pawn_shop: tpl('pawn_shop', 'Pawn Shop', 1, 3200, 110, 180, 1, 2, 40, ['downtown', 'general'], ['Buy low, ask fewer questions.']),
  laundromat: tpl('laundromat', 'Laundromat', 1, 4000, 85, 420, 2, 2, 48, ['suburbs', 'general'], ['Spin cycles and spin books.']),
  bar: tpl('bar', 'Bar', 1, 4800, 130, 220, 1, 3, 55, ['downtown', 'club_district', 'college', 'general'], ['Corner pours and back-room deals.']),
  car_wash: tpl('car_wash', 'Car Wash', 1, 3600, 95, 160, 1, 2, 44, ['suburbs', 'industrial'], ['Soap, wax, and washed bills.']),
  corner_store: tpl('corner_store', 'Corner Store', 1, 2800, 75, 120, 0, 2, 35, ['college', 'general'], ['Candy up front, cash in back.']),
  bodega: tpl('bodega', 'Bodega', 1, 3000, 80, 140, 0, 2, 38, ['downtown', 'college'], ['Late-night register, early-morning drops.']),
  vape_shop: tpl('vape_shop', 'Vape Shop', 1, 3400, 90, 100, 0, 2, 42, ['college', 'suburbs'], ['Clouds out front, quiet ledger in back.']),
  smoke_shop: tpl('smoke_shop', 'Smoke Shop', 1, 3200, 85, 110, 0, 2, 40, ['college', 'general'], ['Glass cases and glass books.']),
  barber_shop: tpl('barber_shop', 'Barber Shop', 1, 2600, 70, 90, 1, 1, 32, ['suburbs', 'general'], ['Fresh fades, fresher covers.']),
  check_cashing_store: tpl('check_cashing_store', 'Check Cashing Store', 1, 4500, 100, 350, 1, 3, 52, ['downtown', 'industrial'], ['Fees add up. So does the wash.']),
  food_truck_lot: tpl('food_truck_lot', 'Food Truck Lot', 2, 5500, 120, 180, 0, 2, 58, ['college', 'industrial'], ['Permits by day, pallets by night.']),
  restaurant: tpl('restaurant', 'Restaurant', 2, 7200, 160, 280, 1, 3, 72, ['suburbs', 'downtown'], ['Kitchen closes late. Ledger stays open.']),
  used_car_lot: tpl('used_car_lot', 'Used Car Lot', 2, 9000, 240, 480, 1, 3, 115, ['industrial', 'suburbs'], ['Titles clean enough.']),
  auto_repair_shop: tpl('auto_repair_shop', 'Auto Repair Shop', 2, 7800, 200, 320, 1, 3, 95, ['industrial', 'suburbs'], ['Oil changes and off-book invoices.']),
  tow_yard: tpl('tow_yard', 'Tow Yard', 2, 8200, 210, 380, 1, 4, 105, ['industrial', 'general'], ['Impound fees add up.']),
  gym: tpl('gym', 'Gym', 2, 6800, 150, 200, 1, 2, 68, ['suburbs', 'downtown'], ['Memberships and monthly washes.']),
  clothing_store: tpl('clothing_store', 'Clothing Store', 2, 6200, 140, 190, 1, 2, 62, ['downtown', 'club_district'], ['Tags on racks, cash in bags.']),
  electronics_shop: tpl('electronics_shop', 'Electronics Shop', 2, 7400, 155, 210, 1, 3, 70, ['downtown', 'college'], ['Warranty cards and warranty stories.']),
  tattoo_parlor: tpl('tattoo_parlor', 'Tattoo Parlor', 2, 5100, 125, 150, 1, 3, 55, ['club_district', 'college'], ['Ink by appointment, cash by habit.']),
  nightclub: tpl('nightclub', 'Nightclub', 3, 11500, 300, 580, 2, 4, 135, ['club_district', 'downtown'], ['VIP rooms and velvet ropes.']),
  strip_club: tpl('strip_club', 'Strip Club', 3, 14000, 380, 520, 2, 5, 170, ['club_district'], ['Champagne rooms. Cash heavy.']),
  luxury_lounge: tpl('luxury_lounge', 'Luxury Lounge', 3, 13000, 360, 540, 2, 4, 160, ['downtown', 'club_district'], ['Bottle service and quiet books.']),
  event_venue: tpl('event_venue', 'Event Venue', 3, 10500, 280, 450, 2, 3, 125, ['club_district', 'downtown'], ['Rent the hall, rent the cover.']),
  recording_studio: tpl('recording_studio', 'Recording Studio', 3, 9800, 260, 400, 1, 3, 118, ['club_district', 'college'], ['Sessions till dawn. Deposits off-book.']),
  motel: tpl('motel', 'Motel', 3, 8800, 230, 420, 1, 3, 100, ['suburbs', 'airport'], ['Hourly rates, daily deposits.']),
  apartment_building: tpl('apartment_building', 'Apartment Building', 3, 16000, 340, 650, 2, 3, 155, ['downtown', 'college'], ['Rent rolls and quiet units.']),
  warehouse: tpl('warehouse', 'Warehouse', 3, 12000, 260, 720, 1, 4, 130, ['industrial', 'harbor'], ['Pallets in, product rerouted.']),
  storage_facility: tpl('storage_facility', 'Storage Facility', 3, 9500, 220, 500, 1, 3, 105, ['suburbs', 'industrial'], ['Lockers for rent, lockers for stash.']),
  shipping_office: tpl('shipping_office', 'Shipping Office', 3, 11000, 270, 680, 1, 4, 128, ['harbor', 'airport'], ['Labels and manifests with gaps.']),
  shipping_company: tpl('shipping_company', 'Shipping Company', 4, 28000, 460, 1400, 2, 6, 330, ['harbor'], ['Freight manifests with gaps.']),
  import_warehouse: tpl('import_warehouse', 'Import Warehouse', 4, 17500, 330, 880, 2, 5, 195, ['harbor'], ['Containers in, product rerouted.']),
  port_office: tpl('port_office', 'Port Office', 4, 15000, 310, 820, 2, 5, 180, ['harbor'], ['Dock fees and dockside deals.']),
  marina_dock: tpl('marina_dock', 'Marina Dock', 4, 13500, 290, 760, 1, 4, 165, ['harbor'], ['Slip fees and slip shipments.']),
  freight_broker: tpl('freight_broker', 'Freight Broker', 4, 14200, 300, 800, 1, 4, 172, ['harbor', 'industrial'], ['Routes brokered, routes blurred.']),
  logistics_company: tpl('logistics_company', 'Logistics Company', 4, 15500, 320, 850, 1, 4, 185, ['industrial', 'airport'], ['Fleet on paper, fleet off-book.']),
  trucking_company: tpl('trucking_company', 'Trucking Company', 4, 14800, 305, 780, 1, 5, 178, ['industrial'], ['Long haul, long ledger.']),
  courier_service: tpl('courier_service', 'Courier Service', 3, 8200, 210, 380, 1, 3, 98, ['airport', 'downtown'], ['Same-day delivery, same-day deposits.']),
  car_rental_office: tpl('car_rental_office', 'Car Rental Office', 3, 9200, 225, 360, 1, 3, 102, ['airport'], ['Keys out front, keys off-book.']),
  parking_garage: tpl('parking_garage', 'Parking Garage', 3, 10200, 245, 420, 1, 2, 112, ['airport', 'downtown'], ['Hourly parking, hourly washing.']),
  private_parking_lot: tpl('private_parking_lot', 'Private Parking Lot', 2, 5800, 130, 250, 0, 2, 56, ['downtown', 'club_district'], ['Spots by the hour. Cash by the stack.']),
  taxi_company: tpl('taxi_company', 'Taxi Company', 3, 8600, 215, 340, 1, 3, 92, ['airport', 'downtown'], ['Meters run. So do the books.']),
  security_company: tpl('security_company', 'Security Company', 3, 11200, 275, 480, 2, 3, 122, ['downtown', 'industrial'], ['Guards on payroll, heat off the street.']),
  real_estate_office: tpl('real_estate_office', 'Real Estate Office', 4, 24000, 400, 1050, 3, 4, 270, ['downtown'], ['Luxury listings. Legitimate cover.']),
  private_club: tpl('private_club', 'Private Club', 4, 22000, 420, 980, 3, 4, 250, ['downtown'], ['Members only. Money always welcome.']),
  casino_room: tpl('casino_room', 'Casino Room', 5, 27000, 520, 1150, 3, 6, 310, ['club_district', 'downtown'], ['High rollers, higher heat.']),
  jewelry_store: tpl('jewelry_store', 'Jewelry Store', 4, 18500, 350, 720, 2, 4, 200, ['downtown'], ['Showcases glitter. Ledgers whisper.']),
  art_gallery: tpl('art_gallery', 'Art Gallery', 4, 17000, 330, 680, 2, 3, 188, ['downtown', 'club_district'], ['Appraisals flexible. Invoices cleaner.']),
  night_market_stall: tpl('night_market_stall', 'Night Market Stall', 2, 4200, 105, 160, 0, 3, 46, ['college', 'harbor'], ['Closes at dawn. Counts at noon.']),
  cleaning_company: tpl('cleaning_company', 'Cleaning Company', 2, 5400, 115, 280, 1, 2, 54, ['suburbs', 'downtown'], ['Crews mop floors and mop trails.']),
  construction_company: tpl('construction_company', 'Construction Company', 4, 16500, 340, 620, 1, 5, 195, ['industrial'], ['Contracts on paper, cash on site.']),
  bail_bonds_office: tpl('bail_bonds_office', 'Bail Bonds Office', 3, 9800, 250, 520, 1, 4, 115, ['downtown', 'general'], ['Bonds posted, bonds washed.']),
};

export const ALL_BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_TEMPLATES) as BusinessType[];

export const TIER_MIN_RANK: Record<BusinessTier, RankId> = {
  1: 'wannabe',
  2: 'runner',
  3: 'dealer',
  4: 'plug',
  5: 'kingpin',
};

export const TIER_MIN_REPUTATION: Record<BusinessTier, number> = {
  1: 0,
  2: 10,
  3: 32,
  4: 48,
  5: 62,
};

/** Weight business types for a district archetype. */
export function getBusinessTypeWeights(archetype: DistrictArchetype): Partial<Record<BusinessType, number>> {
  const weights: Partial<Record<BusinessType, number>> = {};
  for (const template of Object.values(BUSINESS_TYPE_TEMPLATES)) {
    if (template.archetypes.includes(archetype) || template.archetypes.includes('general')) {
      weights[template.type] = (weights[template.type] ?? 0) + (template.archetypes.includes(archetype) ? 3 : 1);
    }
  }
  return weights;
}

export const DISTRICT_BUSINESS_POOL_SIZE = 50;
export const DISTRICT_BUSINESS_VISIBLE_MIN = 10;
export const DISTRICT_BUSINESS_VISIBLE_MAX = 15;

export const DISTRICT_CREW_POOL_SIZE = 100;
export const DISTRICT_CREW_VISIBLE = 25;
