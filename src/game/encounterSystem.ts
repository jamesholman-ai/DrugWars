import { GameState } from '../types/game';
import { EncounterDefinition, EncounterTriggerContext } from '../types/encounters';
import { GameEvent } from '../types/events';
import {
  ENCOUNTER_CATALOG,
  ENCOUNTER_MAP,
  CARTEL_EXECUTION_ENCOUNTER,
  DEBT_COLLECTOR_EXECUTION_ENCOUNTER,
} from '../data/encounterCatalog';
import { adjustWeight, weightedPick, WeightedItem } from '../utils/weightedRandom';
import { getPlayerAreaKey, isAirportArea } from '../data/locations';
import { getEffectivePoliceHeat } from './territory';
import {
  getAirportRiskMultiplier,
  getCartelRiskMultiplier,
  getInventoryLoadFactor,
  getPoliceRiskMultiplier,
  getRivalRiskMultiplier,
  getRobberyRiskMultiplier,
} from './combat';
import { normalizeGameState } from './stateUtils';
import { hasPoliceEncounterReduction } from './storeInventory';
import { trackMissionEvent } from './missionSystem';

const TRIGGER_CHANCE: Record<EncounterTriggerContext, number> = {
  stay: 0.12,
  areaTravel: 0.18,
  cityTravel: 0.28,
  marketAction: 0.08,
  highHeat: 0.25,
};

function factionMultiplier(
  state: GameState,
  faction: EncounterDefinition['faction'],
  atAirport: boolean
): number {
  switch (faction) {
    case 'police':
    case 'dea':
      return getPoliceRiskMultiplier(state);
    case 'airport_police':
      return atAirport ? getAirportRiskMultiplier(state) * 1.5 : getAirportRiskMultiplier(state) * 0.3;
    case 'thug':
      return getRobberyRiskMultiplier(state);
    case 'rival':
      return getRivalRiskMultiplier(state);
    case 'cartel':
      return getCartelRiskMultiplier(state);
    case 'civilian':
      return 1;
    default:
      return 1;
  }
}

function buildEncounterWeights(
  state: GameState,
  context: EncounterTriggerContext
): WeightedItem<string>[] {
  const { player } = state;
  const atAirport = isAirportArea(player.currentAreaId);
  const effectiveHeat = getEffectivePoliceHeat(state, player.currentCityId);
  const highHeat = effectiveHeat >= 55;
  const load = getInventoryLoadFactor(state);

  const items: WeightedItem<string>[] = [];

  for (const enc of ENCOUNTER_CATALOG) {
    if (!enc.triggerContexts.includes(context)) continue;
    if (context === 'highHeat' && !highHeat) continue;
    if (enc.faction === 'airport_police' && context === 'cityTravel' && !atAirport) {
      continue;
    }

    let weight = enc.baseWeight;
    weight = adjustWeight(weight, factionMultiplier(state, enc.faction, atAirport));

    if (enc.faction === 'police' || enc.faction === 'dea') {
      weight = adjustWeight(weight, 1 + effectiveHeat / 100);
    }
    if (enc.faction === 'rival' || enc.faction === 'cartel') {
      weight = adjustWeight(weight, 1 + player.reputation / 120);
    }
    if (enc.faction === 'thug') {
      weight = adjustWeight(weight, 1 + load * 0.8);
    }
    if (highHeat && (enc.faction === 'police' || enc.faction === 'dea')) {
      weight = adjustWeight(weight, 1.4);
    }

    items.push({ item: enc.id, weight });
  }

  return items;
}

export function buildEncounterEvent(
  encounter: EncounterDefinition,
  state: GameState
): GameEvent {
  const areaKey = getPlayerAreaKey(state.player);

  const choices = encounter.choices
    .filter((c) => {
      if (c.minCash != null && state.player.cash < c.minCash) return false;
      if (c.requiresEquipment && !state.equipment?.some((e) => e.equipmentId === c.requiresEquipment)) {
        return false;
      }
      return true;
    })
    .map((c) => ({
      id: `enc:${encounter.id}:${c.id}`,
      label: c.label,
    }));

  if (choices.length === 0) {
    choices.push({
      id: `enc:${encounter.id}:talk`,
      label: 'Talk your way out',
    });
  }

  return {
    id: `encounter_${encounter.id}_${state.player.day}`,
    eventType: 'police_stop',
    title: encounter.title,
    description: `${encounter.description}\n\n[Danger ${encounter.dangerLevel}/5 · ${encounter.faction.toUpperCase()} · Threat ${encounter.threatScore}]`,
    choices,
    context: {
      locationId: areaKey,
      amount: encounter.threatScore,
      npcId: encounter.id,
    },
  };
}

function pickSpecialEncounter(state: GameState): EncounterDefinition | null {
  const { player } = state;

  if (
    player.debt > 25000 &&
    player.debtCollectorWarnings >= 3 &&
    player.cash < player.debt * 0.1
  ) {
    return DEBT_COLLECTOR_EXECUTION_ENCOUNTER;
  }

  if (
    (state.cartelStanding ?? 0) <= -50 &&
    (state.cartelBetrayals ?? 0) >= 2 &&
    player.reputation >= 50
  ) {
    return CARTEL_EXECUTION_ENCOUNTER;
  }

  return null;
}

export function rollEncounter(
  state: GameState,
  context: EncounterTriggerContext,
  random: () => number = Math.random
): GameState {
  const normalized = normalizeGameState(state);
  if (normalized.pendingEvent || normalized.player.isGameOver) {
    return normalized;
  }

  if (normalized.player.daysInJail > 0) {
    return normalized;
  }

  const special = pickSpecialEncounter(normalized);
  if (special && random() < 0.35) {
    return {
      ...normalized,
      pendingEvent: buildEncounterEvent(special, normalized),
    };
  }

  const effectiveContext =
    normalized.player.heat >= 70 && random() < 0.25 ? 'highHeat' : context;

  let chance = TRIGGER_CHANCE[effectiveContext];
  if (hasPoliceEncounterReduction(normalized)) {
    chance *= 0.5;
  }
  if (random() > chance) {
    return normalized;
  }

  const weights = buildEncounterWeights(normalized, effectiveContext);
  const encounterId = weightedPick(weights, random);
  if (!encounterId) return normalized;

  const encounter = ENCOUNTER_MAP[encounterId];
  if (!encounter) return normalized;

  let updated: GameState = {
    ...normalized,
    pendingEvent: buildEncounterEvent(encounter, normalized),
  };

  if (
    encounter.faction === 'police' ||
    encounter.faction === 'dea' ||
    encounter.faction === 'airport_police'
  ) {
    updated = trackMissionEvent(updated, { kind: 'police_encounter' });
  }

  return updated;
}

export function isEncounterChoice(choiceId: string): boolean {
  return choiceId.startsWith('enc:');
}

export function parseEncounterChoice(choiceId: string): {
  encounterId: string;
  choiceKey: string;
} | null {
  if (!choiceId.startsWith('enc:')) return null;
  const parts = choiceId.slice(4).split(':');
  if (parts.length < 2) return null;
  const choiceKey = parts.pop()!;
  const encounterId = parts.join(':');
  return { encounterId, choiceKey };
}

export { TRIGGER_CHANCE as ENCOUNTER_TRIGGER_CHANCE };
