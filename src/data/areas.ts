import { CityAreaDefinition, CommodityId } from '../types/game';

type AreaOpts = Partial<
  Omit<CityAreaDefinition, 'id' | 'name' | 'cityId'>
> & {
  description: string;
  travelCost?: number;
  healCost?: number;
};

function riskToModifier(level: number): number {
  return 0.75 + level * 0.12;
}

function a(
  cityId: string,
  slug: string,
  name: string,
  riskLevel: CityAreaDefinition['riskLevel'],
  opts: AreaOpts
): CityAreaDefinition {
  return {
    id: `${cityId}_${slug}`,
    cityId,
    name,
    riskLevel,
    riskModifier: opts.riskModifier ?? riskToModifier(riskLevel),
    priceModifier: opts.priceModifier ?? 1,
    travelCost: opts.travelCost ?? 20 + riskLevel * 5,
    healCost: opts.healCost ?? 200 + riskLevel * 40,
    policePresence: opts.policePresence ?? 30 + riskLevel * 8,
    cartelInfluence: opts.cartelInfluence ?? 25 + riskLevel * 5,
    rivalInfluence: opts.rivalInfluence ?? 30 + riskLevel * 6,
    demandModifiers: opts.demandModifiers ?? {},
    description: opts.description,
  };
}

const NY: CityAreaDefinition[] = [
  a('new_york', 'downtown', 'Downtown', 3, {
    description: 'Glass towers and back-alley handoffs. High rollers, high prices.',
    policePresence: 55,
    cartelInfluence: 25,
    rivalInfluence: 40,
    demandModifiers: { cocaine: 1.2, heroin: 1.1, ecstasy: 1.1 },
  }),
  a('new_york', 'harbor', 'Harbor', 3, {
    description: 'Dockside lanes and container networks. Import prices swing.',
    policePresence: 50,
    cartelInfluence: 40,
    rivalInfluence: 35,
    demandModifiers: { heroin: 1.1, meth: 1.15, cocaine: 0.9, hashish: 1.05 },
  }),
  a('new_york', 'club_district', 'Club District', 2, {
    description: 'Neon clubs and VIP rooms. Party product moves fast.',
    policePresence: 42,
    rivalInfluence: 45,
    demandModifiers: { ecstasy: 1.35, mdma: 1.3, cocaine: 1.15, ketamine: 1.2 },
  }),
  a('new_york', 'brooklyn', 'Brooklyn', 3, {
    description: 'Residential blocks and warehouse stashes across the bridge.',
    policePresence: 40,
    rivalInfluence: 50,
    demandModifiers: { weed: 1.2, crack: 1.15, heroin: 1.1 },
  }),
];

const MIAMI: CityAreaDefinition[] = [
  a('miami', 'downtown', 'Downtown', 3, {
    description: 'Finance towers and nightlife money. Cocaine premium.',
    policePresence: 48,
    cartelInfluence: 45,
    demandModifiers: { cocaine: 1.25, mdma: 1.1 },
  }),
  a('miami', 'port', 'Port', 4, {
    description: 'Container yards and smuggler routes. Bulk import prices.',
    policePresence: 60,
    cartelInfluence: 55,
    demandModifiers: { cocaine: 0.75, meth: 1.3, heroin: 0.8 },
  }),
  a('miami', 'south_beach', 'South Beach', 2, {
    description: 'Neon clubs and tourist wallets. Party drugs spike.',
    policePresence: 38,
    rivalInfluence: 35,
    demandModifiers: { ecstasy: 1.35, mdma: 1.3, ketamine: 1.2 },
  }),
  a('miami', 'little_havana', 'Little Havana', 3, {
    description: 'Cuban corridors and cartel whispers. Tight community.',
    policePresence: 35,
    cartelInfluence: 50,
    rivalInfluence: 45,
    demandModifiers: { crack: 1.1, weed: 0.9 },
  }),
];

