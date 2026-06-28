import { GameState, InventoryItem } from '../types/game';
import {
  EncounterChoiceDef,
  EncounterDefinition,
  LegalStatus,
} from '../types/encounters';
import { EventOutcomeDelta } from '../types/events';
import { ENCOUNTER_MAP } from '../data/encounterCatalog';
import { EQUIPMENT_MAP } from '../data/equipment';
import { clamp, randomInt } from '../utils/random';
import { withMessage } from './messages';
import { checkGameOverState } from './engineHelpers';
import { normalizeGameState } from './stateUtils';
import { getCombinedHeatMultiplier, scalePositiveHeat } from './worldEvents';
import { getPlayerAreaKey } from '../data/locations';
import {
  computeCombatScores,
  consumeEquipmentUse,
  consumeWeaponUses,
  hasEquipment,
  resolveCombat,
} from './combat';
import { parseEncounterChoice } from './encounterSystem';
import { applyProgressionAfterAction } from './progression';
import { tryTriggerIntelReveal } from './intelSystem';

function getInventoryCount(inventory: InventoryItem[]): number {
  return inventory.reduce((sum, item) => sum + item.quantity, 0);
}

function escalateLegalStatus(current: LegalStatus, escalation: number): LegalStatus {
  const order: LegalStatus[] = [
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

function deescalateLegalStatus(current: LegalStatus, amount: number): LegalStatus {
  const order: LegalStatus[] = [
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

function destroyInventoryPct(inventory: InventoryItem[], pct: number): InventoryItem[] {
  if (pct <= 0 || inventory.length === 0) return inventory;
  return inventory
    .map((item) => ({
      ...item,
      quantity: Math.max(0, Math.floor(item.quantity * (1 - pct))),
    }))
    .filter((item) => item.quantity > 0);
}

function formatOutcomeMessage(
  base: string,
  delta: {
    cash?: number;
    health?: number;
    heat?: number;
    reputation?: number;
    legal?: string;
    combat?: string;
    suffix?: string;
    risk?: string;
  }
): string {
  const parts: string[] = [base];
  if (delta.combat) parts.push(delta.combat);
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
    parts.push(
      delta.reputation > 0 ? `Rep +${delta.reputation}` : `Rep ${delta.reputation}`
    );
  }
  if (delta.legal) parts.push(`Legal: ${delta.legal}`);
  if (delta.suffix) parts.push(delta.suffix);
  if (delta.risk) parts.push(`Risk: ${delta.risk}`);
  return parts.join(' · ');
}

function applyEncounterOutcome(
  state: GameState,
  encounter: EncounterDefinition,
  choice: EncounterChoiceDef,
  random: () => number = Math.random
): GameState {
  let base = normalizeGameState(state);
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
    const combat = resolveCombat(base, encounter.threatScore, fleeing, random);
    combatSummary = combat.summary;
    healthDelta += combat.healthDelta;
    cashDelta += combat.cashDelta;
    heatDelta += combat.heatDelta;

    if (combat.inventoryLossPct > 0) {
      player.inventory = destroyInventoryPct(player.inventory, combat.inventoryLossPct);
    }

    if (choice.actionType === 'fight' || choice.actionType === 'use_weapon') {
      equipment = consumeWeaponUses({ ...base, equipment });
    }

    if (!combat.won && choice.actionType === 'fight') {
      template.legalEscalation = (template.legalEscalation ?? 0) + 5;
    }
  }

  if (choice.actionType === 'use_lawyer' && choice.requiresEquipment) {
    if (hasEquipment(base, choice.requiresEquipment)) {
      equipment = consumeEquipmentUse(equipment, choice.requiresEquipment);
      template.legalDeescalation = (template.legalDeescalation ?? 0) + 10;
    }
  }

  if (choice.actionType === 'bribe' && hasEquipment(base, 'burner_phone')) {
    heatDelta -= 3;
  }

  if (template.destroyInventoryPct) {
    player.inventory = destroyInventoryPct(player.inventory, template.destroyInventoryPct);
  }

  if (template.destroyWeapons) {
    equipment = equipment.filter((e) => EQUIPMENT_MAP[e.equipmentId]?.type !== 'weapon');
  }

  if (template.cartelStanding) {
    cartelStanding = clamp(cartelStanding + template.cartelStanding, -100, 100);
    if (template.cartelStanding < -10) cartelBetrayals += 1;
  }

  player.cash = Math.max(0, player.cash + cashDelta);
  player.health = clamp(player.health + healthDelta, 0, 100);
  player.reputation = clamp(player.reputation + repDelta, 0, 100);
  if (template.debt) player.debt = Math.max(0, player.debt + template.debt);

  const areaKey = getPlayerAreaKey(player);
  const heatMult = getCombinedHeatMultiplier(base, areaKey);
  player.heat = clamp(
    player.heat + scalePositiveHeat(heatDelta, heatMult),
    0,
    100
  );

  if (template.legalEscalation) {
    player.legalStatus = escalateLegalStatus(player.legalStatus, template.legalEscalation);
    if (player.legalStatus === 'jailed') {
      player.daysInJail = Math.max(player.daysInJail, template.skipDays ?? 1);
    }
    if (player.legalStatus === 'federal_case') {
      player.federalCaseSeverity = clamp(
        player.federalCaseSeverity + (template.federalSeverity ?? template.legalEscalation),
        0,
        100
      );
    }
  }

  if (template.legalDeescalation) {
    player.legalStatus = deescalateLegalStatus(player.legalStatus, template.legalDeescalation);
    player.federalCaseSeverity = clamp(
      player.federalCaseSeverity - Math.floor(template.legalDeescalation / 2),
      0,
      100
    );
  }

  if (template.federalSeverity) {
    player.federalCaseSeverity = clamp(
      player.federalCaseSeverity + template.federalSeverity,
      0,
      100
    );
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
  const scores = computeCombatScores(base, encounter.threatScore);
  const riskNote =
    player.heat >= 70
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

  let next: GameState = {
    ...base,
    player,
    equipment,
    cartelStanding,
    cartelBetrayals,
    heatCooldowns,
    encounterHistory,
    pendingEvent: null,
  };

  next = checkGameOverState(next);
  next = withMessage(next, message);
  if (template.informantProtectionDays || encounter.id.includes('informant')) {
    next = tryTriggerIntelReveal(next, 'informant');
  }
  return applyProgressionAfterAction(next);
}

export function resolveEncounterChoice(
  state: GameState,
  choiceId: string,
  random: () => number = Math.random
): GameState {
  const parsed = parseEncounterChoice(choiceId);
  if (!parsed) {
    return state;
  }

  const encounter = ENCOUNTER_MAP[parsed.encounterId];
  if (!encounter) {
    return withMessage(state, 'Unknown encounter.');
  }

  const choice =
    encounter.choices.find((c) => c.id === parsed.choiceKey) ??
    encounter.choices[0];

  if (!choice) {
    return withMessage(state, 'No valid choice.');
  }

  return applyEncounterOutcome(state, encounter, choice, random);
}

export function applyEncounterDelta(state: GameState, delta: EventOutcomeDelta): GameState {
  return state;
}
