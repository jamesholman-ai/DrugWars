"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnedEquipmentList = getOwnedEquipmentList;
exports.countEquipment = countEquipment;
exports.hasEquipment = hasEquipment;
exports.computeAttackScore = computeAttackScore;
exports.computeDefenseScore = computeDefenseScore;
exports.computeCombatScores = computeCombatScores;
exports.resolveCombat = resolveCombat;
exports.consumeEquipmentUse = consumeEquipmentUse;
exports.consumeWeaponUses = consumeWeaponUses;
exports.getInventoryLoadFactor = getInventoryLoadFactor;
exports.getRobberyRiskMultiplier = getRobberyRiskMultiplier;
exports.getPoliceRiskMultiplier = getPoliceRiskMultiplier;
exports.getAirportRiskMultiplier = getAirportRiskMultiplier;
exports.getCartelRiskMultiplier = getCartelRiskMultiplier;
exports.getRivalRiskMultiplier = getRivalRiskMultiplier;
const territory_1 = require("./territory");
const crewBonuses_1 = require("./crewBonuses");
const safehouseSystem_1 = require("./safehouseSystem");
const equipment_1 = require("../data/equipment");
const random_1 = require("../utils/random");
function getOwnedEquipmentList(state) {
    return state.equipment ?? [];
}
function countEquipment(state, equipmentId) {
    return getOwnedEquipmentList(state).filter((e) => e.equipmentId === equipmentId).length;
}
function hasEquipment(state, equipmentId) {
    return countEquipment(state, equipmentId) > 0;
}
function computeAttackScore(state) {
    const { player } = state;
    let attack = 10 + Math.floor(player.reputation / 8);
    for (const owned of getOwnedEquipmentList(state)) {
        const def = equipment_1.EQUIPMENT_MAP[owned.equipmentId];
        if (def?.type === 'weapon') {
            attack += def.attackBonus;
        }
    }
    if (player.reputation >= 60)
        attack += 5;
    if (player.reputation >= 80)
        attack += 5;
    attack += Math.floor((0, crewBonuses_1.getEnforcerCombatBonus)(state) / 2);
    return attack;
}
function computeDefenseScore(state) {
    const { player } = state;
    let defense = 8 + Math.floor(player.reputation / 12);
    for (const owned of getOwnedEquipmentList(state)) {
        const def = equipment_1.EQUIPMENT_MAP[owned.equipmentId];
        if (def && (def.type === 'armor' || def.type === 'protection' || def.type === 'weapon')) {
            defense += def.defenseBonus;
        }
    }
    if (state.progression.ownedStashHouses.length > 0 ||
        (state.ownedSafehouses ?? []).length > 0) {
        defense += 3;
    }
    defense += (0, crewBonuses_1.getEnforcerCombatBonus)(state);
    return defense;
}
function computeCombatScores(state, threatScore) {
    const attack = computeAttackScore(state);
    const defense = computeDefenseScore(state);
    const threat = threatScore;
    const powerRatio = (attack + defense * 0.7) / Math.max(threat, 1);
    const winChance = (0, random_1.clamp)(0.15 + powerRatio * 0.35, 0.1, 0.92);
    return { attack, defense, threat, winChance };
}
function resolveCombat(state, threatScore, fleeing, random = Math.random) {
    const scores = computeCombatScores(state, threatScore);
    const roll = random();
    let winThreshold = scores.winChance;
    if (fleeing)
        winThreshold *= 0.75;
    const won = roll < winThreshold;
    let weaponHeat = 0;
    for (const owned of getOwnedEquipmentList(state)) {
        const def = equipment_1.EQUIPMENT_MAP[owned.equipmentId];
        if (def?.type === 'weapon') {
            weaponHeat += def.heatRisk;
        }
    }
    if (won) {
        const healthDelta = fleeing ? -3 : -8;
        return {
            won: true,
            healthDelta,
            cashDelta: fleeing ? 0 : Math.round(threatScore * 3),
            heatDelta: fleeing ? 6 : 10 + Math.floor(weaponHeat / 2),
            inventoryLossPct: 0,
            weaponHeat,
            summary: fleeing
                ? `Escaped (ATK ${scores.attack}/DEF ${scores.defense} vs threat ${scores.threat}). Took scratches.`
                : `Won the fight (ATK ${scores.attack}/DEF ${scores.defense} vs threat ${scores.threat}).`,
        };
    }
    const severity = threatScore / 100;
    return {
        won: false,
        healthDelta: -Math.round(12 + severity * 25),
        cashDelta: -Math.round(threatScore * 4),
        heatDelta: 8 + Math.floor(weaponHeat / 3),
        inventoryLossPct: fleeing ? 0.08 : 0.15,
        weaponHeat,
        summary: fleeing
            ? `Caught while fleeing (win chance ${Math.round(winThreshold * 100)}%).`
            : `Lost the fight (win chance ${Math.round(winThreshold * 100)}%).`,
    };
}
function consumeEquipmentUse(equipment, equipmentId) {
    const idx = equipment.findIndex((e) => e.equipmentId === equipmentId);
    if (idx < 0)
        return equipment;
    const def = equipment_1.EQUIPMENT_MAP[equipmentId];
    if (!def?.maxUses)
        return equipment;
    const item = equipment[idx];
    const uses = (item.usesRemaining ?? def.maxUses) - 1;
    if (uses <= 0) {
        return equipment.filter((_, i) => i !== idx);
    }
    return equipment.map((e, i) => i === idx ? { ...e, usesRemaining: uses } : e);
}
function consumeWeaponUses(state) {
    let equipment = [...getOwnedEquipmentList(state)];
    for (const owned of getOwnedEquipmentList(state)) {
        const def = equipment_1.EQUIPMENT_MAP[owned.equipmentId];
        if (def?.type === 'weapon' && def.maxUses) {
            equipment = consumeEquipmentUse(equipment, owned.equipmentId);
            break;
        }
    }
    return equipment;
}
function getInventoryLoadFactor(state) {
    const used = state.player.inventory.reduce((s, i) => s + i.quantity, 0);
    const cap = Math.max(1, state.player.inventoryCapacity);
    return used / cap;
}
function getRobberyRiskMultiplier(state) {
    const load = getInventoryLoadFactor(state);
    let mult = 1 + load * 0.8;
    if (hasEquipment(state, 'safehouse_pass'))
        mult *= 0.75;
    mult *= Math.max(0.5, 1 - (0, safehouseSystem_1.getSafehouseRobberyProtection)(state));
    return mult;
}
function getPoliceRiskMultiplier(state) {
    const { player } = state;
    const effectiveHeat = (0, territory_1.getEffectivePoliceHeat)(state, player.currentCityId);
    let mult = 1 + effectiveHeat / 80;
    mult += getInventoryLoadFactor(state) * 0.5;
    if (player.legalStatus === 'warning')
        mult *= 1.2;
    if (player.legalStatus === 'detained')
        mult *= 1.4;
    if (player.legalStatus === 'arrested')
        mult *= 1.6;
    if (player.legalStatus === 'jailed')
        mult *= 1.8;
    if (player.legalStatus === 'federal_case')
        mult *= 2.0;
    if (state.heatCooldowns?.informantProtectionUntilDay > player.day) {
        mult *= 0.6;
    }
    mult *= Math.max(0.6, 1 - (0, crewBonuses_1.getLookoutPoliceReduction)(state));
    mult *= (0, safehouseSystem_1.getSafehousePoliceModifier)(state);
    return mult;
}
function getAirportRiskMultiplier(state) {
    let mult = getPoliceRiskMultiplier(state) * 1.3;
    if (hasEquipment(state, 'fake_id'))
        mult *= 0.7;
    mult *= Math.max(0.55, 1 - (0, crewBonuses_1.getSmugglerTravelReduction)(state));
    return mult;
}
function getCartelRiskMultiplier(state) {
    const { player } = state;
    let mult = 1 + player.reputation / 100;
    mult += getInventoryLoadFactor(state) * 0.6;
    if (player.debt > 10000)
        mult *= 1.2;
    if ((state.cartelBetrayals ?? 0) > 0) {
        mult *= 1 + (state.cartelBetrayals ?? 0) * 0.15;
    }
    if ((state.cartelStanding ?? 0) < -20)
        mult *= 1.3;
    return mult;
}
function getRivalRiskMultiplier(state) {
    return 1 + state.player.reputation / 90 + getInventoryLoadFactor(state) * 0.3;
}