const LA: CityAreaDefinition[] = [
  a('los_angeles', 'downtown', 'Downtown', 3, {
    description: 'Skid row to skyscrapers. Everything has a price.',
    policePresence: 52,
    cartelInfluence: 40,
    demandModifiers: { cocaine: 1.2, meth: 1.15 },
  }),
  a('los_angeles', 'hollywood', 'Hollywood', 2, {
    description: 'Studio parties and celebrity excess. Pills and powder.',
    policePresence: 45,
    demandModifiers: { cocaine: 1.3, ecstasy: 1.25, ketamine: 1.2 },
  }),
  a('los_angeles', 'harbor', 'Harbor', 4, {
    description: 'Long Beach lanes. Import meth and heroin cheap.',
    policePresence: 58,
    cartelInfluence: 50,
    demandModifiers: { meth: 1.3, heroin: 0.75, cocaine: 0.85 },
  }),
  a('los_angeles', 'compton', 'Compton', 5, {
    description: 'Gang territories and street wars. High risk, high volume.',
    policePresence: 38,
    rivalInfluence: 70,
    cartelInfluence: 30,
    demandModifiers: { crack: 1.25, weed: 1.2, heroin: 1.15 },
  }),
];

function cityPack(
  cityId: string,
  districts: [string, string, number, AreaOpts][]
): CityAreaDefinition[] {
  return districts.map(([slug, name, risk, opts]) => a(cityId, slug, name, risk as 1 | 2 | 3 | 4 | 5, opts));
}

