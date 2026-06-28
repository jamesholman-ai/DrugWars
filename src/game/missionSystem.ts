import { GameState } from '../types/game';
import {
  DailyObjective,
  DailyObjectiveType,
  MissionEvent,
  MissionInstance,
  MissionProgressFlags,
  MissionReward,
  PriceTip,
} from '../types/missions';
import { RankId } from '../types/progression';
import {
  CHAIN_START_MISSION,
  DAILY_OBJECTIVE_COUNT,
  MAX_COMPLETED_MISSIONS,
  MAX_FAILED_MISSIONS,
  MISSION_MAP,
  STORY_ARC_ORDER,
  STORY_ARC_LABELS,
  StoryArcId,
  STORY_MISSIONS,
} from '../data/missions';
import { RANKS } from '../data/progression';
import { COMMODITIES, COMMODITY_MAP } from '../data/commodities';
import { SAFEHOUSE_MAP } from '../data/safehouses';
import { CITIES, CITY_MAP } from '../data/locations';
import { withMessage, withMessages } from './messages';
import { applyProgressionAfterAction } from './progression';
import { addDirtyMoney } from './money';
import { clamp, pickRandom, randomInt } from '../utils/random';
import { formatMoney } from '../utils/format';
import { revealMissionIntel, getActiveIntel } from './intelSystem';

const MAX_PRICE_TIPS = 5;

function rankIndex(rankId: RankId): number {
  return RANKS.findIndex((r) => r.id === rankId);
}

function getProgressFlags(state: GameState): MissionProgressFlags {
  return (state.missionProgress as MissionProgressFlags | undefined) ?? {};
}

function withProgressFlags(state: GameState, flags: Partial<MissionProgressFlags>): GameState {
  return {
    ...state,
    missionProgress: { ...getProgressFlags(state), ...flags },
  };
}

function createMissionInstance(defId: string, day: number): MissionInstance {
  const def = MISSION_MAP[defId];
  return {
    id: defId,
    status: 'active',
    progress: {},
    startedDay: day,
    deadlineDay: def?.deadlineDays ? day + def.deadlineDays : undefined,
    claimed: false,
  };
}

function countSafehouseCities(state: GameState): number {
  const cities = new Set<string>();
  for (const o of state.ownedSafehouses ?? []) {
    const def = SAFEHOUSE_MAP[o.safehouseId];
    if (def) cities.add(def.cityId);
  }
  return cities.size;
}

function countActiveCrew(state: GameState): number {
  return (state.hiredCrew ?? []).filter((c) => c.status === 'hired').length;
}

function computeRequirementProgress(
  state: GameState,
  key: string,
  instanceProgress: Record<string, number>
): number {
  switch (key) {
    case 'sales':
      return instanceProgress.sales ?? 0;
    case 'debt_paid':
      return instanceProgress.debt_paid ?? 0;
    case 'safehouses':
      return (state.ownedSafehouses ?? []).length;
    case 'safehouse_cities':
      return countSafehouseCities(state);
    case 'crew_hired':
      return Math.max(instanceProgress.crew_hired ?? 0, countActiveCrew(state));
    case 'crew_active':
      return countActiveCrew(state);
    case 'businesses':
      return (state.ownedBusinesses ?? []).length;
    case 'supplier_buys':
      return instanceProgress.supplier_buys ?? 0;
    case 'contracts':
      return instanceProgress.contracts ?? 0;
    case 'heat_max':
      return state.player.heat;
    case 'elite': {
      const repOk = state.player.reputation >= 50;
      const rankOk = rankIndex(state.progression.rankId) >= rankIndex('plug');
      return repOk || rankOk ? 1 : 0;
    }
    default:
      return instanceProgress[key] ?? 0;
  }
}

