"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContractOffers = generateContractOffers;
exports.acceptContract = acceptContract;
exports.fulfillContract = fulfillContract;
exports.tickContractsOnDayAdvance = tickContractsOnDayAdvance;
exports.getContractsAtLocation = getContractsAtLocation;
exports.createDefaultContractState = createDefaultContractState;
exports.migrateContracts = migrateContracts;
exports.formatBuyerType = formatBuyerType;
exports.daysUntilDeadline = daysUntilDeadline;
const contracts_1 = require("../data/contracts");
const commodities_1 = require("../data/commodities");
const progression_1 = require("../data/progression");
const locations_1 = require("../data/locations");
const progression_2 = require("./progression");
const messages_1 = require("./messages");
const progression_3 = require("./progression");
const crewBonuses_1 = require("./crewBonuses");
const money_1 = require("./money");
const missionSystem_1 = require("./missionSystem");
const random_1 = require("../utils/random");
function rankIndex(rankId) {
    return progression_1.RANKS.findIndex((r) => r.id === rankId);
}
function getInventoryQty(inventory, drug) {
    return inventory.find((i) => i.commodityId === drug)?.quantity ?? 0;
}
function trimHistory(contracts) {
    return contracts.slice(-contracts_1.MAX_CONTRACT_HISTORY);
}
function buyerTypesForRank(rankId) {
    const idx = rankIndex(rankId);
    const types = ['street_crew', 'party_promoter'];
    if (idx >= rankIndex('runner'))
        types.push('club_owner');
    if (idx >= rankIndex('hustler'))
        types.push('rich_client');
    if (idx >= rankIndex('dealer'))
        types.push('rival_buyer');
    if (idx >= rankIndex('plug'))
        types.push('cartel_middleman');
    return types;
}
function generateContractOffer(state) {
    const { player, progression } = state;
    const types = buyerTypesForRank(progression.rankId);
    if (types.length === 0)
        return null;
    const buyerType = (0, random_1.pickRandom)(types);
    const cityPool = progression.unlockedCities.filter((id) => (0, progression_2.isCityUnlocked)(state, id));
    if (cityPool.length === 0)
        return null;
    const cityId = (0, random_1.pickRandom)(cityPool);
    const areas = (0, locations_1.getAreasForCity)(cityId);
    if (areas.length === 0)
        return null;
    const area = (0, random_1.pickRandom)(areas);
    const drugPool = contracts_1.CONTRACT_DRUGS_BY_BUYER[buyerType];
    const requestedDrug = (0, random_1.pickRandom)(drugPool.filter((d) => commodities_1.COMMODITY_MAP[d]));
    if (!requestedDrug)
        return null;
    const repFactor = 1 + player.reputation / 100;
    const rankFactor = 1 + rankIndex(progression.rankId) * 0.12;
    const qty = (0, random_1.randomInt)(3, 8 + Math.floor(rankIndex(progression.rankId) * 2));
    const basePrice = (state.marketPrices[`${cityId}:${area.id}`]?.[requestedDrug] ?? 100) * qty;
    const payout = Math.round(basePrice * (1.38 + Math.random() * 0.42) * repFactor);
    const deadlineDay = player.day + (0, random_1.randomInt)(2, 5 + Math.floor(rankIndex(progression.rankId)));
    const reputationReward = Math.min(12, 2 + Math.floor(payout / 800));
    const heatRisk = Math.min(15, 3 + Math.floor(payout / 1500) + Math.floor(qty / 4));
    const names = contracts_1.BUYER_NAMES[buyerType];
    const buyerName = names[(0, random_1.randomInt)(0, names.length - 1)];
    return {
        id: `contract_${player.day}_${cityId}_${area.id}_${requestedDrug}_${Math.random().toString(36).slice(2, 7)}`,
        buyerName,
        buyerType,
        cityId,
        areaId: area.id,
        requestedDrug,
        requestedQuantity: qty,
        deadlineDay,
        payout,
        reputationReward,
        heatRisk,
        status: 'pending',
        createdDay: player.day,
    };
}
function generateContractOffers(state) {
    const offers = [...(state.contractOffers ?? [])].filter((c) => c.status === 'pending' && c.deadlineDay > state.player.day);
    if (offers.length >= contracts_1.MAX_CONTRACT_OFFERS) {
        return { ...state, contractOffers: offers };
    }
    const rollChance = 0.45 + rankIndex(state.progression.rankId) * 0.05;
    if (Math.random() > rollChance) {
        return { ...state, contractOffers: offers };
    }
    const newOffer = generateContractOffer(state);
    if (!newOffer)
        return { ...state, contractOffers: offers };
    if (offers.some((o) => o.requestedDrug === newOffer.requestedDrug && o.cityId === newOffer.cityId)) {
        return { ...state, contractOffers: offers };
    }
    return { ...state, contractOffers: [...offers, newOffer] };
}
function acceptContract(state, contractId) {
    const offer = (state.contractOffers ?? []).find((c) => c.id === contractId);
    if (!offer)
        return (0, messages_1.withMessage)(state, 'Contract not found.');
    if ((state.activeContracts ?? []).length >= contracts_1.MAX_ACTIVE_CONTRACTS) {
        return (0, messages_1.withMessage)(state, `Max ${contracts_1.MAX_ACTIVE_CONTRACTS} active contracts. Complete one first.`);
    }
    const active = {
        ...offer,
        status: 'active',
        acceptedDay: state.player.day,
    };
    return (0, progression_3.applyProgressionAfterAction)((0, messages_1.withMessage)({
        ...state,
        contractOffers: (state.contractOffers ?? []).filter((c) => c.id !== contractId),
        activeContracts: [...(state.activeContracts ?? []), active],
    }, `Accepted contract: deliver ${active.requestedQuantity} ${commodities_1.COMMODITY_MAP[active.requestedDrug]?.name ?? active.requestedDrug} to ${active.buyerName} by day ${active.deadlineDay}. Payout $${active.payout}.`));
}
function fulfillContract(state, contractId) {
    const contract = (state.activeContracts ?? []).find((c) => c.id === contractId);
    if (!contract)
        return (0, messages_1.withMessage)(state, 'Active contract not found.');
    const { player } = state;
    if (player.currentCityId !== contract.cityId || player.currentAreaId !== contract.areaId) {
        return (0, messages_1.withMessage)(state, 'You must be at the delivery location to complete this contract.');
    }
    if (player.day > contract.deadlineDay) {
        return (0, messages_1.withMessage)(state, 'This contract is past deadline.');
    }
    const held = getInventoryQty(player.inventory, contract.requestedDrug);
    if (held < contract.requestedQuantity) {
        return (0, messages_1.withMessage)(state, `Need ${contract.requestedQuantity} ${commodities_1.COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug}. You have ${held}.`);
    }
    let remaining = contract.requestedQuantity;
    const inventory = player.inventory
        .map((item) => {
        if (item.commodityId !== contract.requestedDrug)
            return item;
        const take = Math.min(item.quantity, remaining);
        remaining -= take;
        return { ...item, quantity: item.quantity - take };
    })
        .filter((item) => item.quantity > 0);
    const payoutBonus = 1 + (0, crewBonuses_1.getDealerContractBonus)(state);
    const finalPayout = Math.round(contract.payout * payoutBonus);
    const completed = { ...contract, status: 'completed' };
    const heatGain = contract.heatRisk;
    let updated = {
        ...state,
        player: (0, money_1.addDirtyMoney)({
            ...player,
            reputation: (0, random_1.clamp)(player.reputation + contract.reputationReward, 0, 100),
            heat: (0, random_1.clamp)(player.heat + heatGain, 0, 100),
            inventory,
        }, finalPayout),
        activeContracts: (state.activeContracts ?? []).filter((c) => c.id !== contractId),
        completedContracts: trimHistory([
            ...(state.completedContracts ?? []),
            completed,
        ]),
    };
    updated = (0, progression_3.addLifetimeProfit)(updated, finalPayout);
    const bonusNote = finalPayout > contract.payout ? ` (Dealer crew +$${finalPayout - contract.payout})` : '';
    return (0, progression_3.applyProgressionAfterAction)((0, missionSystem_1.trackMissionEvent)((0, messages_1.withMessage)(updated, `Contract complete! ${contract.buyerName} paid $${finalPayout}${bonusNote}. Rep +${contract.reputationReward}. Heat +${heatGain}.`), { kind: 'fulfill_contract', payout: finalPayout }));
}
function tickContractsOnDayAdvance(state) {
    const { player } = state;
    const messages = [];
    let active = [...(state.activeContracts ?? [])];
    let failed = [...(state.failedContracts ?? [])];
    let updatedPlayer = { ...player };
    for (const contract of active) {
        if (player.day > contract.deadlineDay) {
            const expired = { ...contract, status: 'expired' };
            failed = trimHistory([...failed, expired]);
            updatedPlayer = {
                ...updatedPlayer,
                reputation: (0, random_1.clamp)(updatedPlayer.reputation - Math.ceil(contract.reputationReward / 2), 0, 100),
                heat: (0, random_1.clamp)(updatedPlayer.heat + Math.ceil(contract.heatRisk / 2), 0, 100),
            };
            messages.push(`Contract expired: ${contract.buyerName} wanted ${contract.requestedQuantity} ${commodities_1.COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug}. Rep lost.`);
        }
    }
    active = active.filter((c) => player.day <= c.deadlineDay);
    const contractOffers = (state.contractOffers ?? []).filter((c) => c.status === 'pending' && c.deadlineDay > player.day);
    let updated = {
        ...state,
        player: updatedPlayer,
        activeContracts: active,
        failedContracts: failed,
        contractOffers,
    };
    updated = generateContractOffers(updated);
    if (messages.length > 0) {
        updated = (0, messages_1.withMessages)(updated, messages);
    }
    return updated;
}
function getContractsAtLocation(state, cityId, areaId) {
    return (state.contractOffers ?? []).filter((c) => c.cityId === cityId && c.areaId === areaId && c.status === 'pending');
}
function createDefaultContractState() {
    return {
        contractOffers: [],
        activeContracts: [],
        completedContracts: [],
        failedContracts: [],
    };
}
function migrateContracts(raw, field) {
    if (!Array.isArray(raw))
        return [];
    const validStatus = ['pending', 'active', 'completed', 'failed', 'expired'];
    const defaultStatus = field === 'offers' ? 'pending' : field === 'active' ? 'active' : field === 'completed' ? 'completed' : 'failed';
    const result = [];
    for (const entry of raw) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const e = entry;
        if (typeof e.requestedDrug !== 'string' || !commodities_1.COMMODITY_MAP[e.requestedDrug])
            continue;
        if (typeof e.cityId !== 'string' || typeof e.areaId !== 'string')
            continue;
        const buyerType = (typeof e.buyerType === 'string' && e.buyerType in contracts_1.BUYER_TYPE_LABELS
            ? e.buyerType
            : 'street_crew');
        result.push({
            id: typeof e.id === 'string' ? e.id : `contract_migrated_${result.length}`,
            buyerName: typeof e.buyerName === 'string' ? e.buyerName : 'Unknown Buyer',
            buyerType,
            cityId: e.cityId,
            areaId: e.areaId,
            requestedDrug: e.requestedDrug,
            requestedQuantity: typeof e.requestedQuantity === 'number' ? Math.max(1, e.requestedQuantity) : 1,
            deadlineDay: typeof e.deadlineDay === 'number' ? e.deadlineDay : 1,
            payout: typeof e.payout === 'number' ? Math.max(0, e.payout) : 0,
            reputationReward: typeof e.reputationReward === 'number' ? e.reputationReward : 1,
            heatRisk: typeof e.heatRisk === 'number' ? e.heatRisk : 3,
            status: typeof e.status === 'string' && validStatus.includes(e.status)
                ? e.status
                : defaultStatus,
            acceptedDay: typeof e.acceptedDay === 'number' ? e.acceptedDay : undefined,
            createdDay: typeof e.createdDay === 'number' ? e.createdDay : 1,
        });
    }
    return result;
}
function formatBuyerType(type) {
    return contracts_1.BUYER_TYPE_LABELS[type];
}
function daysUntilDeadline(state, contract) {
    return Math.max(0, contract.deadlineDay - state.player.day);
}
