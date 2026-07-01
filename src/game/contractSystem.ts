import { GameState, CommodityId, InventoryItem } from '../types/game';
import { BuyerContract, BuyerType, ContractStatus } from '../types/contracts';
import { RankId } from '../types/progression';
import { BALANCE } from '../data/balanceConfig';
import { getMaxActiveContracts } from '../data/rankBenefits';
import {
  BUYER_NAMES,
  BUYER_TYPE_LABELS,
  CONTRACT_DRUGS_BY_BUYER,
  MAX_CONTRACT_HISTORY,
  MAX_CONTRACT_OFFERS,
} from '../data/contracts';
import { COMMODITY_MAP } from '../data/commodities';
import { RANKS } from '../data/progression';
import { getAreasForCity } from '../data/locations';
import { isCityUnlocked } from './progression';
import { withMessage, withMessages } from './messages';
import { applyProgressionAfterAction, addLifetimeProfit } from './progression';
import { tryTriggerIntelReveal } from './intelSystem';
import { getDealerContractBonus } from './crewBonuses';
import { addDirtyMoney } from './money';
import { trackMissionEvent } from './missionSystem';
import { clamp, randomInt, pickRandom } from '../utils/random';

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function getInventoryQty(inventory: InventoryItem[], drug: CommodityId): number {
  return inventory.find((i) => i.commodityId === drug)?.quantity ?? 0;
}

function trimHistory(contracts: BuyerContract[]): BuyerContract[] {
  return contracts.slice(-MAX_CONTRACT_HISTORY);
}

function buyerTypesForRank(rankId: RankId): BuyerType[] {
  const idx = rankIndex(rankId);
  const types: BuyerType[] = ['street_crew', 'party_promoter'];
  if (idx >= rankIndex('runner')) types.push('club_owner');
  if (idx >= rankIndex('hustler')) types.push('rich_client');
  if (idx >= rankIndex('dealer')) types.push('rival_buyer');
  if (idx >= rankIndex('plug')) types.push('cartel_middleman');
  return types;
}

