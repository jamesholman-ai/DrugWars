import { Commodity, CommodityId } from '../types/game';

export const COMMODITIES: Commodity[] = [
  { id: 'weed', name: 'Weed', minPrice: 25, maxPrice: 140, volatility: 0.55, riskLevel: 1 },
  { id: 'cocaine', name: 'Cocaine', minPrice: 450, maxPrice: 1800, volatility: 0.65, riskLevel: 4 },
  { id: 'crack', name: 'Crack', minPrice: 280, maxPrice: 2200, volatility: 0.7, riskLevel: 4 },
  { id: 'heroin', name: 'Heroin', minPrice: 400, maxPrice: 2800, volatility: 0.68, riskLevel: 5 },
  { id: 'ecstasy', name: 'Ecstasy', minPrice: 35, maxPrice: 220, volatility: 0.6, riskLevel: 2 },
  { id: 'lsd', name: 'LSD', minPrice: 80, maxPrice: 480, volatility: 0.62, riskLevel: 2 },
  { id: 'mushrooms', name: 'Mushrooms', minPrice: 40, maxPrice: 260, volatility: 0.58, riskLevel: 2 },
  { id: 'meth', name: 'Meth', minPrice: 120, maxPrice: 950, volatility: 0.72, riskLevel: 4 },
  { id: 'ketamine', name: 'Ketamine', minPrice: 90, maxPrice: 620, volatility: 0.6, riskLevel: 3 },
  { id: 'mdma', name: 'MDMA', minPrice: 40, maxPrice: 240, volatility: 0.58, riskLevel: 2 },
  { id: 'hashish', name: 'Hashish', minPrice: 50, maxPrice: 320, volatility: 0.52, riskLevel: 2 },
  { id: 'opium', name: 'Opium', minPrice: 200, maxPrice: 1200, volatility: 0.64, riskLevel: 4 },
  { id: 'morphine', name: 'Morphine', minPrice: 350, maxPrice: 1800, volatility: 0.66, riskLevel: 4 },
  { id: 'pcp', name: 'PCP', minPrice: 150, maxPrice: 780, volatility: 0.63, riskLevel: 3 },
  { id: 'speed', name: 'Speed', minPrice: 60, maxPrice: 420, volatility: 0.57, riskLevel: 2 },
];

export const COMMODITY_MAP = Object.fromEntries(
  COMMODITIES.map((c) => [c.id, c])
) as Record<CommodityId, Commodity>;

/** Legacy commodity IDs from pre-upgrade saves. */
export const LEGACY_COMMODITY_MAP: Record<string, CommodityId> = {
  flower: 'weed',
  pills: 'ecstasy',
  powder: 'cocaine',
  rocks: 'crack',
  acid: 'lsd',
  shrooms: 'mushrooms',
};

export const GAME_DISCLAIMER =
  'This is a fictional strategy game. It does not endorse, encourage, or instruct real-world illegal activity.';