function isMissionComplete(state: GameState, instance: MissionInstance): boolean {
  const def = MISSION_MAP[instance.id];
  if (!def) return false;

  return def.requirements.every((req) => {
    if (req.key === 'heat_max') {
      return state.player.heat < req.target;
    }
    if (req.key === 'elite') {
      const repOk = state.player.reputation >= (req.minReputation ?? 50);
      const rankOk =
        req.minRank != null &&
        rankIndex(state.progression.rankId) >= rankIndex(req.minRank);
      return repOk || rankOk;
    }
    const current = computeRequirementProgress(state, req.key, instance.progress);
    return current >= req.target;
  });
}

function applyRewards(state: GameState, rewards: MissionReward): GameState {
  let player = state.player;
  let updated: GameState = { ...state, player };

  if (rewards.cash && rewards.cash > 0) {
    player = addDirtyMoney(player, rewards.cash);
    updated = { ...updated, player };
  }

  if (rewards.reputation && rewards.reputation > 0) {
    player = {
      ...player,
      reputation: clamp(player.reputation + rewards.reputation, 0, 100),
    };
    updated = { ...updated, player };
  }

  if (rewards.heatReduction && rewards.heatReduction > 0) {
    player = {
      ...player,
      heat: clamp(player.heat - rewards.heatReduction, 0, 100),
    };
    updated = { ...updated, player };
  }

  if (rewards.supplierTrust && rewards.supplierTrust > 0) {
    const rels = { ...(updated.supplierRelationships ?? {}) };
    for (const id of Object.keys(rels)) {
      rels[id] = {
        ...rels[id],
        trust: clamp((rels[id].trust ?? 50) + rewards.supplierTrust!, 0, 100),
      };
    }
    updated = { ...updated, supplierRelationships: rels };
  }

  if (rewards.crewLoyalty && rewards.crewLoyalty > 0) {
    updated = {
      ...updated,
      hiredCrew: (updated.hiredCrew ?? []).map((c) =>
        c.status === 'hired'
          ? { ...c, loyalty: clamp(c.loyalty + rewards.crewLoyalty!, 0, 100) }
          : c
      ),
    };
  }

  if (
    rewards.priceTipCommodity &&
    rewards.priceTipCityId &&
    rewards.priceTipDirection
  ) {
    const tip: PriceTip = {
      id: `tip_${updated.player.day}_${rewards.priceTipCommodity}`,
      commodityId: rewards.priceTipCommodity,
      cityId: rewards.priceTipCityId,
      direction: rewards.priceTipDirection,
      expiresDay: updated.player.day + 2,
    };
    updated = revealMissionIntel(updated, tip);
  }

  return updated;
}

function completeMission(state: GameState, instance: MissionInstance): GameState {
  const def = MISSION_MAP[instance.id];
  if (!def) return state;

  const completed: MissionInstance = {
    ...instance,
    status: 'completed',
    completedDay: state.player.day,
  };

  const activeMissions = (state.activeMissions ?? []).filter((m) => m.id !== instance.id);
  const completedMissions = [...(state.completedMissions ?? []), completed].slice(
    -MAX_COMPLETED_MISSIONS
  );

  let updated: GameState = {
    ...state,
    activeMissions,
    completedMissions,
  };

  const messages = [`Mission complete: ${def.title}! Claim your reward.`];

  if (def.nextMissionId && MISSION_MAP[def.nextMissionId]) {
    const next = createMissionInstance(def.nextMissionId, state.player.day);
    updated = {
      ...updated,
      activeMissions: [...(updated.activeMissions ?? []), next],
    };
    messages.push(`New objective: ${MISSION_MAP[def.nextMissionId].title}`);
  } else if (def.chainId) {
    updated = advanceToNextArc(updated, def.chainId as StoryArcId);
  }

  return withMessages(updated, messages);
}

