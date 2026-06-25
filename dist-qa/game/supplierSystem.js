"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meetsSupplierUnlock = meetsSupplierUnlock;
exports.getRelationship = getRelationship;
exports.getSuppliersAtLocation = getSuppliersAtLocation;
exports.getEffectiveDiscount = getEffectiveDiscount;
exports.getSupplierUnitPrice = getSupplierUnitPrice;
exports.buyFromSupplier = buyFromSupplier;
exports.refreshSupplierOffers = refreshSupplierOffers;
exports.createDefaultSupplierState = createDefaultSupplierState;
exports.migrateSupplierRelationships = migrateSupplierRelationships;
exports.migrateSupplierOffers = migrateSupplierOffers;
const suppliers_1 = require("../data/suppliers");
const commodities_1 = require("../data/commodities");
const progression_1 = require("../data/progression");
const locations_1 = require("../data/locations");
const progression_2 = require("./progression");
const messages_1 = require("./messages");
const progression_3 = require("./progression");
const random_1 = require("../utils/random");
const territory_1 = require("./territory");
const crewBonuses_1 = require("./crewBonuses");
const missionSystem_1 = require("./missionSystem");
const MAX_OFFERS = 6;
const TRUST_PER_PURCHASE = 5;
const TRUST_BONUS_DISCOUNT = 0.0012; // +0.12% per trust point
const HUSTLER_EXTRA_DISCOUNT = 0.04;
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function meetsSupplierUnlock(state, supplier) {
    const req = supplier.unlockRequirements;
    if (!(0, progression_2.isCityUnlocked)(state, supplier.cityId))
        return false;
    if (req.minRank) {
        if (rankIndex(state.progression.rankId) < rankIndex(req.minRank))
            return false;
    }
    if (req.minReputation != null && state.player.reputation < req.minReputation) {
        return false;
    }
    const rel = state.supplierRelationships?.[supplier.id];
    if (req.minTrust != null && (rel?.trust ?? 0) < req.minTrust)
        return false;
    return true;
}
function getRelationship(state, supplierId) {
    return (state.supplierRelationships?.[supplierId] ?? {
        supplierId,
        trust: 0,
        relationshipStatus: 'available',
        totalPurchases: 0,
        debtOwed: 0,
        lastOfferDay: 0,
        cooldownUntilDay: 0,
    });
}
function getSuppliersAtLocation(state, cityId, areaId) {
    return suppliers_1.SUPPLIERS.filter((s) => s.cityId === cityId && s.areaId === areaId && meetsSupplierUnlock(state, s));
}
function getEffectiveDiscount(state, supplier, relationship) {
    let discount = supplier.priceDiscount + relationship.trust * TRUST_BONUS_DISCOUNT;
    if (rankIndex(state.progression.rankId) >= rankIndex('hustler')) {
        discount += HUSTLER_EXTRA_DISCOUNT;
    }
    discount += (0, crewBonuses_1.getSupplierScoutBonuses)(state).discount;
    return (0, random_1.clamp)(discount, 0, 0.5);
}
function getSupplierUnitPrice(state, supplier, commodityId, marketPrice) {
    const rel = getRelationship(state, supplier.id);
    const discount = getEffectiveDiscount(state, supplier, rel);
    return Math.max(1, Math.round(marketPrice * (1 - discount)));
}
function getInventoryCount(inventory) {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
}
function applySupplierSideEffects(state, supplier) {
    let updated = { ...state };
    if (supplier.type === 'cartel_supplier') {
        updated = {
            ...updated,
            cartelStanding: (0, random_1.clamp)((updated.cartelStanding ?? 0) + 3, -100, 100),
        };
    }
    if (supplier.type === 'airport_courier') {
        updated = {
            ...updated,
            player: {
                ...updated.player,
                heat: (0, random_1.clamp)(updated.player.heat + 4, 0, 100),
            },
            localHeatByCity: (0, territory_1.adjustLocalHeat)(updated, updated.player.currentCityId, 3),
        };
    }
    return updated;
}
function rollDeliveredQuantity(requested, reliability) {
    const roll = Math.random() * 100;
    if (roll <= reliability)
        return requested;
    if (roll <= reliability + 15)
        return Math.max(1, Math.floor(requested * 0.6));
    return 0; // scam / no show
}
function buyFromSupplier(state, supplierId, commodityId, quantity) {
    if (quantity <= 0 || state.player.isGameOver)
        return state;
    const supplier = suppliers_1.SUPPLIER_MAP[supplierId];
    if (!supplier)
        return (0, messages_1.withMessage)(state, 'Unknown supplier.');
    const { player } = state;
    if (player.currentCityId !== supplier.cityId || player.currentAreaId !== supplier.areaId) {
        return (0, messages_1.withMessage)(state, 'You need to meet this supplier in their area.');
    }
    if (!meetsSupplierUnlock(state, supplier)) {
        return (0, messages_1.withMessage)(state, 'This supplier is not available yet.');
    }
    if (!supplier.specialtyDrugs.includes(commodityId)) {
        return (0, messages_1.withMessage)(state, 'This supplier does not move that product.');
    }
    const commodity = commodities_1.COMMODITY_MAP[commodityId];
    const marketPrice = state.marketPrices[(0, locations_1.getPlayerAreaKey)(player)]?.[commodityId];
    if (!commodity || !marketPrice) {
        return (0, messages_1.withMessage)(state, 'Price unavailable for this deal.');
    }
    const unitPrice = getSupplierUnitPrice(state, supplier, commodityId, marketPrice);
    const totalCost = unitPrice * quantity;
    const rel = getRelationship(state, supplierId);
    const availableDebt = Math.max(0, supplier.debtAllowed - rel.debtOwed);
    if (player.cash + availableDebt < totalCost) {
        return (0, messages_1.withMessage)(state, `Need $${totalCost}. Cash: $${player.cash}, credit left: $${availableDebt}.`);
    }
    const currentCount = getInventoryCount(player.inventory);
    if (currentCount + quantity > player.inventoryCapacity) {
        const space = player.inventoryCapacity - currentCount;
        return (0, messages_1.withMessage)(state, `Storage full. Only ${space} slots available.`);
    }
    const delivered = rollDeliveredQuantity(quantity, (0, random_1.clamp)(supplier.reliability + (0, crewBonuses_1.getSupplierScoutBonuses)(state).reliability * 20, 0, 100));
    if (delivered === 0) {
        const lostCash = Math.min(player.cash, Math.round(totalCost * 0.5));
        const nextRel = {
            ...rel,
            trust: (0, random_1.clamp)(rel.trust - 8, 0, 100),
            relationshipStatus: 'cooldown',
            cooldownUntilDay: player.day + 2,
        };
        return (0, progression_3.applyProgressionAfterAction)((0, messages_1.withMessage)({
            ...state,
            player: {
                ...player,
                cash: player.cash - lostCash,
                heat: (0, random_1.clamp)(player.heat + 3, 0, 100),
            },
            supplierRelationships: {
                ...state.supplierRelationships,
                [supplierId]: nextRel,
            },
        }, `${supplier.name} burned you — no product. Lost $${lostCash}. Trust -8.`));
    }
    const paidFromCash = Math.min(player.cash, totalCost);
    const newDebt = rel.debtOwed + Math.max(0, totalCost - paidFromCash);
    let inventory = [...player.inventory];
    const existing = inventory.find((i) => i.commodityId === commodityId);
    if (existing) {
        const totalQty = existing.quantity + delivered;
        inventory = inventory.map((i) => i.commodityId === commodityId
            ? {
                ...i,
                quantity: totalQty,
                avgCost: Math.round((i.avgCost * i.quantity + unitPrice * delivered) / totalQty),
            }
            : i);
    }
    else {
        inventory.push({ commodityId, quantity: delivered, avgCost: unitPrice });
    }
    const heatGain = Math.max(1, Math.round(supplier.riskLevel * delivered * 0.5));
    const trustGain = delivered < quantity ? 1 : TRUST_PER_PURCHASE;
    const nextRel = {
        ...rel,
        trust: (0, random_1.clamp)(rel.trust + trustGain, 0, 100),
        totalPurchases: rel.totalPurchases + 1,
        debtOwed: newDebt,
        relationshipStatus: 'active',
        lastOfferDay: player.day,
    };
    let updated = {
        ...state,
        player: {
            ...player,
            cash: player.cash - paidFromCash,
            heat: (0, random_1.clamp)(player.heat + heatGain, 0, 100),
            inventory,
        },
        supplierRelationships: {
            ...state.supplierRelationships,
            [supplierId]: nextRel,
        },
    };
    updated = applySupplierSideEffects(updated, supplier);
    const shortMsg = delivered < quantity
        ? ` Short shipment: got ${delivered}/${quantity}.`
        : '';
    return (0, progression_3.applyProgressionAfterAction)((0, missionSystem_1.trackMissionEvent)((0, messages_1.withMessage)(updated, `Bought ${delivered} ${commodity.name} from ${supplier.name} @ $${unitPrice}/ea ($${totalCost}).${shortMsg} Trust +${trustGain}.`), { kind: 'buy_supplier', amount: totalCost }));
}
function refreshSupplierOffers(state) {
    const { player } = state;
    const suppliers = getSuppliersAtLocation(state, player.currentCityId, player.currentAreaId);
    if (suppliers.length === 0)
        return state;
    const existing = (state.supplierOffers ?? []).filter((o) => o.expiresDay > player.day);
    if (existing.length >= MAX_OFFERS) {
        return { ...state, supplierOffers: existing };
    }
    const newOffers = [...existing];
    const areaKey = (0, locations_1.getPlayerAreaKey)(player);
    const prices = state.marketPrices[areaKey] ?? {};
    for (const supplier of suppliers) {
        if (newOffers.length >= MAX_OFFERS)
            break;
        if (Math.random() > 0.35)
            continue;
        const rel = getRelationship(state, supplier.id);
        if (rel.cooldownUntilDay > player.day)
            continue;
        if (rel.lastOfferDay === player.day && rel.totalPurchases > 0)
            continue;
        const drug = supplier.specialtyDrugs[(0, random_1.randomInt)(0, supplier.specialtyDrugs.length - 1)];
        if (!prices[drug])
            continue;
        const qty = (0, random_1.randomInt)(4, 12 + supplier.qualityLevel * 2);
        const unitPrice = getSupplierUnitPrice(state, supplier, drug, prices[drug]);
        newOffers.push({
            id: `offer_${player.day}_${supplier.id}_${drug}`,
            supplierId: supplier.id,
            commodityId: drug,
            quantity: qty,
            unitPrice,
            expiresDay: player.day + 2,
            message: `${supplier.name} has ${qty} ${commodities_1.COMMODITY_MAP[drug]?.name ?? drug} at $${unitPrice}/unit — special rate.`,
        });
        const nextRel = { ...rel, lastOfferDay: player.day, relationshipStatus: 'active' };
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
function createDefaultSupplierState() {
    return { supplierRelationships: {}, supplierOffers: [] };
}
function migrateSupplierRelationships(raw) {
    const result = {};
    if (typeof raw !== 'object' || raw === null)
        return result;
    for (const [id, value] of Object.entries(raw)) {
        if (typeof value !== 'object' || value === null)
            continue;
        const v = value;
        if (!suppliers_1.SUPPLIER_MAP[id])
            continue;
        result[id] = {
            supplierId: id,
            trust: (0, random_1.clamp)(typeof v.trust === 'number' ? v.trust : 0, 0, 100),
            relationshipStatus: v.relationshipStatus === 'locked' ||
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
function migrateSupplierOffers(raw) {
    if (!Array.isArray(raw))
        return [];
    const offers = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        if (typeof e.supplierId !== 'string' || !suppliers_1.SUPPLIER_MAP[e.supplierId])
            continue;
        if (typeof e.commodityId !== 'string' || !commodities_1.COMMODITY_MAP[e.commodityId])
            continue;
        offers.push({
            id: typeof e.id === 'string' ? e.id : `offer_migrated_${offers.length}`,
            supplierId: e.supplierId,
            commodityId: e.commodityId,
            quantity: typeof e.quantity === 'number' ? Math.max(1, e.quantity) : 1,
            unitPrice: typeof e.unitPrice === 'number' ? Math.max(1, e.unitPrice) : 1,
            expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 1,
            message: typeof e.message === 'string' ? e.message : 'Special offer.',
        });
    }
    return offers;
}