const OTHER_CITIES: CityAreaDefinition[] = [
  ...cityPack('detroit', [
    ['downtown', 'Downtown', 3, { description: 'Empty towers and desperate trade.', demandModifiers: { crack: 1.2, heroin: 1.15 } }],
    ['industrial_zone', 'Industrial Zone', 4, { description: 'Abandoned plants and rail lines.', demandModifiers: { meth: 0.7, heroin: 0.75 } }],
    ['warehouse_row', 'Warehouse Row', 3, { description: 'Bulk storage and quiet handoffs.', demandModifiers: { meth: 1.1, cocaine: 0.85 } }],
    ['east_side', 'East Side', 4, { description: 'Hard blocks. Crews run the corners.', rivalInfluence: 65, demandModifiers: { crack: 1.25 } }],
  ]),
  ...cityPack('chicago', [
    ['downtown', 'The Loop', 3, { description: 'Loop money and lakefront deals.', demandModifiers: { cocaine: 1.15 } }],
    ['south_side', 'South Side', 4, { description: 'Gang territories on the south side.', rivalInfluence: 62, demandModifiers: { crack: 1.2, heroin: 1.1 } }],
    ['west_loop', 'West Loop', 2, { description: 'Trendy lofts and hidden parties.', demandModifiers: { mdma: 1.2, cocaine: 1.1 } }],
    ['ohare', 'O\'Hare Corridor', 3, { description: 'Airport hub. Import prices swing.', policePresence: 55, demandModifiers: { cocaine: 1.25, heroin: 1.2 } }],
  ]),
  ...cityPack('atlanta', [
    ['downtown', 'Downtown', 3, { description: 'Trap capital skyline.', demandModifiers: { weed: 0.85, mdma: 1.1 } }],
    ['buckhead', 'Buckhead', 2, { description: 'Money district. Premium product.', demandModifiers: { cocaine: 1.25 } }],
    ['zone_6', 'Zone 6', 4, { description: 'Street fame and loud corners.', rivalInfluence: 58, demandModifiers: { crack: 1.15, weed: 0.8 } }],
    ['airport', 'Airport', 3, { description: 'Hartsfield hub. High customs heat.', policePresence: 58, demandModifiers: { cocaine: 1.2 } }],
  ]),
  ...cityPack('las_vegas', [
    ['strip', 'The Strip', 2, { description: 'Casino floors and VIP rooms.', demandModifiers: { ecstasy: 1.4, cocaine: 1.3, ketamine: 1.25 } }],
    ['downtown', 'Downtown Vegas', 3, { description: 'Off-strip motels and back rooms.', demandModifiers: { meth: 1.1 } }],
    ['industrial_park', 'Industrial Park', 3, { description: 'Warehouse district. Lower profile moves.', demandModifiers: { meth: 1.15, crack: 1.05 } }],
    ['suburbs', 'Suburbs', 2, { description: 'Sprawl and quiet deals.', policePresence: 32, demandModifiers: { weed: 0.9 } }],
  ]),
  ...cityPack('seattle', [
    ['downtown', 'Downtown', 2, { description: 'Tech money meets grey markets.', demandModifiers: { lsd: 0.85, mushrooms: 0.8 } }],
    ['capitol_hill', 'Capitol Hill', 2, { description: 'Rain and rave culture.', demandModifiers: { weed: 0.75, mdma: 1.1 } }],
    ['port', 'Port', 3, { description: 'Harbor imports. Hash and heroin.', demandModifiers: { hashish: 0.7, heroin: 0.8 } }],
    ['suburbs', 'Suburbs', 1, { description: 'Quiet deals. Lower heat.', policePresence: 30, demandModifiers: { weed: 1.05 } }],
  ]),
  ...cityPack('austin', [
    ['downtown', 'Downtown', 2, { description: 'Live music and festival crowds.', demandModifiers: { mdma: 1.15, mushrooms: 0.85 } }],
    ['east_side', 'East Side', 3, { description: 'Gentrifying blocks. New money.', demandModifiers: { cocaine: 1.1, weed: 0.9 } }],
    ['campus', 'Campus', 2, { description: 'University strip. Cheap party drugs.', demandModifiers: { weed: 0.7, lsd: 0.75, ecstasy: 0.85 } }],
    ['airport', 'Airport', 3, { description: 'SXSW traffic hub.', policePresence: 48 }],
  ]),
  ...cityPack('boston', [
    ['downtown', 'Downtown', 3, { description: 'Harvard money and harbor fog.', demandModifiers: { cocaine: 1.15, lsd: 0.9 } }],
    ['cambridge', 'Cambridge', 2, { description: 'Campus labs and dorm deals.', demandModifiers: { lsd: 0.75, mushrooms: 0.8, weed: 0.85 } }],
    ['harbor', 'Harbor', 3, { description: 'Dockside imports.', demandModifiers: { heroin: 0.85, hashish: 0.9 } }],
    ['south_end', 'South End', 3, { description: 'Mixed blocks. Steady trade.', demandModifiers: { heroin: 1.1 } }],
  ]),
  ...cityPack('san_francisco', [
    ['downtown', 'Downtown', 2, { description: 'Tech IPO cash. Premium everything.', demandModifiers: { cocaine: 1.25, ketamine: 1.15 } }],
    ['mission', 'The Mission', 3, { description: 'Latino corridors and cartel ties.', cartelInfluence: 45, demandModifiers: { crack: 1.1 } }],
    ['hunters_point', 'Hunter\'s Point', 4, { description: 'Industrial bay. Hard streets.', rivalInfluence: 55, demandModifiers: { crack: 1.2 } }],
    ['port', 'Port', 3, { description: 'Bay imports. Bulk lanes.', demandModifiers: { meth: 1.15, heroin: 0.8 } }],
  ]),
  ...cityPack('toronto', [
    ['downtown', 'Downtown', 3, { description: 'CN Tower shadows and back alleys.', demandModifiers: { cocaine: 1.1, ketamine: 1.05 } }],
    ['scarborough', 'Scarborough', 3, { description: 'Suburban sprawl. Crew blocks.', rivalInfluence: 50 }],
    ['port', 'Port', 3, { description: 'Lake Ontario lanes.', demandModifiers: { hashish: 0.8, heroin: 0.85 } }],
    ['kensington', 'Kensington', 2, { description: 'Market district. Weed culture.', demandModifiers: { weed: 0.75, hashish: 0.8 } }],
  ]),
  ...cityPack('london', [
    ['central', 'Central', 3, { description: 'City money. Import markups brutal.', demandModifiers: { cocaine: 1.3, hashish: 1.1 } }],
    ['east_end', 'East End', 4, { description: 'Old gang corridors.', rivalInfluence: 58, demandModifiers: { crack: 1.15 } }],
    ['docklands', 'Docklands', 3, { description: 'Thames imports.', demandModifiers: { heroin: 0.85, hashish: 0.75 } }],
    ['south', 'South London', 3, { description: 'Sprawl and street trade.', demandModifiers: { weed: 1.05 } }],
  ]),
  ...cityPack('paris', [
    ['central', 'Central', 3, { description: 'Fashion district markups.', demandModifiers: { cocaine: 1.25, ketamine: 1.15 } }],
    ['banlieue', 'Banlieue', 4, { description: 'Outer rings. High tension.', rivalInfluence: 55, policePresence: 48 }],
    ['port', 'Port', 3, { description: 'Channel imports.', demandModifiers: { hashish: 0.8 } }],
    ['montmartre', 'Montmartre', 2, { description: 'Tourist nightlife.', demandModifiers: { ecstasy: 1.2, mdma: 1.15 } }],
  ]),
  ...cityPack('amsterdam', [
    ['centrum', 'Centrum', 2, { description: 'Coffee shops and canals. Weed cheap.', demandModifiers: { weed: 0.65, hashish: 0.7 } }],
    ['jordaan', 'Jordaan', 2, { description: 'Local trade. Low profile.', demandModifiers: { mushrooms: 0.75, ecstasy: 0.9 } }],
    ['port', 'Port', 3, { description: 'North Sea lanes.', demandModifiers: { cocaine: 0.9, heroin: 0.85 } }],
    ['red_light', 'Red Light', 3, { description: 'Tourist district. Party product.', demandModifiers: { ecstasy: 1.15, cocaine: 1.1 } }],
  ]),
];

