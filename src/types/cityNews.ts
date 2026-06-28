/** Computed city news entries — not persisted; built from live game state. */

export type CityNewsCategory =
  | 'world'
  | 'market'
  | 'empire'
  | 'finance'
  | 'reputation'
  | 'flavor'
  | 'police';

export type CityNewsTone = 'good' | 'bad' | 'neutral' | 'urgent';

export interface CityNewsEntry {
  id: string;
  day: number;
  headline: string;
  detail?: string;
  category: CityNewsCategory;
  tone: CityNewsTone;
  /** Optional market sentiment hint for hub display */
  sentiment?: 'bullish' | 'bearish' | 'volatile' | 'calm';
}
