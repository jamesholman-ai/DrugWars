"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMoney = formatMoney;
exports.formatStat = formatStat;
function formatMoney(amount) {
    return `$${amount.toLocaleString('en-US')}`;
}
function formatStat(value, max = 100) {
    return `${value}/${max}`;
}