export const CITY_AREAS: CityAreaDefinition[] = [
  ...NY,
  ...MIAMI,
  ...LA,
  ...OTHER_CITIES,
];

export const CITY_AREA_MAP = Object.fromEntries(
  CITY_AREAS.map((area) => [area.id, area])
) as Record<string, CityAreaDefinition>;

export const AREAS_BY_CITY: Record<string, CityAreaDefinition[]> = CITY_AREAS.reduce<
  Record<string, CityAreaDefinition[]>
>((acc, area) => {
  if (!acc[area.cityId]) acc[area.cityId] = [];
  acc[area.cityId].push(area);
  return acc;
}, {});

/** @deprecated Use CITY_AREAS — kept for imports that expect AREAS */
export const AREAS = CITY_AREAS;

export const AREA_MAP = CITY_AREA_MAP;

export const STARTING_AREA_ID = 'new_york_downtown';

/** Legacy generic area ids from pre-Phase-6 saves → slug within city. */
export const LEGACY_AREA_SLUG: Record<string, string> = {
  downtown: 'downtown',
  club_district: 'club_district',
  industrial_zone: 'industrial_zone',
  suburbs: 'suburbs',
  college_area: 'campus',
  airport: 'airport',
  harbor: 'harbor',
  port: 'harbor',
  centrum: 'centrum',
  central: 'central',
  beach_district: 'south_beach',
  south_beach: 'south_beach',
  south_central: 'compton',
  compton: 'compton',
  industrial: 'industrial_zone',
  southwest: 'warehouse_row',
  warehouse_row: 'warehouse_row',
  north_vegas: 'industrial_park',
  industrial_park: 'industrial_park',
  harlem: 'brooklyn',
  queens: 'harbor',
  bronx: 'brooklyn',
};

