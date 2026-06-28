import { GameState, CommodityId, InventoryItem } from '../types/game';
import { SupplierDefinition, SupplierOffer, SupplierRelationship } from '../types/suppliers';
import { RankId } from '../types/progression';
import { SUPPLIERS, SUPPLIER_MAP } from '../data/suppliers';
import { COMMODITY_MAP } from '../data/commodities';
import { RANKS } from '../data/progression';
import { getPlayerAreaKey } from '../data/locations';
import { isCityUnlocked } from './progression';
import { withMessage } from './messages';
import { applyProgressionAfterAction } from './progression';
import { tryTriggerIntelReveal } from './intelSystem';
import { clamp, randomInt } from '../utils/random';
import { adjustLocalHeat } from './territory';
import { getSupplierScoutBonuses } from './crewBonuses';
import { trackMissionEvent } from './missionSystem';

const MAX_OFFERS = 6;
const TRUST_PER_PURCHASE = 5;
const TRUST_BONUS_DISCOUNT = 0.0012; // +0.12% per trust point
const HUSTLER_EXTRA_DISCOUNT = 0.04;

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

export function meetsSupplierUnlock(
  state: GameState,
  supplier: SupplierDefinition
): boolean {
  const req = supplier.unlockRequirements;
  if (!isCityUnlocked(state, supplier.cityId)) return false;

  if (req.minRank) {
    if (rankIndex(state.progression.rankId) < rankIndex(req.minRank)) return false;
  }
  if (req.minReputation != null && state.player.reputation < req.minReputation) {
    return false;
  }

  const rel = state.supplierRelationships?.[supplier.id];
  if (req.minTrust != null && (rel?.trust ?? 0) < req.minTrust) return false;

  return true;
}

export function getRelationship(
  state: GameState,
  supplierId: string
): SupplierRelationship {
  return (
    state.supplierRelationships?.[supplierId] ?? {
      supplierId,
      trust: 0,
      relationshipStatus: 'available',
      totalPurchases: 0,
      debtOwed: 0,
      lastOfferDay: 0,
      cooldownUntilDay: 0,
    }
  );
}

export function getSuppliersAtLocation(
  state: GameState,
  cityId: string,
  areaId: string
): SupplierDefinition[] {
  return SUPPLIERS.filter(
    (s) => s.cityId === cityId && s.areaId === areaId && meetsSupplierUnlock(state, s)
  );
}

export function getEffectiveDiscount(
  state: GameState,
  supplier: SupplierDefinition,
  relationship: SupplierRelationship
): number {
  let discount = supplier.priceDiscount + relationship.trust * TRUST_BONUS_DISCOUNT;
  if (rankIndex(state.progression.rankId) >= rankIndex('hustler')) {
    discount += HUSTLER_EXTRA_DISCOUNT;
  }
  discount += getSupplierScoutBonuses(state).discount;
  return clamp(discount, 0, 0.5);
}

export function getSupplierUnitPrice(
  state: GameState,
  supplier: SupplierDefinition,
  commodityId: CommodityId,
  marketPrice: number
): number {
  const rel = getRelationship(state, supplier.id);
  const discount = getEffectiveDiscount(state, supplier, rel);
  return Math.max(1, Math.round(marketPrice * (1 - discount)));
}

function getInventoryCount(inventory: InventoryItem[]): number {
  return inventory.reduce((sum, item) => sum + item.quantity, 0);
}

function applySupplierSideEffects(
  state: GameState,
  supplier: SupplierDefinition
): GameState {
  let updated = { ...state };

  if (supplier.type === 'cartel_supplier') {
    updated = {
      ...updated,
      cartelStanding: clamp((updated.cartelStanding ?? 0) + 3, -100, 100),
    };
  }

  if (supplier.type === 'airport_courier') {
    updated = {
      ...updated,
      player: {
        ...updated.player,
        heat: clamp(updated.player.heat + 4, 0, 100),
      },
      localHeatByCity: adjustLocalHeat(updated, updated.player.currentCityId, 3),
    };
  }

  return updated;
}

function rollDeliveredQuantity(requested: number, reliability: number): number {
  const roll = Math.random() * 100;
  if (roll <= reliability) return requested;
  if (roll <= reliability + 15) return Math.max(1, Math.floor(requested * 0.6));
  return 0; // scam / no show
}

