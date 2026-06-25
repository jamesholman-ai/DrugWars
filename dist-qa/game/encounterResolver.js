"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEncounterChoice = resolveEncounterChoice;
exports.applyEncounterDelta = applyEncounterDelta;
const encounterCatalog_1 = require("../data/encounterCatalog");
const equipment_1 = require("../data/equipment");
const random_1 = require("../utils/random");
const messages_1 = require("./messages");
const engineHelpers_1 = require("./engineHelpers");
const stateUtils_1 = require("./stateUtils");
const worldEvents_1 = require("./worldEvents");
const locations_1 = require("../data/locations");
const combat_1 = require("./combat");
const encounterSystem_1 = require("./encounterSystem");
const progression_1 = require("./progression");
function getInventoryCount(inventory) {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
}
function escalateLegalStatus(current, escalation) {
    const order = [
        'clean',
        'warning',
        'detained',
        'arrested',
        'jailed',
        'federal_case',
    ];
    const idx = order.indexOf(current);
    const steps = Math.ceil(escalation / 15);
    return order[Math.min(order.length - 1, idx + steps)];
}
function deescalateLegalStatus(current, amount) {
    const order = [
        'clean',
        'warning',
        'detained',
        'arrested',
        'jailed',
        'federal_case',
    ];
    const idx = order.indexOf(current);
    const steps = Math.ceil(amount / 15);
    return order[Math.max(0, idx - steps)];
}
function destroyInventoryPct(inventory, pct) {
    if (pct <= 0 || inventory.length === 0)
        return inventory;
    return inventory
        .map((item) => ({
        ...item,
        quantity: Math.max(0, Math.floor(item.quantity * (1 - pct))),
    }))
        .filter((item) => item.quantity > 0);
}
function formatOutcomeMessage(base, delta) {
    const parts = [base];
    if (delta.combat)
        parts.push(delta.combat);
    if (delta.cash != null && delta.cash !== 0) {
        parts.push(delta.cash > 0 ? `Cash +$${delta.cash}` : `Cash −$${Math.abs(delta.cash)}`);
    }
    if (delta.health != null && delta.health !== 0) {
        parts.push(delta.health > 0 ? `Health +${delta.health}` : `Health ${delta.health}`);
    }
    if (delta.heat != null && delta.heat !== 0) {
        parts.push(delta.heat > 0 ? `Heat +${delta.heat}` : `Heat ${delta.heat}`);
    }
    if (delta.reputation != null && delta.reputation !== 0) {
        parts.push(delta.reputation > 0 ? `Rep +${delta.reputation}` : `Rep ${delta.reputation}`);
    }
    if (delta.legal)
        parts.push(`Legal: ${delta.legal}`);
    if (delta.suffix)
        parts.push(delta.suffix);
    if (delta.risk)
        parts.push(`Risk: ${delta.risk}`);
    return parts.join(' · ');
}
function applyEncounterOutcome(state, encounter, choice, random = Math.random) {
    let base = (0, stateUtils_1.normalizeGameState)(state);
    let player = { ...base.player, inventory: base.player.inventory.map((i) => ({ ...i })) };
    let equipment = [...(base.equipment ?? [])];
    let cartelStanding = base.cartelStanding ?? 0;
    let cartelBetrayals = base.cartelBetrayals ?? 0;
    let heatCooldowns = { ...(base.heatCooldowns ?? { layLowUntilDay: 0, bribePoliceUntilDay: 0, informantProtectionUntilDay: 0, safehouseUsedUntilDay: 0 }) };
    const template = choice.outcome;
    let cashDelta = template.cash ?? 0;
    let healthDelta = template.health ?? 0;
    let heatDelta = template.heat ?? 0;
    let repDelta = template.reputation ?? 0;
    let combatSummary = '';
    if (choice.minCash && choice.actionType === 'pay') {
        cashDelta = -Math.min(choice.minCash, player.cash);
    }
    if (choice.usesCombat) {
        const fleeing = choice.actionType === 'run';
        const combat = (0, combat_1.resolveCombat)(base, encounter.threatScore, fleeing, random);
        combatSummary = combat.summary;
        healthDelta += combat.healthDelta;
        cashDelta += combat.cashDelta;
        heatDelta += combat.heatDelta;
        if (combat.inventoryLossPct > 0) {
            player.inventory = destroyInventoryPct(player.inventory, combat.inventoryLossPct);
        }
        if (choice.actionType === 'fight' || choice.actionType === 'use_weapon') {
            equipment = (0, combat_1.consumeWeaponUses)({ ...base, equipment });
        }
        if (!combat.won && choice.actionType === 'fight') {
            template.legalEscalation = (template.legalEscalation ?? 0) + 5;
        }
    }
    if (choice.actionType === 'use_lawyer' && choice.requiresEquipment) {
        if ((0, combat_1.hasEquipment)(base, choice.requiresEquipment)) {
            equipment = (0, combat_1.consumeEquipmentUse)(equipment, choice.requiresEquipment);
            template.legalDeescalation = (template.legalDeescalation ?? 0) + 10;
        }
    }
    if (choice.actionType === 'bribe' && (0, combat_1.hasEquipment)(base, 'burner_phone')) {
        heatDelta -= 3;
    }
    if (template.destroyInventoryPct) {
        player.inventory = destroyInventoryPct(player.inventory, template.destroyInventoryPct);
    }
    if (template.destroyWeapons) {
        equipment = equipment.filter((e) => equipment_1.EQUIPMENT_MAP[e.equipmentId]?.type !== 'weapon');
    }
    if (template.cartelStanding) {
        cartelStanding = (0, random_1.clamp)(cartelStanding + template.cartelStanding, -100, 100);
        if (template.cartelStanding < -10)
            cartelBetrayals += 1;
    }
    player.cash = Math.max(0, player.cash + cashDelta);
    player.health = (0, random_1.clamp)(player.health + healthDelta, 0, 100);
    player.reputation = (0, random_1.clamp)(player.reputation + repDelta, 0, 100);
    if (template.debt)
        player.debt = Math.max(0, player.debt + template.debt);
    const areaKey = (0, locations_1.getPlayerAreaKey)(player);
    const heatMult = (0, worldEvents_1.getCombinedHeatMultiplier)(base, areaKey);
    player.heat = (0, random_1.clamp)(player.heat + (0, worldEvents_1.scalePositiveHeat)(heatDelta, heatMult), 0, 100);
    if (template.legalEscalation) {
        player.legalStatus = escalateLegalStatus(player.legalStatus, template.legalEscalation);
        if (player.legalStatus === 'jailed') {
            player.daysInJail = Math.max(player.daysInJail, template.skipDays ?? 1);
        }
        if (player.legalStatus === 'federal_case') {
            player.federalCaseSeverity = (0, random_1.clamp)(player.federalCaseSeverity + (template.federalSeverity ?? template.legalEscalation), 0, 100);
        }
    }
    if (template.legalDeescalation) {
        player.legalStatus = deescalateLegalStatus(player.legalStatus, template.legalDeescalation);
        player.federalCaseSeverity = (0, random_1.clamp)(player.federalCaseSeverity - Math.floor(template.legalDeescalation / 2), 0, 100);
    }
    if (template.federalSeverity) {
        player.federalCaseSeverity = (0, random_1.clamp)(player.federalCaseSeverity + template.federalSeverity, 0, 100);
        if (player.federalCaseSeverity >= 30) {
            player.legalStatus = 'federal_case';
        }
    }
    if (template.skipDays && template.skipDays > 0) {
        player.day += template.skipDays;
        player.daysInJail = Math.max(player.daysInJail, template.skipDays);
    }
    if (template.informantProtectionDays) {
        heatCooldowns.informantProtectionUntilDay =
            player.day + template.informantProtectionDays;
    }
    if (encounter.id === 'debt_collector_execution' && choice.id === 'pay') {
        const payAll = Math.min(player.cash, player.debt);
        player.cash -= payAll;
        player.debt -= payAll;
        player.debtCollectorWarnings = 0;
    }
    if (encounter.faction === 'police' || encounter.faction === 'dea') {
        player.debtCollectorWarnings = 0;
    }
    const legalLabel = player.legalStatus.replace(/_/g, ' ');
    const scores = (0, combat_1.computeCombatScores)(base, encounter.threatScore);
    const riskNote = player.heat >= 70
        ? 'High heat — police likely'
        : player.federalCaseSeverity >= 50
            ? 'Federal case active'
            : `Threat ${encounter.threatScore} · ATK ${scores.attack} DEF ${scores.defense}`;
    const message = formatOutcomeMessage(encounter.title, {
        combat: combatSummary || undefined,
        cash: cashDelta !== 0 ? cashDelta : undefined,
        health: healthDelta !== 0 ? healthDelta : undefined,
        heat: heatDelta !== 0 ? heatDelta : undefined,
        reputation: repDelta !== 0 ? repDelta : undefined,
        legal: player.legalStatus !== 'clean' ? legalLabel : undefined,
        suffix: template.messageSuffix,
        risk: riskNote,
    });
    const encounterHistory = [
        ...(base.encounterHistory ?? []).slice(-19),
        { encounterId: encounter.id, day: player.day, outcome: choice.id },
    ];
    let next = {
        ...base,
        player,
        equipment,
        cartelStanding,
        cartelBetrayals,
        heatCooldowns,
        encounterHistory,
        pendingEvent: null,
    };
    next = (0, engineHelpers_1.checkGameOverState)(next);
    next = (0, messages_1.withMessage)(next, message);
    return (0, progression_1.applyProgressionAfterAction)(next);
}
function resolveEncounterChoice(state, choiceId, random = Math.random) {
    const parsed = (0, encounterSystem_1.parseEncounterChoice)(choiceId);
    if (!parsed) {
        return state;
    }
    const encounter = encounterCatalog_1.ENCOUNTER_MAP[parsed.encounterId];
    if (!encounter) {
        return (0, messages_1.withMessage)(state, 'Unknown encounter.');
    }
    const choice = encounter.choices.find((c) => c.id === parsed.choiceKey) ??
        encounter.choices[0];
    if (!choice) {
        return (0, messages_1.withMessage)(state, 'No valid choice.');
    }
    return applyEncounterOutcome(state, encounter, choice, random);
}
function applyEncounterDelta(state, delta) {
    return state;
}
