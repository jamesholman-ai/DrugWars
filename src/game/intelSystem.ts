import { COMMODITY_MAP, COMMODITIES } from '../data/commodities';
import { CITIES, CITY_MAP, getAreaLabel } from '../data/locations';
import { CommodityId, GameState } from '../types/game';
import {
  IntelEntry,
  IntelKind,
  IntelSource,
  INTEL_SOURCE_LABELS,
} from '../types/intel';
import { PlayerProfile } from '../types/playerProfile';
import { PriceTip } from '../types/missions';
import { tryConsumeCredit } from './consumableCredits';
import { getSupplierScoutBonuses } from './crewBonuses';
import { withMessage } from './messages';
import { clamp } from '../utils/random';

const MAX_HIDDEN = 14;
const MAX_ACTIVE = 10;
const MAX_EXPIRED = 24;

const BASE_REVEAL_CHANCE: Partial<Record<IntelSource, number>> = {
  stay: 0.09,
  travel_area: 0.07,
  travel_city: 0.11,
  informant: 0.55,
  supplier: 0.35,
  crew: 0.22,
  contract: 0.4,
  world_event: 0.45,
  street: 0.12,
};

function pick<T>(arr: T[], random: () => number = Math.random): T {
  return arr[Math.floor(random() * arr.length)]!;
}

function uniqueId(prefix: string, day: number, random: () => number): string {
  return `${prefix}_${day}_${Math.floor(random() * 1e6)}`;
}

export function createDefaultIntelState(): {
  hiddenOpportunities: IntelEntry[];
  activeIntel: IntelEntry[];
  expiredIntel: IntelEntry[];
  intelRevealTokens: number;
} {
  return {
    hiddenOpportunities: [],
    activeIntel: [],
    expiredIntel: [],
    intelRevealTokens: 0,
  };
}

function priceTipToIntel(tip: PriceTip, revealed: boolean): IntelEntry {
  return {
    id: tip.id,
    kind: tip.direction === 'sell' ? 'market_sell' : 'market_buy',
    source: 'mission',
    message: formatLegacyPriceTip(tip),
    createdDay: Math.max(1, tip.expiresDay - 2),
    expiresDay: tip.expiresDay,
    revealed,
    discoveredDay: revealed ? Math.max(1, tip.expiresDay - 2) : undefined,
    commodityId: tip.commodityId,
    cityId: tip.cityId,
    direction: tip.direction,
  };
}

function formatLegacyPriceTip(tip: PriceTip): string {
  const name = COMMODITY_MAP[tip.commodityId]?.name ?? tip.commodityId;
  const city = CITY_MAP[tip.cityId]?.name ?? tip.cityId;
  return tip.direction === 'sell'
    ? `${name} prices hot in ${city} — sell while you can.`
    : `${name} runs cheap in ${city} — stock up.`;
}

export function migrateIntelEntry(raw: unknown): IntelEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== 'string' || typeof e.message !== 'string') return null;
  const kind = (typeof e.kind === 'string' ? e.kind : 'market_buy') as IntelKind;
  const source = (typeof e.source === 'string' ? e.source : 'street') as IntelSource;
  return {
    id: e.id,
    kind,
    source,
    message: e.message,
    createdDay: typeof e.createdDay === 'number' ? e.createdDay : 1,
    expiresDay: typeof e.expiresDay === 'number' ? e.expiresDay : 3,
    revealed: e.revealed === true,
    discoveredDay: typeof e.discoveredDay === 'number' ? e.discoveredDay : undefined,
    commodityId: typeof e.commodityId === 'string' ? (e.commodityId as CommodityId) : undefined,
    cityId: typeof e.cityId === 'string' ? e.cityId : undefined,
    areaId: typeof e.areaId === 'string' ? e.areaId : undefined,
    direction: e.direction === 'sell' ? 'sell' : e.direction === 'buy' ? 'buy' : undefined,
  };
}