function advanceToNextArc(state: GameState, completedArc: StoryArcId): GameState {
  const idx = STORY_ARC_ORDER.indexOf(completedArc);
  const nextArc = idx >= 0 && idx < STORY_ARC_ORDER.length - 1 ? STORY_ARC_ORDER[idx + 1] : null;

  if (!nextArc) {
    return withMessage(state, `${STORY_ARC_LABELS[completedArc]} arc complete!`);
  }

  const startId = CHAIN_START_MISSION[nextArc];
  const alreadyActive = (state.activeMissions ?? []).some((m) => m.id === startId);
  const alreadyDone = (state.completedMissions ?? []).some((m) => m.id === startId);

  if (alreadyActive || alreadyDone) {
    return { ...state, currentStoryArc: nextArc };
  }

  const next = createMissionInstance(startId, state.player.day);
  return withMessage(
    {
      ...state,
      currentStoryArc: nextArc,
      activeMissions: [...(state.activeMissions ?? []), next],
    },
    `${STORY_ARC_LABELS[nextArc]} arc unlocked: ${MISSION_MAP[startId]?.title ?? nextArc}.`
  );
}

function failMission(state: GameState, instance: MissionInstance): GameState {
  const def = MISSION_MAP[instance.id];
  const failed: MissionInstance = { ...instance, status: 'failed' };

  return withMessage(
    {
      ...state,
      activeMissions: (state.activeMissions ?? []).filter((m) => m.id !== instance.id),
      failedMissions: [...(state.failedMissions ?? []), failed].slice(-MAX_FAILED_MISSIONS),
    },
    def ? `Mission failed: ${def.title}.` : 'Mission failed.'
  );
}

function evaluateActiveMissions(state: GameState): GameState {
  let updated = state;

  for (const instance of [...(state.activeMissions ?? [])]) {
    if (instance.status !== 'active' || instance.claimed) continue;

    if (instance.deadlineDay != null && state.player.day > instance.deadlineDay) {
      updated = failMission(updated, instance);
      continue;
    }

    if (isMissionComplete(updated, instance)) {
      updated = completeMission(updated, instance);
    }
  }

  return updated;
}

function bumpMissionProgress(
  state: GameState,
  key: string,
  amount: number
): GameState {
  const activeMissions = (state.activeMissions ?? []).map((m) => {
    const def = MISSION_MAP[m.id];
    if (!def?.requirements.some((r) => r.key === key)) return m;
    return {
      ...m,
      progress: {
        ...m.progress,
        [key]: (m.progress[key] ?? 0) + amount,
      },
    };
  });

  return { ...state, activeMissions };
}

function bumpDailyProgress(state: GameState, type: DailyObjectiveType, amount: number): GameState {
  const dailyObjectives = (state.dailyObjectives ?? []).map((obj) => {
    if (obj.claimed || obj.type !== type) return obj;
    return { ...obj, progress: Math.min(obj.target, obj.progress + amount) };
  });
  return { ...state, dailyObjectives };
}

function bumpDailyProgressForDrug(
  state: GameState,
  commodityId: string,
  quantity: number
): GameState {
  const dailyObjectives = (state.dailyObjectives ?? []).map((obj) => {
    if (obj.claimed || obj.type !== 'sell_drug') return obj;
    if (obj.commodityId && obj.commodityId !== commodityId) return obj;
    return { ...obj, progress: Math.min(obj.target, obj.progress + quantity) };
  });
  return { ...state, dailyObjectives };
}

function evaluateDailyObjectives(state: GameState): GameState {
  const flags = getProgressFlags(state);
  let dailyObjectives = [...(state.dailyObjectives ?? [])];

  dailyObjectives = dailyObjectives.map((obj) => {
    if (obj.claimed || obj.progress >= obj.target) return obj;

    let progress = obj.progress;

    switch (obj.type) {
      case 'make_profit':
        progress = flags.profitToday ?? 0;
        break;
      case 'lower_heat':
        if (flags.heatStartOfDay != null) {
          progress = Math.max(0, flags.heatStartOfDay - state.player.heat);
        }
        break;
      case 'avoid_police':
        progress = flags.policeEncounterToday ? 0 : obj.progress;
        break;
      case 'travel_city':
        progress = (flags.citiesVisitedToday ?? []).length >= 1 ? 1 : obj.progress;
        break;
      case 'complete_deal':
        progress = flags.dealsToday ?? 0;
        break;
      default:
        break;
    }

    return { ...obj, progress: Math.min(obj.target, progress) };
  });

  return { ...state, dailyObjectives };
}

