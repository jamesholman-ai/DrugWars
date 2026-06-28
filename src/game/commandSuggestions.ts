import { GameState, RootStackParamList } from '../types/game';
import { MISSION_MAP } from '../data/missions';
import { isTutorialActive } from './tutorialSystem';
import { getCurrentStoryMission, getMissionProgressWidgetText } from './missionSystem';
import { formatMoney } from '../utils/format';

export interface NextActionSuggestion {
  title: string;
  message: string;
  cta: string;
  route: keyof RootStackParamList;
}

/** Presentation-only heuristic — suggests one next action for the Command screen. */
export function getNextActionSuggestion(state: GameState): NextActionSuggestion {
  const { player } = state;

  if (isTutorialActive(state)) {
    return {
      title: 'Continue Tutorial',
      message: 'Follow the guided steps to learn the streets.',
      cta: 'Continue',
      route: 'Game',
    };
  }

  const storyMission = getCurrentStoryMission(state);
  if (storyMission) {
    const def = MISSION_MAP[storyMission.id];
    if (def) {
      return {
        title: `Story: ${def.title}`,
        message: getMissionProgressWidgetText(state, storyMission) || def.description,
        cta: 'View Mission',
        route: 'Missions',
      };
    }
  }

  const debtUrgent =
    player.debt > 0 &&
    (player.debt > player.cash * 0.85 ||
      (player.debtCollectorWarnings ?? 0) > 0 ||
      (player.day <= 4 && player.debt >= 500));

  if (debtUrgent) {
    return {
      title: 'Pay Down Debt',
      message: `You owe ${formatMoney(player.debt)}. Interest compounds when you advance the day.`,
      cta: 'Open Finance',
      route: 'Finance',
    };
  }

  const contracts = state.activeContracts ?? [];
  for (const contract of contracts) {
    const atSite =
      player.currentCityId === contract.cityId && player.currentAreaId === contract.areaId;
    const held =
      player.inventory.find((i) => i.commodityId === contract.requestedDrug)?.quantity ?? 0;
    if (atSite && held >= contract.requestedQuantity) {
      return {
        title: 'Deliver Contract',
        message: `${contract.buyerName} is ready for ${contract.requestedQuantity} units.`,
        cta: 'Go to Contracts',
        route: 'Contracts',
      };
    }
  }

  if (player.heat >= 70) {
    return {
      title: 'Lower Your Heat',
      message: 'Police activity is elevated. Lay low, use fronts, or change districts.',
      cta: 'View Empire',
      route: 'EmpireDashboard',
    };
  }

  const totalHeld = player.inventory.reduce((sum, row) => sum + row.quantity, 0);
  if (totalHeld > 0) {
    return {
      title: 'Sell Your Stash',
      message: `You're holding ${totalHeld} unit${totalHeld === 1 ? '' : 's'}. Check prices at the market.`,
      cta: 'Open Market',
      route: 'Market',
    };
  }

  if (contracts.length > 0) {
    return {
      title: 'Active Contract',
      message: `${contracts.length} deal${contracts.length === 1 ? '' : 's'} in progress. Travel to the drop site.`,
      cta: 'View Operations',
      route: 'OperationsDashboard',
    };
  }

  const supplierCount = (state.supplierOffers ?? []).length;
  if (supplierCount > 0) {
    return {
      title: 'Supplier Available',
      message: `${supplierCount} connect${supplierCount === 1 ? '' : 's'} with stock nearby.`,
      cta: 'View Suppliers',
      route: 'Suppliers',
    };
  }

  return {
    title: 'Hit the Market',
    message: 'Buy low, sell high. Start your next move on the street.',
    cta: 'Open Market',
    route: 'Market',
  };
}
