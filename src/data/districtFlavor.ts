import { isAirportArea, isPortArea } from './areas';

export type DistrictArchetype =
  | 'downtown'
  | 'harbor'
  | 'industrial'
  | 'club_district'
  | 'college'
  | 'suburbs'
  | 'airport'
  | 'general';

const CLUB_SLUGS = ['strip', 'south_beach', 'beach', 'red_light', 'montmartre', 'hollywood', 'zone_6', 'buckhead', 'club_district'];
const COLLEGE_SLUGS = ['campus', 'cambridge', 'capitol_hill'];
const SUBURB_SLUGS = ['suburb', 'suburbs', 'north_vegas', 'scarborough', 'southwest', 'jordaan', 'kensington'];
const INDUSTRIAL_SLUGS = ['industrial', 'industrial_zone', 'industrial_park', 'warehouse_row', 'hunters_point', 'compton', 'east_side', 'banlieue'];

function slugFromAreaId(areaId: string): string {
  const idx = areaId.indexOf('_');
  return idx >= 0 ? areaId.slice(idx + 1) : areaId;
}

export function getDistrictArchetype(areaId: string): DistrictArchetype {
  if (isAirportArea(areaId)) return 'airport';
  if (isPortArea(areaId)) return 'harbor';

  const slug = slugFromAreaId(areaId);

  if (INDUSTRIAL_SLUGS.some((s) => slug.includes(s))) return 'industrial';
  if (CLUB_SLUGS.some((s) => slug.includes(s))) return 'club_district';
  if (COLLEGE_SLUGS.some((s) => slug.includes(s))) return 'college';
  if (SUBURB_SLUGS.some((s) => slug.includes(s))) return 'suburbs';
  if (
    slug.includes('downtown') ||
    slug.includes('central') ||
    slug.includes('centrum') ||
    slug.includes('loop') ||
    slug.includes('west_loop')
  ) {
    return 'downtown';
  }

  return 'general';
}

/** Crew role weights per district archetype (higher = more common). */
export const CREW_ROLE_WEIGHTS: Record<
  DistrictArchetype,
  Partial<Record<
    import('../types/crew').CrewRole,
    number
  >>
> = {
  harbor: { smuggler: 4, supplier_scout: 3, enforcer: 2, runner: 2 },
  downtown: { accountant: 3, fixer: 3, dealer: 2, lookout: 1 },
  club_district: { dealer: 4, lookout: 3, fixer: 2, runner: 1 },
  industrial: { enforcer: 4, runner: 3, smuggler: 2 },
  college: { runner: 4, dealer: 3, lookout: 2 },
  airport: { smuggler: 4, fixer: 2, supplier_scout: 3 },
  suburbs: { accountant: 3, lookout: 3, runner: 2 },
  general: { runner: 2, lookout: 2, dealer: 2, enforcer: 1, fixer: 1 },
};