export function buyFromSupplier(
  state: GameState,
  supplierId: string,
  commodityId: CommodityId,
  quantity: number
): GameState {
  if (quantity <= 0 || state.player.isGameOver) return state;

  const supplier = SUPPLIER_MAP[supplierId];
  if (!supplier) return withMessage(state, 'Unknown supplier.');

  const { player } = state;
  if (player.currentCityId !== supplier.cityId || player.currentAreaId !== supplier.areaId) {
    return withMessage(state, 'You need to meet this supplier in their area.');
  }

  if (!meetsSupplierUnlock(state, supplier)) {
    return withMessage(state, 'This supplier is not available yet.');
  }

  if (!supplier.specialtyDrugs.includes(commodityId)) {
    return withMessage(state, 'This supplier does not move that product.');
  }

  const commodity = COMMODITY_MAP[commodityId];
  const marketPrice = state.marketPrices[getPlayerAreaKey(player)]?.[commodityId];
  if (!commodity || !marketPrice) {
    return withMessage(state, 'Price unavailable for this deal.');
  }

  const unitPrice = getSupplierUnitPrice(state, supplier, commodityId, marketPrice);
  const totalCost = unitPrice * quantity;
  const rel = getRelationship(state, supplierId);

  const availableDebt = Math.max(0, supplier.debtAllowed - rel.debtOwed);
  if (player.cash + availableDebt < totalCost) {
    return withMessage(
      state,
      `Need $${totalCost}. Cash: $${player.cash}, credit left: $${availableDebt}.`
    );
  }

  const currentCount = getInventoryCount(player.inventory);
  if (currentCount + quantity > player.inventoryCapacity) {
    const space = player.inventoryCapacity - currentCount;
    return withMessage(state, `Storage full. Only ${space} slots available.`);
  }

  const delivered = rollDeliveredQuantity(
    quantity,
    clamp(supplier.reliability + getSupplierScoutBonuses(state).reliability * 20, 0, 100)
  );
  if (delivered === 0) {
    const lostCash = Math.min(player.cash, Math.round(totalCost * 0.5));
    const nextRel: SupplierRelationship = {
      ...rel,
      trust: clamp(rel.trust - 8, 0, 100),
      relationshipStatus: 'cooldown',
      cooldownUntilDay: player.day + 2,
    };
    return applyProgressionAfterAction(
      withMessage(
        {
          ...state,
          player: {
            ...player,
            cash: player.cash - lostCash,
            heat: clamp(player.heat + 3, 0, 100),
          },
          supplierRelationships: {
            ...state.supplierRelationships,
            [supplierId]: nextRel,
          },
        },
        `${supplier.name} burned you — no product. Lost $${lostCash}. Trust -8.`
      )
    );
  }

  const paidFromCash = Math.min(player.cash, totalCost);
  const newDebt = rel.debtOwed + Math.max(0, totalCost - paidFromCash);

  let inventory = [...player.inventory];
  const existing = inventory.find((i) => i.commodityId === commodityId);
  if (existing) {
    const totalQty = existing.quantity + delivered;
    inventory = inventory.map((i) =>
      i.commodityId === commodityId
        ? {
            ...i,
            quantity: totalQty,
            avgCost: Math.round(
              (i.avgCost * i.quantity + unitPrice * delivered) / totalQty
            ),
          }
        : i
    );
  } else {
    inventory.push({ commodityId, quantity: delivered, avgCost: unitPrice });
  }

  const heatGain = Math.max(1, Math.round(supplier.riskLevel * delivered * 0.5));
  const trustGain = delivered < quantity ? 1 : TRUST_PER_PURCHASE;

  const nextRel: SupplierRelationship = {
    ...rel,
    trust: clamp(rel.trust + trustGain, 0, 100),
    totalPurchases: rel.totalPurchases + 1,
    debtOwed: newDebt,
    relationshipStatus: 'active',
    lastOfferDay: player.day,
  };

  let updated: GameState = {
    ...state,
    player: {
      ...player,
      cash: player.cash - paidFromCash,
      heat: clamp(player.heat + heatGain, 0, 100),
      inventory,
    },
    supplierRelationships: {
      ...state.supplierRelationships,
      [supplierId]: nextRel,
    },
  };

  updated = applySupplierSideEffects(updated, supplier);

  const shortMsg =
    delivered < quantity
      ? ` Short shipment: got ${delivered}/${quantity}.`
      : '';

  updated = tryTriggerIntelReveal(updated, 'supplier');

  return applyProgressionAfterAction(
    trackMissionEvent(
      withMessage(
        updated,
        `Bought ${delivered} ${commodity.name} from ${supplier.name} @ $${unitPrice}/ea ($${totalCost}).${shortMsg} Trust +${trustGain}.`
      ),
      { kind: 'buy_supplier', amount: totalCost }
    )
  );
}