function pickDailyTemplate(state: GameState): DailyObjective {
  const day = state.player.day;
  const pool: Array<() => DailyObjective> = [
    () => ({
      id: `daily_profit_${day}_${randomInt(100, 999)}`,
      type: 'make_profit',
      title: 'Turn A Profit',
      description: `Make $${500 + randomInt(0, 4) * 200} profit today.`,
      target: 500 + randomInt(0, 4) * 200,
      progress: 0,
      rewards: { cash: 250 + randomInt(0, 3) * 60, reputation: 1 },
      claimed: false,
      generatedDay: day,
    }),
    () => {
      const city = pickRandom(CITIES.filter((c) => c.id !== state.player.currentCityId)) ?? CITIES[0];
      return {
        id: `daily_travel_${day}_${city.id}`,
        type: 'travel_city',
        title: 'Expand Routes',
        description: `Travel to ${city.name} today.`,
        target: 1,
        progress: 0,
        rewards: { cash: 180, reputation: 1 },
        claimed: false,
        generatedDay: day,
        cityId: city.id,
      };
    },
    () => ({
      id: `daily_deal_${day}`,
      type: 'complete_deal',
      title: 'Close A Deal',
      description: 'Complete a supplier buy or buyer contract today.',
      target: 1,
      progress: 0,
      rewards: { cash: 250, supplierTrust: 3 },
      claimed: false,
      generatedDay: day,
    }),
    () => ({
      id: `daily_heat_${day}`,
      type: 'lower_heat',
      title: 'Stay Cool',
      description: 'Drop heat by at least 5 points today.',
      target: 5,
      progress: 0,
      rewards: { heatReduction: 4, reputation: 1 },
      claimed: false,
      generatedDay: day,
    }),
    () => {
      const drug = pickRandom(COMMODITIES) ?? COMMODITIES[0];
      return {
        id: `daily_sell_${day}_${drug.id}`,
        type: 'sell_drug',
        title: `Move ${drug.name}`,
        description: `Sell ${5 + randomInt(0, 3) * 5} units of ${drug.name} today.`,
        target: 5 + randomInt(0, 3) * 5,
        progress: 0,
        rewards: {
          cash: 180,
          priceTipCommodity: drug.id,
          priceTipCityId: state.player.currentCityId,
          priceTipDirection: 'sell',
        },
        claimed: false,
        generatedDay: day,
        commodityId: drug.id,
      };
    },
    () => ({
      id: `daily_supplier_${day}`,
      type: 'visit_supplier',
      title: 'Supplier Run',
      description: 'Buy from a supplier today.',
      target: 1,
      progress: 0,
      rewards: { cash: 120, supplierTrust: 4 },
      claimed: false,
      generatedDay: day,
    }),
    () => ({
      id: `daily_debt_${day}`,
      type: 'pay_debt',
      title: 'Feed The Shark',
      description: `Pay $${300 + randomInt(0, 4) * 100} toward debt today.`,
      target: 300 + randomInt(0, 4) * 100,
      progress: 0,
      rewards: { cash: 100, reputation: 2 },
      claimed: false,
      generatedDay: day,
    }),
    () => ({
      id: `daily_avoid_${day}`,
      type: 'avoid_police',
      title: 'Ghost Mode',
      description: 'End the day without a police encounter.',
      target: 1,
      progress: 0,
      rewards: { heatReduction: 3, cash: 150 },
      claimed: false,
      generatedDay: day,
    }),
    () => ({
      id: `daily_stash_${day}`,
      type: 'deposit_safehouse',
      title: 'Store Product',
      description: 'Deposit at least 10 units into property storage today.',
      target: 10,
      progress: 0,
      rewards: { cash: 160, reputation: 1 },
      claimed: false,
      generatedDay: day,
    }),
  ];

  const available =
    (state.ownedSafehouses ?? []).length > 0
      ? pool
      : pool.filter((fn) => {
          const sample = fn();
          return sample.type !== 'deposit_safehouse';
        });

  return pickRandom(available)!();
}