export function migrateIntelEntries(raw: unknown): IntelEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(migrateIntelEntry).filter((e): e is IntelEntry => e != null);
}

export function migrateIntelFromLegacy(
  state: GameState,
  activePriceTips: PriceTip[]
): GameState {
  const defaults = createDefaultIntelState();
  const hidden = migrateIntelEntries(state.hiddenOpportunities);
  let active = migrateIntelEntries(state.activeIntel);
  const expired = migrateIntelEntries(state.expiredIntel);

  if (active.length === 0 && activePriceTips.length > 0) {
    active = activePriceTips.map((t) => priceTipToIntel(t, true));
  }

  return {
    ...state,
    hiddenOpportunities: hidden.length ? hidden : defaults.hiddenOpportunities,
    activeIntel: active,
    expiredIntel: expired,
    intelRevealTokens:
      typeof state.intelRevealTokens === 'number'
        ? Math.max(0, state.intelRevealTokens)
        : defaults.intelRevealTokens,
    activePriceTips: [],
  };
}

function buildMarketIntel(
  state: GameState,
  kind: IntelKind,
  cityId: string,
  commodityId: CommodityId,
  durationDays: number,
  random: () => number
): IntelEntry {
  const name = COMMODITY_MAP[commodityId]?.name ?? commodityId;
  const city = CITY_MAP[cityId]?.name ?? cityId;
  const days = Math.max(1, durationDays);
  let message: string;
  let direction: 'buy' | 'sell' | undefined;

  switch (kind) {
    case 'price_spike':
    case 'market_sell':
      message = `${name} is spiking in ${city} for ${days} day${days === 1 ? '' : 's'}.`;
      direction = 'sell';
      break;
    case 'price_crash':
    case 'market_buy':
      message = `${name} is crashing in ${city} — buy low for ${days} day${days === 1 ? '' : 's'}.`;
      direction = 'buy';
      break;
    default:
      message = `Watch ${name} prices in ${city} over the next ${days} days.`;
      break;
  }

  return {
    id: uniqueId('intel', state.player.day, random),
    kind,
    source: 'street',
    message,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
    commodityId,
    cityId,
    direction,
  };
}

function buildPoliceIntel(state: GameState, random: () => number): IntelEntry {
  const area = getAreaLabel(state.player.currentCityId, state.player.currentAreaId);
  const days = 2 + Math.floor(random() * 2);
  return {
    id: uniqueId('intel_police', state.player.day, random),
    kind: 'police_warning',
    source: 'street',
    message: `Police crackdown building near ${area} — lay low for ${days} days.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
  };
}

function buildSupplierIntel(state: GameState, random: () => number): IntelEntry {
  const area = getAreaLabel(state.player.currentCityId, state.player.currentAreaId);
  const pct = 10 + Math.floor(random() * 15);
  const days = 1 + Math.floor(random() * 2);
  return {
    id: uniqueId('intel_supplier', state.player.day, random),
    kind: 'supplier_discount',
    source: 'supplier',
    message: `Supplier discount in ${area} — ~${pct}% off for ${days} day${days === 1 ? '' : 's'}.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
  };
}

function buildContractIntel(state: GameState, random: () => number): IntelEntry {
  const offer = (state.contractOffers ?? [])[0];
  const city = offer
    ? getAreaLabel(offer.cityId, offer.areaId)
    : CITY_MAP[state.player.currentCityId]?.name ?? 'nearby';
  const days = 2 + Math.floor(random() * 2);
  return {
    id: uniqueId('intel_contract', state.player.day, random),
    kind: 'buyer_contract',
    source: 'contract',
    message: `Buyer contract opportunity around ${city} — high payout lead for ${days} days.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
  };
}

function buildWorldEventIntel(state: GameState, random: () => number): IntelEntry {
  const event = (state.activeWorldEvents ?? [])[0];
  const days = event ? Math.max(1, event.expiresDay - state.player.day) : 2;
  return {
    id: uniqueId('intel_world', state.player.day, random),
    kind: event?.type.includes('crash') ? 'price_crash' : 'price_spike',
    source: 'world_event',
    message: event
      ? `${event.title} — ${event.description.slice(0, 80)}`
      : `Market shift detected — watch prices for ${days} days.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
  };
}

