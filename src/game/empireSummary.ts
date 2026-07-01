import { GameState } from '../types/game';
import { CITIES } from '../data/locations';
import { getRunSeed } from './businessPoolSystem';
import { resolvePropertyDefinition } from './propertyPoolSystem';
import { resolveBusinessDefinition } from './businessPoolSystem';

export interface CityEmpireSummary {
  ownedProperties: number;
  ownedBusinesses: number;
  rentListings: number;
  buyListings: number;
  hint: string;
}

export function getCityEmpireSummary(state: GameState, cityId: string): CityEmpireSummary {
  const runSeed = getRunSeed(state);

  const ownedProperties = (state.ownedSafehouses ?? []).filter((o) => {
    const def = resolvePropertyDefinition(o.safehouseId, runSeed);
    return def?.cityId === cityId;
  }).length;

  const ownedBusinesses = (state.ownedBusinesses ?? []).filter((o) => {
    const def = resolveBusinessDefinition(o.businessId, runSeed);
    return def?.cityId === cityId;
  }).length;

  const propListings = Object.entries(state.districtPropertyListings ?? {}).filter(([key]) =>
    key.startsWith(`${cityId}:`)
  ).reduce((sum, [, listing]) => sum + (listing?.visibleIds?.length ?? 0), 0);

  const bizListings = Object.entries(state.districtBusinessListings ?? {}).filter(([key]) =>
    key.startsWith(`${cityId}:`)
  ).reduce((sum, [, listing]) => sum + (listing?.visibleIds?.length ?? 0), 0);

  let hint = 'Browse Empire for properties & businesses.';
  if (ownedProperties > 0 && ownedBusinesses > 0) {
    hint = `${ownedProperties} propert${ownedProperties === 1 ? 'y' : 'ies'}, ${ownedBusinesses} business${ownedBusinesses === 1 ? '' : 'es'} owned. Manage on Empire.`;
  } else if (ownedProperties > 0) {
    hint = `${ownedProperties} propert${ownedProperties === 1 ? 'y' : 'ies'} owned — manage on Empire.`;
  } else if (ownedBusinesses > 0) {
    hint = `${ownedBusinesses} business${ownedBusinesses === 1 ? '' : 'es'} owned — manage on Empire.`;
  } else if (propListings + bizListings > 0) {
    hint = 'Listings available — buy/rent on Properties & Businesses screens.';
  }

  return {
    ownedProperties,
    ownedBusinesses,
    rentListings: propListings,
    buyListings: bizListings,
    hint,
  };
}

export function formatCityEmpireLine(summary: CityEmpireSummary): string {
  const parts: string[] = [];
  if (summary.ownedProperties > 0) parts.push(`${summary.ownedProperties} properties`);
  if (summary.ownedBusinesses > 0) parts.push(`${summary.ownedBusinesses} businesses`);
  if (parts.length === 0 && summary.rentListings + summary.buyListings > 0) {
    return 'Listings available — see Empire screens';
  }
  return parts.length ? parts.join(' · ') : 'No empire assets here';
}

/** Assert every city in CITIES has exactly 4 areas. */
export function assertFourAreasPerCity(getAreas: (cityId: string) => unknown[]): void {
  for (const city of CITIES) {
    const count = getAreas(city.id).length;
    if (count !== 4) {
      throw new Error(`${city.id} has ${count} areas, expected 4`);
    }
  }
}