function generateContractOffer(state: GameState): BuyerContract | null {
  const { player, progression } = state;
  const types = buyerTypesForRank(progression.rankId);
  if (types.length === 0) return null;

  const buyerType = pickRandom(types);
  const cityPool = progression.unlockedCities.filter((id) => isCityUnlocked(state, id));
  if (cityPool.length === 0) return null;

  const cityId = pickRandom(cityPool);
  const areas = getAreasForCity(cityId);
  if (areas.length === 0) return null;

  const area = pickRandom(areas);
  const drugPool = CONTRACT_DRUGS_BY_BUYER[buyerType] as CommodityId[];
  const requestedDrug = pickRandom(drugPool.filter((d) => COMMODITY_MAP[d]));
  if (!requestedDrug) return null;

  const repFactor = 1 + player.reputation / 100;
  const rankFactor = 1 + rankIndex(progression.rankId) * 0.12;
  const qty = randomInt(3, 8 + Math.floor(rankIndex(progression.rankId) * 2));
  const basePrice =
    (state.marketPrices[`${cityId}:${area.id}`]?.[requestedDrug] ?? 100) * qty;
  const payout = Math.round(
    basePrice * (1.26 + Math.random() * 0.28) * repFactor * BALANCE.contractPayoutScale
  );
  const deadlineDay = player.day + randomInt(2, 5 + Math.floor(rankIndex(progression.rankId)));
  const reputationReward = Math.min(12, 2 + Math.floor(payout / 800));
  const heatRisk = Math.min(15, 3 + Math.floor(payout / 1500) + Math.floor(qty / 4));

  const names = BUYER_NAMES[buyerType];
  const buyerName = names[randomInt(0, names.length - 1)];

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

export function generateContractOffers(state: GameState): GameState {
  const offers = [...(state.contractOffers ?? [])].filter(
    (c) => c.status === 'pending' && c.deadlineDay > state.player.day
  );

  if (offers.length >= MAX_CONTRACT_OFFERS) {
    return { ...state, contractOffers: offers };
  }

  const rollChance = 0.45 + rankIndex(state.progression.rankId) * 0.05;
  if (Math.random() > rollChance) {
    return { ...state, contractOffers: offers };
  }

  const newOffer = generateContractOffer(state);
  if (!newOffer) return { ...state, contractOffers: offers };

  if (offers.some((o) => o.requestedDrug === newOffer.requestedDrug && o.cityId === newOffer.cityId)) {
    return { ...state, contractOffers: offers };
  }

  return { ...state, contractOffers: [...offers, newOffer] };
}

export function acceptContract(state: GameState, contractId: string): GameState {
  const offer = (state.contractOffers ?? []).find((c) => c.id === contractId);
  if (!offer) return withMessage(state, 'Contract not found.');

  const maxActive = getMaxActiveContracts(state);
  if ((state.activeContracts ?? []).length >= maxActive) {
    return withMessage(state, `Max ${maxActive} active contracts. Complete one first.`);
  }

  const active: BuyerContract = {
    ...offer,
    status: 'active',
    acceptedDay: state.player.day,
  };

  return applyProgressionAfterAction(
    withMessage(
      {
        ...state,
        contractOffers: (state.contractOffers ?? []).filter((c) => c.id !== contractId),
        activeContracts: [...(state.activeContracts ?? []), active],
      },
      `Accepted contract: deliver ${active.requestedQuantity} ${COMMODITY_MAP[active.requestedDrug]?.name ?? active.requestedDrug} to ${active.buyerName} by day ${active.deadlineDay}. Payout $${active.payout}.`
    )
  );
}

export function fulfillContract(state: GameState, contractId: string): GameState {
  const contract = (state.activeContracts ?? []).find((c) => c.id === contractId);
  if (!contract) return withMessage(state, 'Active contract not found.');

  const { player } = state;
  if (player.currentCityId !== contract.cityId || player.currentAreaId !== contract.areaId) {
    return withMessage(state, 'You must be at the delivery location to complete this contract.');
  }

  if (player.day > contract.deadlineDay) {
    return withMessage(state, 'This contract is past deadline.');
  }

  const held = getInventoryQty(player.inventory, contract.requestedDrug);
  if (held < contract.requestedQuantity) {
    return withMessage(
      state,
      `Need ${contract.requestedQuantity} ${COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug}. You have ${held}.`
    );
  }

  let remaining = contract.requestedQuantity;
  const inventory = player.inventory
    .map((item) => {
      if (item.commodityId !== contract.requestedDrug) return item;
      const take = Math.min(item.quantity, remaining);
      remaining -= take;
      return { ...item, quantity: item.quantity - take };
    })
    .filter((item) => item.quantity > 0);

  const payoutBonus = 1 + getDealerContractBonus(state);
  const finalPayout = Math.round(contract.payout * payoutBonus);
  const completed: BuyerContract = { ...contract, status: 'completed' };
  const heatGain = contract.heatRisk;

  let updated: GameState = {
    ...state,
    player: addDirtyMoney(
      {
        ...player,
        reputation: clamp(player.reputation + contract.reputationReward, 0, 100),
        heat: clamp(player.heat + heatGain, 0, 100),
        inventory,
      },
      finalPayout
    ),
    activeContracts: (state.activeContracts ?? []).filter((c) => c.id !== contractId),
    completedContracts: trimHistory([
      ...(state.completedContracts ?? []),
      completed,
    ]),
  };

  updated = addLifetimeProfit(updated, finalPayout);

  const bonusNote = finalPayout > contract.payout ? ` (Dealer crew +$${finalPayout - contract.payout})` : '';

  updated = tryTriggerIntelReveal(updated, 'contract');

  return applyProgressionAfterAction(
    trackMissionEvent(
      withMessage(
        updated,
        `Contract complete! ${contract.buyerName} paid $${finalPayout}${bonusNote}. Rep +${contract.reputationReward}. Heat +${heatGain}.`
      ),
      { kind: 'fulfill_contract', payout: finalPayout }
    )
  );
}

export function tickContractsOnDayAdvance(state: GameState): GameState {
  const { player } = state;
  const messages: string[] = [];
  let active = [...(state.activeContracts ?? [])];
  let failed = [...(state.failedContracts ?? [])];
  let updatedPlayer = { ...player };

  for (const contract of active) {
    if (player.day > contract.deadlineDay) {
      const expired: BuyerContract = { ...contract, status: 'expired' };
      failed = trimHistory([...failed, expired]);
      updatedPlayer = {
        ...updatedPlayer,
        reputation: clamp(updatedPlayer.reputation - Math.ceil(contract.reputationReward / 2), 0, 100),
        heat: clamp(updatedPlayer.heat + Math.ceil(contract.heatRisk / 2), 0, 100),
      };
      messages.push(
        `Contract expired: ${contract.buyerName} wanted ${contract.requestedQuantity} ${COMMODITY_MAP[contract.requestedDrug]?.name ?? contract.requestedDrug}. Rep lost.`
      );
    }
  }

  active = active.filter((c) => player.day <= c.deadlineDay);

  const contractOffers = (state.contractOffers ?? []).filter(
    (c) => c.status === 'pending' && c.deadlineDay > player.day
  );

  let updated: GameState = {
    ...state,
    player: updatedPlayer,
    activeContracts: active,
    failedContracts: failed,
    contractOffers,
  };

  updated = generateContractOffers(updated);

  if (messages.length > 0) {
    updated = withMessages(updated, messages);
  }

  return updated;
}

export function getContractsAtLocation(
  state: GameState,
  cityId: string,
  areaId: string
): BuyerContract[] {
  return (state.contractOffers ?? []).filter(
    (c) => c.cityId === cityId && c.areaId === areaId && c.status === 'pending'
  );
}

export function createDefaultContractState(): {
  contractOffers: BuyerContract[];
  activeContracts: BuyerContract[];
  completedContracts: BuyerContract[];
  failedContracts: BuyerContract[];
} {
  return {
    contractOffers: [],
    activeContracts: [],
    completedContracts: [],
    failedContracts: [],
  };
}

export function migrateContracts(raw: unknown, field: 'offers' | 'active' | 'completed' | 'failed'): BuyerContract[] {
  if (!Array.isArray(raw)) return [];
  const validStatus: ContractStatus[] = ['pending', 'active', 'completed', 'failed', 'expired'];
  const defaultStatus: ContractStatus =
    field === 'offers' ? 'pending' : field === 'active' ? 'active' : field === 'completed' ? 'completed' : 'failed';

  const result: BuyerContract[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.requestedDrug !== 'string' || !COMMODITY_MAP[e.requestedDrug as CommodityId]) continue;
    if (typeof e.cityId !== 'string' || typeof e.areaId !== 'string') continue;

    const buyerType = (
      typeof e.buyerType === 'string' && e.buyerType in BUYER_TYPE_LABELS
        ? e.buyerType
        : 'street_crew'
    ) as BuyerType;

    result.push({
      id: typeof e.id === 'string' ? e.id : `contract_migrated_${result.length}`,
      buyerName: typeof e.buyerName === 'string' ? e.buyerName : 'Unknown Buyer',
      buyerType,
      cityId: e.cityId,
      areaId: e.areaId,
      requestedDrug: e.requestedDrug as CommodityId,
      requestedQuantity: typeof e.requestedQuantity === 'number' ? Math.max(1, e.requestedQuantity) : 1,
      deadlineDay: typeof e.deadlineDay === 'number' ? e.deadlineDay : 1,
      payout: typeof e.payout === 'number' ? Math.max(0, e.payout) : 0,
      reputationReward: typeof e.reputationReward === 'number' ? e.reputationReward : 1,
      heatRisk: typeof e.heatRisk === 'number' ? e.heatRisk : 3,
      status:
        typeof e.status === 'string' && validStatus.includes(e.status as ContractStatus)
          ? (e.status as ContractStatus)
          : defaultStatus,
      acceptedDay: typeof e.acceptedDay === 'number' ? e.acceptedDay : undefined,
      createdDay: typeof e.createdDay === 'number' ? e.createdDay : 1,
    });
  }
  return result;
}

export function formatBuyerType(type: BuyerType): string {
  return BUYER_TYPE_LABELS[type];
}

export function daysUntilDeadline(state: GameState, contract: BuyerContract): number {
  return Math.max(0, contract.deadlineDay - state.player.day);
}
