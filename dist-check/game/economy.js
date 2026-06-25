"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetWorth = getNetWorth;
exports.getInventoryUsed = getInventoryUsed;
function getNetWorth(player, marketPrices) {
    const locationPrices = marketPrices[player.currentLocation] ?? {};
    const inventoryValue = player.inventory.reduce((sum, item) => {
        const price = locationPrices[item.commodityId] ?? 0;
        return sum + price * item.quantity;
    }, 0);
    return player.cash + inventoryValue - player.debt;
}
function getInventoryUsed(player) {
    return player.inventory.reduce((sum, item) => sum + item.quantity, 0);
}