function buildRaidIntel(state: GameState, random: () => number): IntelEntry {
  const days = 2 + Math.floor(random() * 3);
  return {
    id: uniqueId('intel_raid', state.player.day, random),
    kind: 'raid_warning',
    source: 'crew',
    message: `Front businesses at elevated raid risk for ${days} days — reduce heat or lay low.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
  };
}

function buildSafeRouteIntel(state: GameState, random: () => number): IntelEntry {
  const dest = pick(CITIES.filter((c) => c.id !== state.player.currentCityId));
  const days = 2 + Math.floor(random() * 2);
  return {
    id: uniqueId('intel_route', state.player.day, random),
    kind: 'safe_route',
    source: 'travel_city',
    message: `Safe travel window toward ${dest.name} for ${days} days — lower intercept risk.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + days,
    revealed: false,
    cityId: dest.id,
  };
}

function pickIntelGenerator(state: GameState, random: () => number): IntelEntry {
  const heat = state.player.heat;
  const rep = state.player.reputation;
  const hasBusiness = (state.ownedBusinesses ?? []).length > 0;
  const hasWorld = (state.activeWorldEvents ?? []).length > 0;
  const hasContracts = (state.contractOffers ?? []).length > 0;

  if (heat >= 65 && random() < 0.45) {
    return buildPoliceIntel(state, random);
  }
  if (hasWorld && random() < 0.35) {
    return buildWorldEventIntel(state, random);
  }
  if (hasContracts && random() < 0.3) {
    return buildContractIntel(state, random);
  }
  if (hasBusiness && random() < 0.2) {
    return buildRaidIntel(state, random);
  }
  if (random() < 0.15) {
    return buildSafeRouteIntel(state, random);
  }
  if (random() < 0.25) {
    return buildSupplierIntel(state, random);
  }

  const city = CITY_MAP[state.player.currentCityId];
  const sellBias = rep >= 40 ? 0.55 : 0.4;
  const pool =
    random() < sellBias
      ? city?.demandDrugs?.length
        ? city.demandDrugs
        : COMMODITIES.map((c) => c.id)
      : city?.specialtyDrugs?.length
        ? city.specialtyDrugs
        : COMMODITIES.map((c) => c.id);
  const commodityId = pick(pool);
  const kind: IntelKind = random() < sellBias ? 'price_spike' : 'price_crash';
  const duration = rep >= 50 ? 3 : 2;
  return buildMarketIntel(state, kind, state.player.currentCityId, commodityId, duration, random);
}

export function seedHiddenIntel(
  state: GameState,
  count: number,
  random: () => number = Math.random
): GameState {
  const hidden = [...(state.hiddenOpportunities ?? [])];
  for (let i = 0; i < count && hidden.length < MAX_HIDDEN; i++) {
    hidden.push(pickIntelGenerator(state, random));
  }
  return { ...state, hiddenOpportunities: hidden.slice(0, MAX_HIDDEN) };
}

export function initializeIntelState(state: GameState): GameState {
  let updated = migrateIntelFromLegacy(state, state.activePriceTips ?? []);
  if ((updated.hiddenOpportunities ?? []).length === 0) {
    updated = seedHiddenIntel(updated, 4);
  }
  return updated;
}

function revealEntry(entry: IntelEntry, state: GameState, source?: IntelSource): IntelEntry {
  return {
    ...entry,
    revealed: true,
    discoveredDay: state.player.day,
    source: source ?? entry.source,
  };
}

