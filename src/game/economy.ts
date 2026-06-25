import { MarketPrices, PlayerState } from '../types/game';
import { getPlayerAreaKey } from '../data/locations';

export function getNetWorth(player: PlayerState, marketPrices: MarketPrices): number {
  const areaKey = getPlayerAreaKey(player);
  const locationPrices = marketPrices[areaKey] ?? {};
  const inventoryValue = player.inventory.reduce((sum, item) => {
    const price = locationPrices[item.commodityId] ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return player.cash + inventoryValue - player.debt;
}

export function getInventoryUsed(player: PlayerState): number {
  return player.inventory.reduce((sum, item) => sum + item.quantity, 0);
}
