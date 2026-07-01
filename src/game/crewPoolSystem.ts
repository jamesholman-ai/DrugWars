import { GameState } from '../types/game';
import { DistrictListing } from '../types/businesses';
import { CrewRecruitOffer } from '../types/crew';
import { CREW_TEMPLATES, CREW_TEMPLATE_MAP, CrewTemplate, templateToOffer } from '../data/crewCatalog';
import { DISTRICT_CREW_POOL_SIZE, DISTRICT_CREW_VISIBLE } from '../data/businessTemplates';
import { getRankBenefitsForState } from '../data/rankBenefits';
import { getAreaKey } from '../data/locations';
import { createSeededRandom } from '../utils/seededRandom';
import { hashCombine } from '../utils/hash';
import { clamp } from '../utils/random';
import { getRunSeed } from './businessPoolSystem';
import {
  generateCrewTemplate,
  getCrewPersonalityLine,
  getCrewSpecialty,
  parseGeneratedCrewTemplateId,
} from './crewGenerator';

const templateCache = new Map<string, CrewTemplate>();

function cacheTemplate(template: CrewTemplate): CrewTemplate {
  templateCache.set(template.id, template);
  return template;
}

export function resolveCrewTemplate(templateId: string, state: GameState): CrewTemplate | undefined {
  const staticTemplate = CREW_TEMPLATE_MAP[templateId];
  if (staticTemplate) return staticTemplate;

  const cached = templateCache.get(templateId);
  if (cached) return cached;

  const parsed = parseGeneratedCrewTemplateId(templateId);
  if (!parsed) return undefined;

  return cacheTemplate(
    generateCrewTemplate(
      parsed.cityId,
      parsed.areaId,
      parsed.seedIndex,
      getRunSeed(state),
      state.progression.rankId,
      state.player.reputation
    )
  );
}

function listingKey(cityId: string, areaId: string): string {
  return getAreaKey(cityId, areaId);
}

function shuffleIndices(count: number, random: () => number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function computeVisibleCrewTemplateIds(
  state: GameState,
  cityId: string,
  areaId: string,
  day: number,
  count: number
): string[] {
  const runSeed = getRunSeed(state);
  const rng = createSeededRandom(hashCombine(runSeed, cityId, areaId, 'crew-visible', day));
  const indices = shuffleIndices(DISTRICT_CREW_POOL_SIZE, rng);
  const visible: string[] = [];
  const used = new Set<string>();

  for (const index of indices) {
    if (visible.length >= count) break;
    const template = generateCrewTemplate(
      cityId,
      areaId,
      index,
      runSeed,
      state.progression.rankId,
      state.player.reputation
    );
    if (used.has(template.id)) continue;
    used.add(template.id);
    cacheTemplate(template);
    visible.push(template.id);
  }

  return visible;
}

export function buildCrewOffersFromListing(
  state: GameState,
  templateIds: string[]
): CrewRecruitOffer[] {
  const runSeed = getRunSeed(state);
  const offers: CrewRecruitOffer[] = [];

  for (const templateId of templateIds) {
    const template =
      resolveCrewTemplate(templateId, state) ??
      CREW_TEMPLATE_MAP[templateId];
    if (!template) continue;
    if (template.cityId !== state.player.currentCityId || template.areaId !== state.player.currentAreaId) {
      continue;
    }
    const offer = templateToOffer(template, state.player.day);
    offers.push({
      ...offer,
      personalityLine: getCrewPersonalityLine(templateId, runSeed),
      specialty: getCrewSpecialty(template.role, parseGeneratedCrewTemplateId(templateId)?.seedIndex ?? 0, runSeed),
      morale: clamp(template.loyalty - 5, 35, 90),
      stress: clamp(20 + template.riskTraits.length * 8, 15, 70),
    });
  }

  return offers;
}

export function refreshCrewListing(state: GameState, options: { force?: boolean } = {}): GameState {
  const { player } = state;
  const key = listingKey(player.currentCityId, player.currentAreaId);
  const listings = { ...(state.districtCrewListings ?? {}) };
  const existing = listings[key];
  const benefits = getRankBenefitsForState(state);
  const count = clamp(benefits.crewRecruitCount, 15, DISTRICT_CREW_VISIBLE);

  if (!options.force && existing && existing.refreshDay === player.day) {
    return state;
  }

  const visibleIds = computeVisibleCrewTemplateIds(
    state,
    player.currentCityId,
    player.currentAreaId,
    player.day,
    count
  );

  listings[key] = { refreshDay: player.day, visibleIds };
  return { ...state, districtCrewListings: listings };
}

export function refreshAllCrewListingsOnDayAdvance(state: GameState): GameState {
  return refreshCrewListing({ ...state, districtCrewListings: {} }, { force: true });
}

export function migrateDistrictCrewListings(raw: unknown): Record<string, DistrictListing> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const result: Record<string, DistrictListing> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (typeof entry.refreshDay !== 'number' || !Array.isArray(entry.visibleIds)) continue;
    result[key] = {
      refreshDay: entry.refreshDay,
      visibleIds: entry.visibleIds.filter((id): id is string => typeof id === 'string'),
    };
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function getStaticCrewAtLocation(cityId: string, areaId: string): CrewTemplate[] {
  return CREW_TEMPLATES.filter((t) => t.cityId === cityId && t.areaId === areaId);
}
