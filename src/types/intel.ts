import { CommodityId } from './game';

export type IntelSource =
  | 'street'
  | 'informant'
  | 'supplier'
  | 'crew'
  | 'intel_pack'
  | 'mission'
  | 'world_event'
  | 'stay'
  | 'travel_area'
  | 'travel_city'
  | 'contract';

export type IntelKind =
  | 'price_spike'
  | 'price_crash'
  | 'supplier_discount'
  | 'buyer_contract'
  | 'police_warning'
  | 'rival_threat'
  | 'raid_warning'
  | 'safe_route'
  | 'market_buy'
  | 'market_sell';

export interface IntelEntry {
  id: string;
  kind: IntelKind;
  source: IntelSource;
  message: string;
  createdDay: number;
  expiresDay: number;
  revealed: boolean;
  discoveredDay?: number;
  commodityId?: CommodityId;
  cityId?: string;
  areaId?: string;
  direction?: 'buy' | 'sell';
}

export const INTEL_SOURCE_LABELS: Record<IntelSource, string> = {
  street: 'Street',
  informant: 'Informant',
  supplier: 'Supplier',
  crew: 'Crew',
  intel_pack: 'Intel Pack',
  mission: 'Mission',
  world_event: 'World Event',
  stay: 'Local Watch',
  travel_area: 'Area Recon',
  travel_city: 'City Network',
  contract: 'Contract',
};
