import type { CommodityId } from './game';
import { RankId } from './progression';

export type SupplierType =
  | 'street_plug'
  | 'club_supplier'
  | 'cartel_supplier'
  | 'port_contact'
  | 'airport_courier'
  | 'international_broker';

export type RelationshipStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'cooldown';

export interface SupplierUnlockRequirements {
  minRank?: RankId;
  minReputation?: number;
  minTrust?: number;
}

export interface SupplierDefinition {
  id: string;
  name: string;
  type: SupplierType;
  cityId: string;
  areaId: string;
  specialtyDrugs: CommodityId[];
  /** Base discount off market price (0.15 = 15% off). */
  priceDiscount: number;
  /** 0–100 chance of delivering full order. */
  reliability: number;
  /** 1–5 product quality tier. */
  qualityLevel: number;
  /** Max debt player can owe this supplier. */
  debtAllowed: number;
  riskLevel: number;
  unlockRequirements: SupplierUnlockRequirements;
  description: string;
}

export interface SupplierRelationship {
  supplierId: string;
  trust: number;
  relationshipStatus: RelationshipStatus;
  totalPurchases: number;
  debtOwed: number;
  lastOfferDay: number;
  cooldownUntilDay: number;
}

export interface SupplierOffer {
  id: string;
  supplierId: string;
  commodityId: CommodityId;
  quantity: number;
  unitPrice: number;
  expiresDay: number;
  message: string;
}
