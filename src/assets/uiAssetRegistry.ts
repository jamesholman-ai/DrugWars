/**
 * UI chrome & event artwork registry (icons, event backgrounds).
 * City imagery uses `imageRegistry.ts` only.
 */
import { UI_IMAGES } from './generated/uiImages';
import { CommodityId } from '../types/game';

export type UiImageSource = number;

export interface UiAsset {
  source: UiImageSource | null;
}

const DRUG_ICON_MAP: Partial<Record<CommodityId, keyof typeof UI_IMAGES>> = {
  cocaine: 'icon_drug_cocaine',
  weed: 'icon_drug_weed',
  crack: 'icon_drug_crack',
  heroin: 'icon_drug_heroin',
  ecstasy: 'icon_drug_ecstasy',
  meth: 'icon_drug_meth',
  lsd: 'icon_drug_lsd',
  mushrooms: 'icon_drug_mushrooms',
};

const ICON_MAP: Record<string, keyof typeof UI_IMAGES> = {
  // Finance & status icons use AppIcon vectors — PNGs were UI mockup crops.
};

function resolve(key?: keyof typeof UI_IMAGES): UiAsset {
  if (key && UI_IMAGES[key] != null) return { source: UI_IMAGES[key] };
  return { source: null };
}

/** Event background art for popup headers. */
export function getEventBackground(eventType?: string): UiAsset {
  const t = (eventType ?? '').toLowerCase();
  if (
    t.includes('police') ||
    t.includes('raid') ||
    t.includes('dea') ||
    t.includes('crackdown')
  ) {
    return resolve('event_police_crackdown');
  }
  return resolve('event_world_event_default');
}

export function getUiChrome(
  category: 'cards' | 'buttons' | 'progress' | 'images',
  name: string
): UiAsset {
  if (category === 'buttons' && name === 'enter_market') {
    return resolve('button_enter_market_hero');
  }
  return { source: null };
}

export function getIconAsset(name: string): UiAsset {
  const key = ICON_MAP[name];
  return resolve(key);
}

export function getDrugIconAsset(commodityId: CommodityId): UiAsset {
  const key = DRUG_ICON_MAP[commodityId];
  return resolve(key);
}