export function syncMissionState(state: GameState): GameState {
  let updated = evaluateActiveMissions(state);
  updated = evaluateDailyObjectives(updated);
  return updated;
}

export function trackMissionEvent(state: GameState, event: MissionEvent): GameState {
  let updated = state;

  switch (event.kind) {
    case 'sell':
      updated = bumpMissionProgress(updated, 'sales', 1);
      if (event.profit > 0) {
        const flags = getProgressFlags(updated);
        updated = withProgressFlags(updated, {
          profitToday: (flags.profitToday ?? 0) + event.profit,
        });
      }
      break;
    case 'buy_supplier':
      updated = bumpMissionProgress(updated, 'supplier_buys', 1);
      updated = bumpDailyProgress(updated, 'complete_deal', 1);
      updated = bumpDailyProgress(updated, 'visit_supplier', 1);
      {
        const flags = getProgressFlags(updated);
        updated = withProgressFlags(updated, {
          dealsToday: (flags.dealsToday ?? 0) + 1,
        });
      }
      break;
    case 'fulfill_contract':
      updated = bumpMissionProgress(updated, 'contracts', 1);
      updated = bumpDailyProgress(updated, 'complete_deal', 1);
      {
        const flags = getProgressFlags(updated);
        updated = withProgressFlags(updated, {
          dealsToday: (flags.dealsToday ?? 0) + 1,
        });
      }
      break;
    case 'travel_city': {
      updated = bumpDailyProgress(updated, 'travel_city', 1);
      const flags = getProgressFlags(updated);
      const visited = new Set(flags.citiesVisitedToday ?? []);
      visited.add(event.cityId);
      updated = withProgressFlags(updated, { citiesVisitedToday: [...visited] });
      break;
    }
    case 'pay_debt':
      updated = bumpMissionProgress(updated, 'debt_paid', event.amount);
      updated = bumpDailyProgress(updated, 'pay_debt', event.amount);
      break;
    case 'hire_crew':
      updated = bumpMissionProgress(updated, 'crew_hired', 1);
      break;
    case 'deposit_safehouse':
      updated = bumpDailyProgress(updated, 'deposit_safehouse', event.quantity);
      break;
    case 'visit_supplier':
      updated = bumpDailyProgress(updated, 'visit_supplier', 1);
      break;
    case 'police_encounter':
      updated = withProgressFlags(updated, { policeEncounterToday: true });
      break;
    default:
      break;
  }

  if (event.kind === 'sell' && event.commodityId) {
    updated = bumpDailyProgressForDrug(updated, event.commodityId, event.quantity);
  }

  updated = evaluateActiveMissions(updated);
  updated = evaluateDailyObjectives(updated);
  return updated;
}

export function generateDailyObjectives(state: GameState): GameState {
  const day = state.player.day;
  const existing = (state.dailyObjectives ?? []).filter((o) => o.generatedDay === day);
  if (existing.length >= DAILY_OBJECTIVE_COUNT) {
    return state;
  }

  const usedTypes = new Set(existing.map((o) => o.type));
  const objectives: DailyObjective[] = [...existing];

  let attempts = 0;
  while (objectives.length < DAILY_OBJECTIVE_COUNT && attempts < 30) {
    attempts += 1;
    const candidate = pickDailyTemplate(state);
    if (usedTypes.has(candidate.type) && usedTypes.size < 6) continue;
    if (objectives.some((o) => o.id === candidate.id)) continue;
    usedTypes.add(candidate.type);
    objectives.push(candidate);
  }

  return {
    ...state,
    dailyObjectives: objectives,
    missionProgress: {
      ...getProgressFlags(state),
      profitToday: 0,
      policeEncounterToday: false,
      citiesVisitedToday: [],
      dealsToday: 0,
      heatStartOfDay: state.player.heat,
    },
  };
}

