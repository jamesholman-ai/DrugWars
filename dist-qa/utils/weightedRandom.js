"use strict";
/** Weighted random selection utilities — inject `random` for deterministic tests. */
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightedPick = weightedPick;
exports.adjustWeight = adjustWeight;
function weightedPick(items, random = Math.random) {
    const valid = items.filter((i) => i.weight > 0);
    if (valid.length === 0)
        return null;
    const total = valid.reduce((sum, i) => sum + i.weight, 0);
    let roll = random() * total;
    for (const entry of valid) {
        roll -= entry.weight;
        if (roll <= 0)
            return entry.item;
    }
    return valid[valid.length - 1].item;
}
function adjustWeight(base, factor) {
    return Math.max(0, Math.round(base * factor));
}
