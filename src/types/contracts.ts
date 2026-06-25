import type { CommodityId } from './game';

export type BuyerType =
  | 'club_owner'
  | 'street_crew'
  | 'rich_client'
  | 'party_promoter'
  | 'cartel_middleman'
  | 'rival_buyer';

export type ContractStatus = 'pending' | 'active' | 'completed' | 'failed' | 'expired';

export interface BuyerContract {
  id: string;
  buyerName: string;
  buyerType: BuyerType;
  cityId: string;
  areaId: string;
  requestedDrug: CommodityId;
  requestedQuantity: number;
  deadlineDay: number;
  payout: number;
  reputationReward: number;
  heatRisk: number;
  status: ContractStatus;
  acceptedDay?: number;
  createdDay: number;
}
