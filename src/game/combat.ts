import { GameState } from '../types/game';
import { getEffectivePoliceHeat } from './territory';
import {
  getEnforcerCombatBonus,
  getLookoutPoliceReduction,
  getSmugglerTravelReduction,
} from './crewBonuses';
import {
  getSafehousePoliceModifier,
  getSafehouseRobberyProtection,
} from './safehouseSystem';
import { OwnedEquipment } from '../types/equipment';
import { EQUIPMENT_MAP } from '../data/equipment';
import { clamp } from '../utils/random';

export interface CombatScores {
  attack: number;
  defense: number;
  threat: number;
  winChance: number;
}

export function getOwnedEquipmentList(state: GameState): OwnedEquipment[] {
  return state.equipment ?? [];
}

export function countEquipment(state: GameState, equipmentId: string): number {
  return getOwnedEquipmentList(state).filter((e) => e.equipmentId === equipmentId).length;
}

export function hasEquipment(state: GameState, equipmentId: string): boolean {
  return countEquipment(state, equipmentId) > 0;
}

export function computeAttackScore(state: GameState): number {
  const { player } = state;
  let attack = 10 + Math.floor(player.reputation / 8);

  for (const owned of getOwnedEquipmentList(state)) {
    const def = EQUIPMENT_MAP[owned.equipmentId];
    if (def?.type === 'weapon') {
      attack += def.attackBonus;
    }
  }

  if (player.reputation >= 60) attack += 5;
  if (player.reputation >= 80) attack += 5;

  attack += Math.floor(getEnforcerCombatBonus(state) / 2);

  return attack;
}

export function computeDefenseScore(state: GameState): number {
  const { player } = state;
  let defense = 8 + Math.floor(player.reputation / 12);

  for (const owned of getOwnedEquipmentList(state)) {
    const def = EQUIPMENT_MAP[owned.equipmentId];
    if (def && (def.type === 'armor' || def.type === 'protection' || def.type === 'weapon')) {
      defense += def.defenseBonus;
    }
  }

  if (
    state.progression.ownedStashHouses.length > 0 ||
    (state.ownedSafehouses ?? []).length > 0
  ) {
    defense += 3;
  }
  defense += getEnforcerCombatBonus(state);

  return defense;
}

export function computeCombatScores(state: GameState, threatScore: number): CombatScores {
  const attack = computeAttackScore(state);
  const defense = computeDefenseScore(state);
  const threat = threatScore;

  const powerRatio = (attack + defense * 0.7) / Math.max(threat, 1);
  const winChance = clamp(0.15 + powerRatio * 0.35, 0.1, 0.92);

  return { attack, defense, threat, winChance };
}

export interface CombatResult {
  won: boolean;
  healthDelta: number;
  cashDelta: number;
  heatDelta: number;
  inventoryLossPct: number;
  weaponHeat: number;
  summary: string;
}

export function resolveCombat(
  state: GameState,
  threatScore: number,
  fleeing: boolean,
  random: () => number = Math.random
): CombatResult {
  const scores = computeCombatScores(state, threatScore);
  const roll = random();

  let winThreshold = scores.winChance;
  if (fleeing) winThreshold *= 0.75;

  const won = roll < winThreshold;

  let weaponHeat = 0;
  for (const owned of getOwnedEquipmentList(state)) {
    const def = EQUIPMENT_MAP[owned.equipmentId];
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

export function consumeEquipmentUse(
  equipment: OwnedEquipment[],
  equipmentId: string
): OwnedEquipment[] {
  const idx = equipment.findIndex((e) => e.equipmentId === equipmentId);
  if (idx < 0) return equipment;

  const def = EQUIPMENT_MAP[equipmentId];
  if (!def?.maxUses) return equipment;

  const item = equipment[idx];
  const uses = (item.usesRemaining ?? def.maxUses) - 1;

  if (uses <= 0) {
    return equipment.filter((_, i) => i !== idx);
  }

  return equipment.map((e, i) =>
    i === idx ? { ...e, usesRemaining: uses } : e
  );
}

export function consumeWeaponUses(state: GameState): OwnedEquipment[] {
  let equipment = [...getOwnedEquipmentList(state)];

  for (const owned of getOwnedEquipmentList(state)) {
    const def = EQUIPMENT_MAP[owned.equipmentId];
    if (def?.type === 'weapon' && def.maxUses) {
      equipment = consumeEquipmentUse(equipment, owned.equipmentId);
      break;
    }
  }

  return equipment;
}

export function getInventoryLoadFactor(state: GameState): number {
  const used = state.player.inventory.reduce((s, i) => s + i.quantity, 0);
  const cap = Math.max(1, state.player.inventoryCapacity);
  return used / cap;
}

export function getRobberyRiskMultiplier(state: GameState): number {
  const load = getInventoryLoadFactor(state);
  let mult = 1 + load * 0.8;
  if (hasEquipment(state, 'safehouse_pass')) mult *= 0.75;
  mult *= Math.max(0.5, 1 - getSafehouseRobberyProtection(state));
  return mult;
}

export function getPoliceRiskMultiplier(state: GameState): number {
  const { player } = state;
  const effectiveHeat = getEffectivePoliceHeat(state, player.currentCityId);
  let mult = 1 + effectiveHeat / 80;
  mult += getInventoryLoadFactor(state) * 0.5;

  if (player.legalStatus === 'warning') mult *= 1.2;
  if (player.legalStatus === 'detained') mult *= 1.4;
  if (player.legalStatus === 'arrested') mult *= 1.6;
  if (player.legalStatus === 'jailed') mult *= 1.8;
  if (player.legalStatus === 'federal_case') mult *= 2.0;

  if (state.heatCooldowns?.informantProtectionUntilDay > player.day) {
    mult *= 0.6;
  }

  mult *= Math.max(0.6, 1 - getLookoutPoliceReduction(state));
  mult *= getSafehousePoliceModifier(state);

  return mult;
}

export function getAirportRiskMultiplier(state: GameState): number {
  let mult = getPoliceRiskMultiplier(state) * 1.3;
  if (hasEquipment(state, 'fake_id')) mult *= 0.7;
  mult *= Math.max(0.55, 1 - getSmugglerTravelReduction(state));
  return mult;
}

export function getCartelRiskMultiplier(state: GameState): number {
  const { player } = state;
  let mult = 1 + player.reputation / 100;
  mult += getInventoryLoadFactor(state) * 0.6;
  if (player.debt > 10000) mult *= 1.2;
  if ((state.cartelBetrayals ?? 0) > 0) {
    mult *= 1 + (state.cartelBetrayals ?? 0) * 0.15;
  }
  if ((state.cartelStanding ?? 0) < -20) mult *= 1.3;
  return mult;
}

export function getRivalRiskMultiplier(state: GameState): number {
  return 1 + state.player.reputation / 90 + getInventoryLoadFactor(state) * 0.3;
}