export function tickMissionsOnDayAdvance(state: GameState): GameState {
  let updated = evaluateActiveMissions(state);

  const flags = getProgressFlags(updated);
  const endedDay = updated.player.day - 1;
  if (endedDay >= 1 && !flags.policeEncounterToday) {
    updated = {
      ...updated,
      dailyObjectives: (updated.dailyObjectives ?? []).map((obj) => {
        if (
          obj.type === 'avoid_police' &&
          obj.generatedDay === endedDay &&
          !obj.claimed &&
          obj.progress < obj.target
        ) {
          return { ...obj, progress: obj.target };
        }
        return obj;
      }),
    };
  }

  const expiredTips = (updated.activePriceTips ?? []).filter(
    (t) => t.expiresDay > updated.player.day
  );
  updated = { ...updated, activePriceTips: expiredTips };

  return generateDailyObjectives(updated);
}

export function claimMissionReward(state: GameState, missionId: string): GameState {
  const instance = (state.completedMissions ?? []).find((m) => m.id === missionId);

  if (!instance) {
    return withMessage(state, 'Claim failed: mission not found or not complete.');
  }
  if (instance.claimed) {
    return withMessage(state, 'Claim failed: reward already claimed.');
  }

  const def = MISSION_MAP[missionId];
  if (!def) return withMessage(state, 'Claim failed: unknown mission.');

  const claimed: MissionInstance = { ...instance, claimed: true };
  let updated = applyRewards(state, def.rewards);

  updated = {
    ...updated,
    completedMissions: (updated.completedMissions ?? []).map((m) =>
      m.id === missionId ? claimed : m
    ),
  };

  return applyProgressionAfterAction(
    withMessage(updated, buildRewardClaimLogMessage(def.rewards))
  );
}

export function claimDailyObjective(state: GameState, objectiveId: string): GameState {
  const obj = (state.dailyObjectives ?? []).find((o) => o.id === objectiveId);
  if (!obj) return withMessage(state, 'Claim failed: objective not found.');
  if (obj.claimed) return withMessage(state, 'Claim failed: reward already claimed.');
  if (obj.progress < obj.target) {
    return withMessage(state, 'Claim failed: objective not complete yet.');
  }

  let updated = applyRewards(state, obj.rewards);
  updated = {
    ...updated,
    dailyObjectives: (updated.dailyObjectives ?? []).map((o) =>
      o.id === objectiveId ? { ...o, claimed: true } : o
    ),
  };

  return applyProgressionAfterAction(
    withMessage(updated, buildRewardClaimLogMessage(obj.rewards))
  );
}

export function getCurrentStoryMission(state: GameState): MissionInstance | undefined {
  const arc = state.currentStoryArc as StoryArcId | null;
  if (!arc) return undefined;

  return (state.activeMissions ?? []).find((m) => {
    const def = MISSION_MAP[m.id];
    return def?.chainId === arc && m.status === 'active';
  });
}

export function initializeMissionState(state: GameState): GameState {
  const startId = CHAIN_START_MISSION.street_starter;
  const first = createMissionInstance(startId, state.player.day);

  let updated: GameState = {
    ...state,
    missions: STORY_MISSIONS.map((d) => d.id),
    activeMissions: [first],
    completedMissions: [],
    failedMissions: [],
    dailyObjectives: [],
    currentStoryArc: 'street_starter',
    missionProgress: {},
    activePriceTips: [],
  };

  updated = generateDailyObjectives(updated);
  return updated;
}

export function createDefaultMissionState(): {
  missions: string[];
  activeMissions: MissionInstance[];
  completedMissions: MissionInstance[];
  failedMissions: MissionInstance[];
  dailyObjectives: DailyObjective[];
  currentStoryArc: StoryArcId | null;
  missionProgress: MissionProgressFlags;
  activePriceTips: PriceTip[];
} {
  return {
    missions: STORY_MISSIONS.map((d) => d.id),
    activeMissions: [],
    completedMissions: [],
    failedMissions: [],
    dailyObjectives: [],
    currentStoryArc: null,
    missionProgress: {},
    activePriceTips: [],
  };
}