export function addRevealedIntel(
  state: GameState,
  entry: IntelEntry,
  logMessage?: string
): GameState {
  const revealed = revealEntry(entry, state);
  const active = [...(state.activeIntel ?? []), revealed].slice(-MAX_ACTIVE);
  const hidden = (state.hiddenOpportunities ?? []).filter((h) => h.id !== entry.id);
  const next = { ...state, activeIntel: active, hiddenOpportunities: hidden };
  return logMessage ? withMessage(next, logMessage) : next;
}

export function revealNextHiddenIntel(
  state: GameState,
  source: IntelSource,
  logPrefix = 'Intel revealed'
): GameState {
  const hidden = state.hiddenOpportunities ?? [];
  if (hidden.length === 0) return state;
  const idx = Math.floor(Math.random() * hidden.length);
  const entry = hidden[idx]!;
  return addRevealedIntel(state, { ...entry, source }, `${logPrefix}: ${entry.message}`);
}

function intelRevealChance(state: GameState, source: IntelSource): number {
  const base = BASE_REVEAL_CHANCE[source] ?? 0.1;
  const scout = getSupplierScoutBonuses(state);
  const repBonus = state.player.reputation / 500;
  const scoutBonus = scout.reliability * 0.12;
  const crewBonus = (state.hiredCrew ?? []).some(
    (c) => c.status === 'hired' && c.role === 'lookout'
  )
    ? 0.04
    : 0;
  const dealerBonus = (state.hiredCrew ?? []).some(
    (c) => c.status === 'hired' && c.role === 'dealer'
  )
    ? 0.05
    : 0;
  return clamp(base + repBonus + scoutBonus + crewBonus + dealerBonus, 0, 0.85);
}

export function tryTriggerIntelReveal(
  state: GameState,
  source: IntelSource,
  random: () => number = Math.random
): GameState {
  if (state.player.isGameOver) return state;

  let updated = state;
  if ((updated.hiddenOpportunities ?? []).length < 3) {
    updated = seedHiddenIntel(updated, 2, random);
  }

  const chance = intelRevealChance(updated, source);
  if (random() > chance) return updated;

  if ((updated.hiddenOpportunities ?? []).length === 0) {
    updated = seedHiddenIntel(updated, 1, random);
  }

  return revealNextHiddenIntel(updated, source);
}

/** Reveal intel from a crew member on gather_intel assignment. */
export function tryRevealIntelFromCrew(state: GameState, crewName: string): GameState {
  if ((state.hiddenOpportunities ?? []).length === 0) {
    let updated = seedHiddenIntel(state, 1);
    if ((updated.hiddenOpportunities ?? []).length === 0) return state;
    state = updated;
  }
  const hidden = state.hiddenOpportunities ?? [];
  const entry = hidden[Math.floor(Math.random() * hidden.length)]!;
  return addRevealedIntel(
    state,
    { ...entry, source: 'crew' },
    `${crewName} tipped you off: ${entry.message}`
  );
}

export function revealInformantIntel(
  state: GameState,
  commodityId: CommodityId,
  cityId: string,
  areaId?: string
): GameState {
  const name = COMMODITY_MAP[commodityId]?.name ?? commodityId;
  const loc = getAreaLabel(cityId, areaId ?? `${cityId}_downtown`);
  const entry: IntelEntry = {
    id: uniqueId('intel_informant', state.player.day, Math.random),
    kind: 'market_buy',
    source: 'informant',
    message: `Informant tip: cheap ${name} around ${loc} for 2 days.`,
    createdDay: state.player.day,
    expiresDay: state.player.day + 2,
    revealed: true,
    discoveredDay: state.player.day,
    commodityId,
    cityId,
    areaId,
    direction: 'buy',
  };
  return addRevealedIntel(state, entry, `Intel revealed: ${entry.message}`);
}

export function revealMissionIntel(state: GameState, tip: PriceTip): GameState {
  const entry = priceTipToIntel(tip, true);
  return addRevealedIntel(
    state,
    { ...entry, source: 'mission' },
    `Mission intel: ${entry.message}`
  );
}

