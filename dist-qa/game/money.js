"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMoneyFields = normalizeMoneyFields;
exports.addDirtyMoney = addDirtyMoney;
exports.addCleanMoney = addCleanMoney;
exports.launderMoney = launderMoney;
exports.seizeDirtyMoney = seizeDirtyMoney;
exports.spendMoney = spendMoney;
exports.getTotalCash = getTotalCash;
/** Ensures dirty/clean tracking exists and matches total cash. */
function normalizeMoneyFields(player) {
    const cash = Math.max(0, player.cash);
    let dirty = player.dirtyCash ?? 0;
    let clean = player.cleanCash ?? 0;
    if (dirty + clean === 0 && cash > 0) {
        dirty = cash;
        clean = 0;
    }
    if (dirty + clean > cash) {
        const ratio = cash / (dirty + clean);
        dirty = Math.floor(dirty * ratio);
        clean = Math.max(0, cash - dirty);
    }
    else if (dirty + clean < cash) {
        dirty += cash - (dirty + clean);
    }
    return {
        ...player,
        cash,
        dirtyCash: Math.max(0, dirty),
        cleanCash: Math.max(0, clean),
    };
}
function addDirtyMoney(player, amount) {
    if (amount <= 0)
        return player;
    const p = normalizeMoneyFields(player);
    return normalizeMoneyFields({
        ...p,
        cash: p.cash + amount,
        dirtyCash: (p.dirtyCash ?? 0) + amount,
    });
}
function addCleanMoney(player, amount) {
    if (amount <= 0)
        return player;
    const p = normalizeMoneyFields(player);
    return normalizeMoneyFields({
        ...p,
        cash: p.cash + amount,
        cleanCash: (p.cleanCash ?? 0) + amount,
    });
}
function launderMoney(player, amount) {
    const p = normalizeMoneyFields(player);
    const move = Math.min(amount, p.dirtyCash ?? 0);
    if (move <= 0)
        return p;
    return normalizeMoneyFields({
        ...p,
        dirtyCash: (p.dirtyCash ?? 0) - move,
        cleanCash: (p.cleanCash ?? 0) + move,
    });
}
function seizeDirtyMoney(player, amount) {
    const p = normalizeMoneyFields(player);
    const seized = Math.min(amount, p.dirtyCash ?? 0, p.cash);
    return normalizeMoneyFields({
        ...p,
        cash: p.cash - seized,
        dirtyCash: (p.dirtyCash ?? 0) - seized,
    });
}
/** Spend money preferring clean cash when preferClean is true. Returns null if insufficient. */
function spendMoney(player, amount, preferClean = true) {
    if (amount <= 0)
        return player;
    const p = normalizeMoneyFields(player);
    if (p.cash < amount)
        return null;
    let remaining = amount;
    let clean = p.cleanCash ?? 0;
    let dirty = p.dirtyCash ?? 0;
    if (preferClean) {
        const fromClean = Math.min(remaining, clean);
        clean -= fromClean;
        remaining -= fromClean;
    }
    if (remaining > 0) {
        const fromDirty = Math.min(remaining, dirty);
        dirty -= fromDirty;
        remaining -= fromDirty;
    }
    if (remaining > 0)
        return null;
    return normalizeMoneyFields({
        ...p,
        cash: p.cash - amount,
        cleanCash: clean,
        dirtyCash: dirty,
    });
}
function getTotalCash(state) {
    return normalizeMoneyFields(state.player).cash;
}