export function migrateMissionInstances(raw: unknown): MissionInstance[] {
  if (!Array.isArray(raw)) return [];
  const result: MissionInstance[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const id = typeof e.id === 'string' ? e.id : '';
    if (!MISSION_MAP[id]) continue;
    const statusRaw = typeof e.status === 'string' ? e.status : 'active';
    const status = ['available', 'active', 'completed', 'failed'].includes(statusRaw)
      ? (statusRaw as MissionInstance['status'])
      : 'active';
    const progress: Record<string, number> = {};
    if (typeof e.progress === 'object' && e.progress !== null) {
      for (const [k, v] of Object.entries(e.progress as Record<string, unknown>)) {
        if (typeof v === 'number') progress[k] = v;
      }
    }
    result.push({
      id,
      status,
      progress,
      startedDay: typeof e.startedDay === 'number' ? e.startedDay : 1,
      deadlineDay: typeof e.deadlineDay === 'number' ? e.deadlineDay : undefined,
      claimed: e.claimed === true,
      completedDay: typeof e.completedDay === 'number' ? e.completedDay : undefined,
    });
  }
  return result;
}

export function migrateDailyObjectives(raw: unknown): DailyObjective[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e, i) => ({
      id: typeof e.id === 'string' ? e.id : `daily_${i}`,
      type: (typeof e.type === 'string' ? e.type : 'make_profit') as DailyObjectiveType,
      title: typeof e.title === 'string' ? e.title : 'Objective',
      description: typeof e.description === 'string' ? e.description : '',
      target: typeof e.target === 'number' ? e.target : 1,
      progress: typeof e.progress === 'number' ? e.progress : 0,
      rewards:
        typeof e.rewards === 'object' && e.rewards !== null
          ? (e.rewards as DailyObjective['rewards'])
          : {},
      claimed: e.claimed === true,
      generatedDay: typeof e.generatedDay === 'number' ? e.generatedDay : 1,
      commodityId:
        typeof e.commodityId === 'string'
          ? (e.commodityId as DailyObjective['commodityId'])
          : undefined,
      cityId: typeof e.cityId === 'string' ? e.cityId : undefined,
    }))
    .slice(0, DAILY_OBJECTIVE_COUNT * 3);
}

export function migratePriceTips(raw: unknown): PriceTip[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e, i) => ({
      id: typeof e.id === 'string' ? e.id : `tip_${i}`,
      commodityId:
        typeof e.commodityId === 'string' ? (e.commodityId as PriceTip['commodityId']) : 'weed',
      cityId: typeof e.cityId === 'string' ? e.cityId : 'new_york',
      direction: (e.direction === 'buy' ? 'buy' : 'sell') as PriceTip['direction'],
      expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 1,
    }))
    .slice(-MAX_PRICE_TIPS);
}

export function migrateMissionProgress(raw: unknown): MissionProgressFlags {
  if (typeof raw !== 'object' || raw === null) return {};
  const e = raw as Record<string, unknown>;
  return {
    debtPaidTotal: typeof e.debtPaidTotal === 'number' ? e.debtPaidTotal : undefined,
    profitToday: typeof e.profitToday === 'number' ? e.profitToday : undefined,
    policeEncounterToday: e.policeEncounterToday === true,
    heatStartOfDay: typeof e.heatStartOfDay === 'number' ? e.heatStartOfDay : undefined,
    citiesVisitedToday: Array.isArray(e.citiesVisitedToday)
      ? e.citiesVisitedToday.filter((c): c is string => typeof c === 'string')
      : undefined,
    dealsToday: typeof e.dealsToday === 'number' ? e.dealsToday : undefined,
  };
}

export function getMissionProgressLabel(state: GameState, instance: MissionInstance): string {
  return getMissionProgressWidgetText(state, instance);
}

