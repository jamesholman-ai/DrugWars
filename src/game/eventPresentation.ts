import { getCityMaster, ImageSourceProp } from '../assets/imageRegistry';
import { getEventBackground } from '../assets/uiAssetRegistry';
import { GameEvent } from '../types/events';

export interface EventArt {
  source: ImageSourceProp | null;
}

export interface EventImpactPreview {
  label: string;
  tone: 'green' | 'red' | 'purple' | 'gold' | 'gray';
}

export function getEventCategoryBadge(event: GameEvent): string {
  if (event.id.startsWith('encounter_') || event.choices.some((c) => c.id.startsWith('enc:'))) {
    const desc = event.description.toLowerCase();
    if (desc.includes('dea')) return 'DEA';
    if (desc.includes('police') || desc.includes('airport')) return 'POLICE';
    if (desc.includes('cartel')) return 'CARTEL';
    if (desc.includes('rival')) return 'RIVAL';
    if (desc.includes('thug') || desc.includes('robbery')) return 'STREET';
    return 'ENCOUNTER';
  }

  switch (event.eventType) {
    case 'police_stop':
    case 'police_raid':
      return 'POLICE';
    case 'price_spike':
    case 'price_crash':
      return 'MARKET';
    case 'supplier_discount':
      return 'SUPPLIER';
    case 'bulk_buyer_offer':
      return 'BUYER';
    case 'informant_tip':
      return 'INTEL';
    case 'rival_dealer':
      return 'RIVAL';
    case 'robbery_attempt':
      return 'STREET';
    case 'debt_collector_warning':
      return 'DEBT';
    case 'health_emergency':
      return 'HEALTH';
    default:
      return 'STREET EVENT';
  }
}

function isPoliceLike(event: GameEvent): boolean {
  const t = event.eventType;
  const badge = getEventCategoryBadge(event);
  return (
    t.includes('police') ||
    badge === 'POLICE' ||
    badge === 'DEA' ||
    event.description.toLowerCase().includes('raid')
  );
}

export function getEventArt(event: GameEvent, cityId?: string): EventArt {
  if (isPoliceLike(event)) {
    return getEventBackground('police_crackdown');
  }
  if (cityId) {
    const cityArt = getCityMaster(cityId);
    if (cityArt.source) return { source: cityArt.source };
  }
  return getEventBackground('world_event_default');
}

export function buildEventImpactPreview(event: GameEvent): EventImpactPreview[] {
  const tags: EventImpactPreview[] = [];
  const ctx = event.context;

  if (ctx.priceMultiplier != null) {
    const pct = Math.round((ctx.priceMultiplier - 1) * 100);
    tags.push({
      label: pct >= 0 ? `Prices +${pct}%` : `Prices ${pct}%`,
      tone: pct >= 0 ? 'green' : 'red',
    });
  }
  if (ctx.amount != null && ctx.amount !== 0) {
    tags.push({
      label: ctx.amount > 0 ? `Cash up to $${ctx.amount}` : `Cash −$${Math.abs(ctx.amount)}`,
      tone: ctx.amount > 0 ? 'green' : 'red',
    });
  }
  if (ctx.quantity != null) {
    tags.push({ label: `Qty ${ctx.quantity}`, tone: 'purple' as EventImpactPreview['tone'] });
  }
  if (isPoliceLike(event)) {
    tags.push({ label: 'Heat risk', tone: 'red' });
  }
  if (event.eventType === 'health_emergency') {
    tags.push({ label: 'Health at risk', tone: 'red' });
  }

  return tags.slice(0, 4);
}
