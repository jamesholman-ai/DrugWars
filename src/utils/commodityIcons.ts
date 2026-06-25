import { CommodityId } from '../types/game';

export const COMMODITY_ICONS: Record<CommodityId, string> = {
  weed: '🌿',
  cocaine: '❄️',
  crack: '🪨',
  heroin: '💉',
  ecstasy: '💊',
  lsd: '🌈',
  mushrooms: '🍄',
  meth: '⚗️',
  ketamine: '🧪',
  mdma: '✨',
  hashish: '🟤',
  opium: '🌺',
  morphine: '💊',
  pcp: '🌀',
  speed: '⚡',
};

export function commodityIcon(id: CommodityId): string {
  return COMMODITY_ICONS[id] ?? '◆';
}