export function getIntelRevealTokenCount(state: GameState, profile?: PlayerProfile): number {
  const profileTokens = profile?.consumables.intelRevealTokens ?? 0;
  return (state.intelRevealTokens ?? 0) + profileTokens;
}

function consumeIntelRevealToken(
  state: GameState,
  profile: PlayerProfile
): { state: GameState; profile: PlayerProfile } | null {
  if ((state.intelRevealTokens ?? 0) > 0) {
    return {
      state: {
        ...state,
        intelRevealTokens: (state.intelRevealTokens ?? 0) - 1,
      },
      profile,
    };
  }
  const consumed = tryConsumeCredit(profile, 'intelRevealTokens');
  if (!consumed.ok) return null;
  return { state, profile: consumed.profile };
}

export function revealIntelWithToken(
  state: GameState,
  profile: PlayerProfile
): { state: GameState; profile: PlayerProfile } {
  if (getIntelRevealTokenCount(state, profile) <= 0) {
    return {
      state: withMessage(state, 'No intel reveal tokens available. Buy an Intel Pack in the Store.'),
      profile,
    };
  }

  const consumed = consumeIntelRevealToken(state, profile);
  if (!consumed) {
    return {
      state: withMessage(state, 'No intel reveal tokens available. Buy an Intel Pack in the Store.'),
      profile,
    };
  }

  let updated = consumed.state;
  let updatedProfile = consumed.profile;

  if ((updated.hiddenOpportunities ?? []).length === 0) {
    updated = seedHiddenIntel(updated, 2);
  }

  const hidden = updated.hiddenOpportunities ?? [];
  if (hidden.length > 0) {
    return {
      state: revealNextHiddenIntel(updated, 'intel_pack', 'Intel revealed'),
      profile: updatedProfile,
    };
  }

  const generated = pickIntelGenerator(updated, Math.random);
  const revealed = revealEntry({ ...generated, source: 'intel_pack' }, updated);
  return {
    state: addRevealedIntel(updated, revealed, `Intel revealed: ${revealed.message}`),
    profile: updatedProfile,
  };
}

export function tickIntelOnDayAdvance(state: GameState): GameState {
  const day = state.player.day;
  const stillActive: IntelEntry[] = [];
  const newlyExpired: IntelEntry[] = [];

  for (const entry of state.activeIntel ?? []) {
    if (entry.expiresDay >= day) {
      stillActive.push(entry);
    } else {
      newlyExpired.push(entry);
    }
  }

  const expiredIntel = [...newlyExpired, ...(state.expiredIntel ?? [])].slice(0, MAX_EXPIRED);
  let updated: GameState = {
    ...state,
    activeIntel: stillActive,
    expiredIntel,
    activePriceTips: [],
  };

  if ((updated.hiddenOpportunities ?? []).length < 4) {
    updated = seedHiddenIntel(updated, 2);
  }

  return updated;
}

export function getActiveIntel(state: GameState): IntelEntry[] {
  return (state.activeIntel ?? []).filter(
    (e) => e.revealed && e.expiresDay >= state.player.day
  );
}

export function getExpiredIntel(state: GameState): IntelEntry[] {
  return state.expiredIntel ?? [];
}

export function getTopActiveIntel(state: GameState): IntelEntry | undefined {
  return getActiveIntel(state)[0];
}

export function daysUntilIntelExpires(state: GameState, entry: IntelEntry): number {
  return Math.max(0, entry.expiresDay - state.player.day);
}

export function formatIntelEntry(entry: IntelEntry): string {
  return entry.message;
}

export function formatIntelSource(entry: IntelEntry): string {
  return INTEL_SOURCE_LABELS[entry.source] ?? entry.source;
}

export const INTEL_EMPTY_HUB =
  'No active intel. Get tips from informants, suppliers, crew, or Intel Packs.';