/** City-specific slug overrides when generic slug missing. */
export const LEGACY_CITY_SLUG: Record<string, Record<string, string>> = {
  new_york: {
    suburbs: 'brooklyn',
    club_district: 'club_district',
    harbor: 'harbor',
    harlem: 'brooklyn',
    queens: 'harbor',
    bronx: 'brooklyn',
    industrial_zone: 'harbor',
  },
  miami: { harbor: 'port', club_district: 'south_beach', beach_district: 'south_beach', industrial_zone: 'port' },
  los_angeles: { harbor: 'harbor', port: 'harbor', club_district: 'hollywood', industrial_zone: 'compton', south_central: 'compton' },
  las_vegas: { club_district: 'strip', north_vegas: 'industrial_park', airport: 'suburbs', downtown: 'downtown' },
  atlanta: { club_district: 'zone_6', airport: 'zone_6' },
  detroit: { industrial_zone: 'industrial_zone', industrial: 'industrial_zone', southwest: 'warehouse_row' },
  london: { downtown: 'central' },
  paris: { downtown: 'central' },
  amsterdam: { downtown: 'centrum' },
  toronto: { downtown: 'downtown' },
  chicago: { airport: 'ohare', ohare: 'ohare' },
};

export function getAreasForCity(cityId: string): CityAreaDefinition[] {
  return AREAS_BY_CITY[cityId] ?? [];
}

export function getDefaultAreaForCity(cityId: string): CityAreaDefinition | undefined {
  const areas = getAreasForCity(cityId);
  return areas.find((a) => a.id.endsWith('_downtown') || a.id.endsWith('_centrum') || a.id.endsWith('_central')) ?? areas[0];
}

export function resolveAreaIdForCity(cityId: string, areaIdOrLegacy: string): string {
  if (CITY_AREA_MAP[areaIdOrLegacy]?.cityId === cityId) {
    return areaIdOrLegacy;
  }
  if (CITY_AREA_MAP[areaIdOrLegacy]) {
    return getDefaultAreaForCity(cityId)?.id ?? STARTING_AREA_ID;
  }

  const cityOverrides = LEGACY_CITY_SLUG[cityId] ?? {};
  const stripped = areaIdOrLegacy.startsWith(`${cityId}_`)
    ? areaIdOrLegacy.slice(cityId.length + 1)
    : areaIdOrLegacy;
  const slug = cityOverrides[stripped] ?? cityOverrides[areaIdOrLegacy] ?? LEGACY_AREA_SLUG[stripped] ?? LEGACY_AREA_SLUG[areaIdOrLegacy] ?? stripped;

  const areas = getAreasForCity(cityId);
  const exact = areas.find((a) => a.id === `${cityId}_${slug}` || a.id.endsWith(`_${slug}`));
  if (exact) return exact.id;

  const partial = areas.find((a) => a.id.includes(slug));
  if (partial) return partial.id;

  return getDefaultAreaForCity(cityId)?.id ?? STARTING_AREA_ID;
}

export function getCurrentArea(player: {
  currentCityId: string;
  currentAreaId: string;
}): CityAreaDefinition | undefined {
  const area = CITY_AREA_MAP[player.currentAreaId];
  if (area?.cityId === player.currentCityId) return area;
  return getAreasForCity(player.currentCityId).find((a) => a.id === player.currentAreaId);
}

export function isAirportArea(areaId: string): boolean {
  return areaId.includes('airport') || areaId.includes('ohare');
}

export function isPortArea(areaId: string): boolean {
  return areaId.includes('port') || areaId.includes('harbor') || areaId.includes('dock');
}

export function getTravelHubAreaId(cityId: string): string {
  const areas = getAreasForCity(cityId);
  const airport = areas.find((a) => isAirportArea(a.id));
  if (airport) return airport.id;
  const port = areas.find((a) => isPortArea(a.id));
  if (port) return port.id;
  return getDefaultAreaForCity(cityId)?.id ?? `${cityId}_downtown`;
}

export function getTopDemandDrugs(area: CityAreaDefinition, limit = 2): string[] {
  return Object.entries(area.demandModifiers)
    .filter(([, mod]) => mod >= 1.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
