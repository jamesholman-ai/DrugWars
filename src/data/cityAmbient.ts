import { AccentTone } from '../theme/theme';

export interface CityAmbientProfile {
  accent: AccentTone;
  skyline: string;
  tagline: string;
  crimeLevel: 'low' | 'moderate' | 'high' | 'extreme';
  wealthLevel: 'poor' | 'working' | 'affluent' | 'luxury';
  policePresence: 'light' | 'moderate' | 'heavy' | 'crackdown';
  cartelInfluence: 'minimal' | 'present' | 'strong' | 'dominant';
  economyRating: 'depressed' | 'stable' | 'booming' | 'overheated';
  nightlifeRating: 'dead' | 'quiet' | 'vibrant' | 'legendary';
}

const DEFAULT: CityAmbientProfile = {
  accent: 'cyan',
  skyline: '🏙',
  tagline: 'Streets never sleep.',
  crimeLevel: 'moderate',
  wealthLevel: 'working',
  policePresence: 'moderate',
  cartelInfluence: 'present',
  economyRating: 'stable',
  nightlifeRating: 'vibrant',
};

export const CITY_AMBIENT: Record<string, CityAmbientProfile> = {
  new_york: {
    accent: 'cyan',
    skyline: '🌃',
    tagline: 'Five boroughs. Infinite angles.',
    crimeLevel: 'high',
    wealthLevel: 'affluent',
    policePresence: 'heavy',
    cartelInfluence: 'present',
    economyRating: 'overheated',
    nightlifeRating: 'legendary',
  },
  miami: {
    accent: 'amber',
    skyline: '🌴',
    tagline: 'Neon coast. Cartel money.',
    crimeLevel: 'high',
    wealthLevel: 'luxury',
    policePresence: 'moderate',
    cartelInfluence: 'strong',
    economyRating: 'booming',
    nightlifeRating: 'legendary',
  },
  atlanta: {
    accent: 'purple',
    skyline: '🎵',
    tagline: 'Trap roots. Southern hustle.',
    crimeLevel: 'moderate',
    wealthLevel: 'working',
    policePresence: 'moderate',
    cartelInfluence: 'present',
    economyRating: 'stable',
    nightlifeRating: 'vibrant',
  },
  chicago: {
    accent: 'neutral',
    skyline: '🏭',
    tagline: 'Wind, steel, and street politics.',
    crimeLevel: 'extreme',
    wealthLevel: 'working',
    policePresence: 'heavy',
    cartelInfluence: 'strong',
    economyRating: 'depressed',
    nightlifeRating: 'vibrant',
  },
  los_angeles: {
    accent: 'amber',
    skyline: '🌅',
    tagline: 'Freeways, fame, and freight.',
    crimeLevel: 'high',
    wealthLevel: 'luxury',
    policePresence: 'moderate',
    cartelInfluence: 'dominant',
    economyRating: 'booming',
    nightlifeRating: 'legendary',
  },
  las_vegas: {
    accent: 'purple',
    skyline: '🎰',
    tagline: 'What happens here funds everything.',
    crimeLevel: 'moderate',
    wealthLevel: 'luxury',
    policePresence: 'light',
    cartelInfluence: 'present',
    economyRating: 'overheated',
    nightlifeRating: 'legendary',
  },
  detroit: {
    accent: 'red',
    skyline: '⚙',
    tagline: 'Industrial grit. Hard money.',
    crimeLevel: 'extreme',
    wealthLevel: 'poor',
    policePresence: 'moderate',
    cartelInfluence: 'minimal',
    economyRating: 'depressed',
    nightlifeRating: 'quiet',
  },
  miami_port: {
    accent: 'amber',
    skyline: '🚢',
    tagline: 'Containers and customs.',
    crimeLevel: 'high',
    wealthLevel: 'affluent',
    policePresence: 'heavy',
    cartelInfluence: 'dominant',
    economyRating: 'booming',
    nightlifeRating: 'quiet',
  },
  london: {
    accent: 'cyan',
    skyline: '🌧',
    tagline: 'Old money. New heat.',
    crimeLevel: 'moderate',
    wealthLevel: 'luxury',
    policePresence: 'heavy',
    cartelInfluence: 'minimal',
    economyRating: 'stable',
    nightlifeRating: 'vibrant',
  },
  seattle: {
    accent: 'green',
    skyline: '🌲',
    tagline: 'Rain hides everything.',
    crimeLevel: 'low',
    wealthLevel: 'affluent',
    policePresence: 'moderate',
    cartelInfluence: 'minimal',
    economyRating: 'booming',
    nightlifeRating: 'quiet',
  },
};

export function getCityAmbient(cityId: string): CityAmbientProfile {
  return CITY_AMBIENT[cityId] ?? DEFAULT;
}

export function formatAmbientLevel(label: string, value: string): string {
  return `${label}: ${value.replace(/_/g, ' ')}`;
}