export function getMissionProgressWidgetText(state: GameState, instance: MissionInstance): string {
  const def = MISSION_MAP[instance.id];
  if (!def || def.requirements.length === 0) return '';

  const req = def.requirements[0];
  const current = computeRequirementProgress(state, req.key, instance.progress);
  const capped = Math.min(current, req.target);

  switch (req.key) {
    case 'debt_paid':
      return `Debt paid ${formatMoney(capped)} / ${formatMoney(req.target)}`;
    case 'crew_hired':
      return `Hire crew (${capped}/${req.target})`;
    case 'crew_active':
      return `Active crew (${capped}/${req.target})`;
    case 'safehouses':
      return `Buy property (${capped}/${req.target})`;
    case 'safehouse_cities':
      return `Properties in cities (${capped}/${req.target})`;
    case 'sales':
      return `Street sales (${capped}/${req.target})`;
    case 'supplier_buys':
      return `Supplier deals (${capped}/${req.target})`;
    case 'contracts':
      return `Contracts fulfilled (${capped}/${req.target})`;
    case 'businesses':
      return `Businesses owned (${capped}/${req.target})`;
    case 'heat_max':
      return `Heat ${state.player.heat} (need <${req.target})`;
    case 'elite':
      return `Rep ${state.player.reputation}/50 or Plug rank`;
    default:
      return `${capped}/${req.target}`;
  }
}

export function isStoryCampaignComplete(state: GameState): boolean {
  return state.currentStoryArc == null;
}

export function getDailyProgressLabel(obj: DailyObjective): string {
  return `${Math.min(obj.progress, obj.target)}/${obj.target}`;
}

export function getActivePriceTips(state: GameState): PriceTip[] {
  return getActiveIntel(state)
    .filter((e) => e.commodityId && e.cityId && e.direction)
    .map((e) => ({
      id: e.id,
      commodityId: e.commodityId!,
      cityId: e.cityId!,
      direction: e.direction!,
      expiresDay: e.expiresDay,
    }));
}

export function formatPriceTip(tip: PriceTip): string {
  const name = COMMODITY_MAP[tip.commodityId]?.name ?? tip.commodityId;
  const city = CITY_MAP[tip.cityId]?.name ?? tip.cityId;
  return tip.direction === 'sell'
    ? `Sell ${name} in ${city} — prices hot`
    : `Buy ${name} in ${city} — prices low`;
}

/** Human-readable reward breakdown for claim UI and activity log. */
export function formatMissionRewardSummary(rewards: MissionReward): string {
  const parts: string[] = [];

  if (rewards.cash && rewards.cash > 0) {
    parts.push(`+${formatMoney(rewards.cash)}`);
  }
  if (rewards.reputation && rewards.reputation > 0) {
    parts.push(`+${rewards.reputation} reputation`);
  }
  if (rewards.heatReduction && rewards.heatReduction > 0) {
    parts.push(`−${rewards.heatReduction} heat`);
  }
  if (rewards.supplierTrust && rewards.supplierTrust > 0) {
    parts.push(`+${rewards.supplierTrust} supplier trust`);
  }
  if (rewards.crewLoyalty && rewards.crewLoyalty > 0) {
    parts.push(`+${rewards.crewLoyalty} crew loyalty`);
  }
  if (
    rewards.priceTipCommodity &&
    rewards.priceTipCityId &&
    rewards.priceTipDirection
  ) {
    const name = COMMODITY_MAP[rewards.priceTipCommodity]?.name ?? rewards.priceTipCommodity;
    const city = CITY_MAP[rewards.priceTipCityId]?.name ?? rewards.priceTipCityId;
    const verb = rewards.priceTipDirection === 'sell' ? 'Sell' : 'Buy';
    parts.push(`price tip: ${verb} ${name} in ${city}`);
  }

  return parts.join(', ');
}

export function buildRewardClaimLogMessage(rewards: MissionReward): string {
  const summary = formatMissionRewardSummary(rewards);
  return summary ? `Reward claimed: ${summary}.` : 'Reward claimed.';
}
