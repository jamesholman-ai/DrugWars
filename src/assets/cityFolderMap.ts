/** Maps in-game city ids (snake_case) to assets/art/cities folder names (PascalCase). */
export const CITY_ID_TO_FOLDER: Record<string, string> = {
  new_york: 'NewYork',
  miami: 'Miami',
  los_angeles: 'LosAngeles',
  chicago: 'Chicago',
  detroit: 'Detroit',
  las_vegas: 'LasVegas',
  seattle: 'Seattle',
  atlanta: 'Atlanta',
  houston: 'Houston',
  toronto: 'Toronto',
  new_orleans: 'NewOrleans',
  phoenix: 'Phoenix',
  boston: 'Boston',
  philadelphia: 'Philadelphia',
  washington_dc: 'WashingtonDC',
  san_francisco: 'SanFrancisco',
  austin: 'Boston',
  london: 'Boston',
  paris: 'Boston',
  amsterdam: 'Boston',
};

export const ART_CITY_FOLDERS = [
  'NewYork',
  'Miami',
  'LosAngeles',
  'Chicago',
  'Detroit',
  'LasVegas',
  'Seattle',
  'Atlanta',
  'Houston',
  'Toronto',
  'Phoenix',
  'NewOrleans',
  'Boston',
  'Philadelphia',
  'WashingtonDC',
  'SanFrancisco',
] as const;

export type ArtCityFolder = (typeof ART_CITY_FOLDERS)[number];

export function cityIdToFolder(cityId: string): string | undefined {
  return CITY_ID_TO_FOLDER[cityId];
}

export function folderToDisplayName(folder: string): string {
  const names: Record<string, string> = {
    NewYork: 'New York',
    LosAngeles: 'Los Angeles',
    LasVegas: 'Las Vegas',
    NewOrleans: 'New Orleans',
    WashingtonDC: 'Washington DC',
    SanFrancisco: 'San Francisco',
  };
  return names[folder] ?? folder;
}

/** Strip city prefix from area id for district filename matching. */
export function areaIdToDistrictSlug(cityId: string, areaId: string): string {
  const prefix = `${cityId}_`;
  if (areaId.startsWith(prefix)) return areaId.slice(prefix.length);
  return areaId;
}