export function refreshSupplierOffers(state: GameState): GameState {
  const { player } = state;
  const suppliers = getSuppliersAtLocation(state, player.currentCityId, player.currentAreaId);
  if (suppliers.length === 0) return state;

  const existing = (state.supplierOffers ?? []).filter(
    (o) => o.expiresDay > player.day
  );

  if (existing.length >= MAX_OFFERS) {
    return { ...state, supplierOffers: existing };
  }

  const newOffers: SupplierOffer[] = [...existing];
  const areaKey = getPlayerAreaKey(player);
  const prices = state.marketPrices[areaKey] ?? {};

  for (const supplier of suppliers) {
    if (newOffers.length >= MAX_OFFERS) break;
    if (Math.random() > 0.35) continue;

    const rel = getRelationship(state, supplier.id);
    if (rel.cooldownUntilDay > player.day) continue;
    if (rel.lastOfferDay === player.day && rel.totalPurchases > 0) continue;

    const drug =
      supplier.specialtyDrugs[
        randomInt(0, supplier.specialtyDrugs.length - 1)
      ];
    if (!prices[drug]) continue;

    const qty = randomInt(4, 12 + supplier.qualityLevel * 2);
    const unitPrice = getSupplierUnitPrice(state, supplier, drug, prices[drug]!);

    newOffers.push({
      id: `offer_${player.day}_${supplier.id}_${drug}`,
      supplierId: supplier.id,
      commodityId: drug,
      quantity: qty,
      unitPrice,
      expiresDay: player.day + 2,
      message: `${supplier.name} has ${qty} ${COMMODITY_MAP[drug]?.name ?? drug} at $${unitPrice}/unit — special rate.`,
    });

    const nextRel = { ...rel, lastOfferDay: player.day, relationshipStatus: 'active' as const };
    state = {
      ...state,
      supplierRelationships: {
        ...state.supplierRelationships,
        [supplier.id]: nextRel,
      },
    };
  }

  return { ...state, supplierOffers: newOffers };
}

export function createDefaultSupplierState(): {
  supplierRelationships: Record<string, SupplierRelationship>;
  supplierOffers: SupplierOffer[];
} {
  return { supplierRelationships: {}, supplierOffers: [] };
}

export function migrateSupplierRelationships(raw: unknown): Record<string, SupplierRelationship> {
  const result: Record<string, SupplierRelationship> = {};
  if (typeof raw !== 'object' || raw === null) return result;

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const v = value as Record<string, unknown>;
    if (!SUPPLIER_MAP[id]) continue;
    result[id] = {
      supplierId: id,
      trust: clamp(typeof v.trust === 'number' ? v.trust : 0, 0, 100),
      relationshipStatus:
        v.relationshipStatus === 'locked' ||
        v.relationshipStatus === 'available' ||
        v.relationshipStatus === 'active' ||
        v.relationshipStatus === 'cooldown'
          ? v.relationshipStatus
          : 'available',
      totalPurchases: typeof v.totalPurchases === 'number' ? v.totalPurchases : 0,
      debtOwed: typeof v.debtOwed === 'number' ? Math.max(0, v.debtOwed) : 0,
      lastOfferDay: typeof v.lastOfferDay === 'number' ? v.lastOfferDay : 0,
      cooldownUntilDay: typeof v.cooldownUntilDay === 'number' ? v.cooldownUntilDay : 0,
    };
  }
  return result;
}

export function migrateSupplierOffers(raw: unknown): SupplierOffer[] {
  if (!Array.isArray(raw)) return [];
  const offers: SupplierOffer[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.supplierId !== 'string' || !SUPPLIER_MAP[e.supplierId]) continue;
    if (typeof e.commodityId !== 'string' || !COMMODITY_MAP[e.commodityId as CommodityId]) continue;
    offers.push({
      id: typeof e.id === 'string' ? e.id : `offer_migrated_${offers.length}`,
      supplierId: e.supplierId,
      commodityId: e.commodityId as CommodityId,
      quantity: typeof e.quantity === 'number' ? Math.max(1, e.quantity) : 1,
      unitPrice: typeof e.unitPrice === 'number' ? Math.max(1, e.unitPrice) : 1,
      expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 1,
      message: typeof e.message === 'string' ? e.message : 'Special offer.',
    });
  }
  return offers;
}
