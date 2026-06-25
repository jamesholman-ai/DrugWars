"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetWorth = getNetWorth;
exports.getInventoryUsed = getInventoryUsed;
const locations_1 = require("../data/locations");
function getNetWorth(player, marketPrices) {
    const areaKey = (0, locations_1.getPlayerAreaKey)(player);
    const locationPrices = marketPrices[areaKey] ?? {};
    const inventoryValue = player.inventory.reduce((sum, item) => {
        const price = locationPrices[item.commodityId] ?? 0;
        return sum + price * item.quantity;
    }, 0);
    return player.cash + inventoryValue - player.debt;
}
function getInventoryUsed(player) {
    return player.inventory.reduce((sum, item) => sum + item.quantity, 0);
}
