import { COMMODITY_MAP } from '../data/commodities';
import { CITY_MAP } from '../data/locations';
import { getAreaLabel } from '../data/locations';
import { CommodityId, GameState } from '../types/game';
import { GameEvent } from '../types/events';
import { parseEncounterChoice } from './encounterSystem';
import { EventResultChip, EventResultSummary } from './eventResultSummary';

export type EventNarrativeCategory =
  | 'mugger'
  | 'police'
  | 'dea'
  | 'rival'
  | 'cartel'
  | 'supplier'
  | 'buyer'
  | 'informant'
  | 'travel'
  | 'world'
  | 'market_spike'
  | 'market_crash'
  | 'robbery'
  | 'bad_drugs'
  | 'raccoon_stash'
  | 'warehouse_breakin'
  | 'debt'
  | 'health'
  | 'business'
  | 'property'
  | 'crew'
  | 'generic';

export type NarrativeOutcome = 'success' | 'failure' | 'neutral';

export interface NarrativeContext {
  category: EventNarrativeCategory;
  outcome: NarrativeOutcome;
  choiceKey: string;
  areaLabel: string;
  cityName: string;
  drugName?: string;
  npcName?: string;
  cashDelta: number;
  healthDelta: number;
  heatDelta: number;
  repDelta: number;
}

function choiceKeyFromId(choiceId: string): string {
  const parsed = parseEncounterChoice(choiceId);
  if (parsed) return parsed.choiceKey;
  const parts = choiceId.split('_');
  return parts[parts.length - 1] ?? choiceId;
}

function drugName(event: GameEvent): string | undefined {
  const id = event.context.commodityId;
  if (!id) return undefined;
  return COMMODITY_MAP[id]?.name ?? id;
}

function locationLabels(state: GameState): { areaLabel: string; cityName: string } {
  const { currentCityId, currentAreaId } = state.player;
  return {
    areaLabel: getAreaLabel(currentCityId, currentAreaId),
    cityName: CITY_MAP[currentCityId]?.name ?? currentCityId,
  };
}

function statDeltas(before: GameState, after: GameState) {
  return {
    cashDelta: after.player.cash - before.player.cash,
    healthDelta: after.player.health - before.player.health,
    heatDelta: after.player.heat - before.player.heat,
    repDelta: after.player.reputation - before.player.reputation,
  };
}

export function classifyEventCategory(event: GameEvent, choiceId: string): EventNarrativeCategory {
  const desc = event.description.toLowerCase();
  const title = event.title.toLowerCase();

  if (desc.includes('raccoon') || title.includes('raccoon')) return 'raccoon_stash';
  if (
    desc.includes('warehouse') &&
    (desc.includes('broken') || desc.includes('flood') || desc.includes('hit'))
  ) {
    return 'warehouse_breakin';
  }
  if (desc.includes('bad batch') || event.eventType === 'health_emergency') {
    if (event.eventType === 'health_emergency') return 'health';
    return 'bad_drugs';
  }

  if (choiceId.startsWith('enc:')) {
    const parsed = parseEncounterChoice(choiceId);
    const encId = parsed?.encounterId ?? '';
    if (desc.includes('dea') || encId.includes('dea')) return 'dea';
    if (desc.includes('cartel') || encId.includes('cartel')) return 'cartel';
    if (desc.includes('rival') || encId.includes('rival')) return 'rival';
    if (desc.includes('thug') || desc.includes('mug') || encId.includes('mugger')) return 'mugger';
    if (desc.includes('police') || desc.includes('airport') || encId.includes('police')) return 'police';
    return 'travel';
  }

  switch (event.eventType) {
    case 'robbery_attempt':
      return 'robbery';
    case 'police_stop':
    case 'police_raid':
      return 'police';
    case 'rival_dealer':
      return 'rival';
    case 'supplier_discount':
      return 'supplier';
    case 'bulk_buyer_offer':
      return 'buyer';
    case 'informant_tip':
      return 'informant';
    case 'price_spike':
      return desc.includes('raccoon') ? 'raccoon_stash' : 'market_spike';
    case 'price_crash':
      return desc.includes('warehouse') ? 'warehouse_breakin' : 'market_crash';
    case 'debt_collector_warning':
      return 'debt';
    default:
      if (desc.includes('dea')) return 'dea';
      if (title.includes('crew') || desc.includes('crew')) return 'crew';
      if (title.includes('business') || desc.includes('business')) return 'business';
      if (title.includes('property') || desc.includes('safehouse')) return 'property';
      return 'generic';
  }
}

export function inferNarrativeOutcome(
  before: GameState,
  after: GameState,
  choiceKey: string,
  category: EventNarrativeCategory
): NarrativeOutcome {
  const { cashDelta, healthDelta, repDelta } = statDeltas(before, after);

  const fightLike = ['fight', 'stand', 'intimidate'].some((k) => choiceKey.includes(k));
  const runLike = choiceKey.includes('run');
  const payLike = ['pay', 'bribe', 'buy', 'clinic', 'sample'].some((k) => choiceKey.includes(k));

  if (fightLike) {
    if (repDelta > 0 && healthDelta >= -12) return 'success';
    if (healthDelta <= -12 || cashDelta < -150) return 'failure';
    if (healthDelta < 0 && cashDelta >= 0) return 'success';
    return 'neutral';
  }

  if (runLike) {
    if (cashDelta >= 0 && healthDelta >= -5) return 'success';
    if (healthDelta <= -8 || cashDelta < -100) return 'failure';
    return 'neutral';
  }

  if (payLike) {
    if (cashDelta < 0 && healthDelta >= -5) return 'neutral';
    if (healthDelta < -10) return 'failure';
    return 'success';
  }

  if (category === 'market_spike' || category === 'raccoon_stash') {
    if (cashDelta > 0 || repDelta > 0) return 'success';
    return 'neutral';
  }

  if (category === 'market_crash' || category === 'warehouse_breakin') {
    if (cashDelta < 0 && healthDelta === 0) return 'neutral';
    return 'success';
  }

  const { heatDelta } = statDeltas(before, after);
  if (heatDelta > 8 && cashDelta <= 0) return 'failure';
  if (repDelta > 0 || cashDelta > 0) return 'success';
  if (healthDelta < -8 || cashDelta < -200) return 'failure';
  return 'neutral';
}

export function buildNarrativeContext(
  event: GameEvent,
  choiceId: string,
  before: GameState,
  after: GameState
): NarrativeContext {
  const category = classifyEventCategory(event, choiceId);
  const choiceKey = choiceKeyFromId(choiceId);
  const { areaLabel, cityName } = locationLabels(after);
  const deltas = statDeltas(before, after);

  return {
    category,
    outcome: inferNarrativeOutcome(before, after, choiceKey, category),
    choiceKey,
    areaLabel,
    cityName,
    drugName: drugName(event),
    npcName: event.npc?.name,
    ...deltas,
  };
}

type StoryTemplate = string | ((ctx: NarrativeContext) => string);

const STORY_TEMPLATES: Partial<
  Record<EventNarrativeCategory, Partial<Record<string, Partial<Record<NarrativeOutcome, StoryTemplate>>>>>
> = {
  mugger: {
    fight: {
      success:
        'You swing first and catch the mugger off guard. The scuffle ends fast, but not clean. He runs off while you scoop up what he dropped.',
      failure:
        'You throw a punch, but he was ready. The alley turns ugly fast. You escape, bruised and lighter than before.',
      neutral:
        'The fight spills into the street before he bolts. You take a hit, but the block remembers you did not fold.',
    },
    run: {
      success:
        'You cut through a side street and disappear before things turn bad. Your pride takes the hit, but your pockets stay intact.',
      failure:
        'You try to run, but he catches up before you clear the block. The escape costs you more than standing your ground would have.',
      neutral: 'You break line and vanish into foot traffic. Nobody follows past the corner.',
    },
    pay: {
      neutral:
        'You hand over the cash and keep your eyes down. The mugger melts back into the alley without a word.',
      failure: 'He takes the money and still pushes his luck. You leave shaken and short.',
    },
  },
  robbery: {
    fight: {
      success:
        'You swing first and catch him off guard. The fight spills into the street before he runs. You take a hit to the ribs but grab his dropped wallet.',
      failure:
        'The robbers were ready for resistance. You get away, but not before they take their cut of flesh and cash.',
      neutral: 'Steel meets desperation. You survive the exchange, but the block feels hotter now.',
    },
    pay: {
      neutral:
        'You pay to walk away. Pride stings more than the wallet, but you live to sell another day.',
      failure: 'They take everything you offer and still push for more.',
    },
    bluff: {
      success: 'Your reputation precedes you. They hesitate, then melt back into the dark.',
      failure: 'The bluff lands flat. The alley turns mean before you break free.',
    },
  },
  police: {
    bribe: {
      success: 'The officer studies the cash, then looks away. You keep moving, but the stop leaves your name circulating.',
      neutral: 'The bribe buys passage, not forgiveness. Heat follows you down the block.',
      failure: 'He takes the money and still writes you up. The street gets colder.',
    },
    run: {
      success: 'You sprint through alleys and lose the tail before the sirens converge.',
      failure: 'You run, but they were waiting on the next corner. The chase ends badly.',
      neutral: 'You outpace the patrol, lungs burning, heat rising behind you.',
    },
    cooperate: {
      success: 'You stay calm and answer clean. The officer waves you on with a warning.',
      neutral: 'Cooperation costs a fine, but you avoid the cage tonight.',
      failure: 'Your story does not land. The cuffs click before you finish talking.',
    },
    ditch: {
      neutral: 'You ditch what you can and vanish before the raid closes in. The stash is gone, but you are not.',
    },
    hide: {
      neutral: 'Someone hides you for a price. The raid passes overhead while you count the cost.',
    },
    stand: {
      failure: 'You stand your ground. Respect on the block rises, but the raid takes its toll.',
    },
    talk: {
      neutral: 'You talk your way through the stop. Nerves steady, eyes everywhere, you keep walking.',
    },
    pay: {
      neutral: 'The officer studies the cash, then looks away. You keep moving, but the stop leaves your name circulating.',
    },
  },
  dea: {
    talk: {
      neutral: 'Agents listen, then dismiss you with cold paperwork. The case file grows either way.',
    },
    pay: {
      neutral: 'Money changes hands in a parking garage. The search ends, but federal eyes do not blink.',
    },
    run: {
      failure: 'You run from federal heat. They do not forget a face that bolts.',
    },
    fight: {
      failure: 'Fighting federal agents is a losing game. You survive, barely, and the heat never fades.',
    },
  },
  rival: {
    fight: {
      success: 'You win the corner exchange. Razor remembers the bruise more than the truce.',
      failure: 'Razor was ready. You pay in blood and cash to leave the block.',
      neutral: 'The rival crew backs off after a tense exchange. Nobody wins the block tonight, but everyone remembers the face-off.',
    },
    pay: {
      neutral: 'Tribute buys peace for now. Razor counts the cash and lets you pass.',
    },
    snitch: {
      neutral: 'You feed Razor to the cops. Heat drops, but a rival never forgets a snitch.',
    },
    negotiate: {
      neutral: 'The rival crew backs off after a tense exchange. Nobody wins the block tonight, but everyone remembers the face-off.',
    },
  },
  cartel: {
    pay: {
      neutral: 'Cartel muscle takes their cut. You leave alive, which is the whole point.',
    },
    talk: {
      neutral: 'Words buy time with cartel enforcers. The price will come due later.',
    },
    fight: {
      failure: 'Cartel soldiers do not bluff. You crawl out with less than you brought in.',
    },
  },
  supplier: {
    buy: {
      success: 'The back-room deal closes clean. Bulk product hits your stash before patrol lights sweep the block.',
      failure: 'The supplier smiles too much and delivers too little. By the time you count the package, he is gone.',
    },
    sample: {
      success: 'You take the sample and nod thanks. Free product is rare — you move before he changes his mind.',
    },
    decline: {
      neutral: 'You walk away from the deal. Silk remembers who passes on a discount.',
    },
  },
  buyer: {
    sell: {
      success: 'Chip counts the bundle twice, then pays premium. The bulk move clears your pockets at a profit.',
    },
    negotiate: {
      success: 'You squeeze a better number out of Chip. He grumbles, but the cash is real.',
      failure: 'The negotiation sours. Chip walks and the premium vanishes with him.',
    },
    decline: {
      neutral: 'You pass on the bulk buy. The market will not wait for indecision.',
    },
  },
  informant: {
    pay: {
      success: 'Whisper takes the cash and slips you a line on where to buy low. Intel costs, but ignorance costs more.',
    },
    trade: {
      neutral: 'You trade stash for street knowledge. Whisper vanishes before you can ask follow-ups.',
    },
    ignore: {
      neutral: 'You ignore the whisper. The tip fades back into the noise of the city.',
    },
  },
  raccoon_stash: {
    sell: {
      success: (ctx) =>
        `Word spreads that raccoons tore through a stash of ${ctx.drugName ?? 'product'}. The story sounds ridiculous, but the price jump is real — and you sell into the panic.`,
    },
    hold: {
      neutral: (ctx) =>
        `Word spreads that raccoons tore through a stash of ${ctx.drugName ?? 'product'} in ${ctx.areaLabel}. You hold your line and watch buyers panic-bid.`,
    },
    rumor: {
      neutral: (ctx) =>
        `You fan the raccoon story through ${ctx.areaLabel}. ${ctx.drugName ?? 'Product'} prices climb on pure street theater.`,
    },
  },
  warehouse_breakin: {
    buy: {
      success: (ctx) =>
        `A police warehouse gets hit overnight. By morning, ${ctx.drugName ?? 'product'} is everywhere in ${ctx.areaLabel} and you buy the dip.`,
    },
    ignore: {
      neutral: (ctx) =>
        `A police warehouse was broken into overnight. By morning, ${ctx.drugName ?? 'product'} is everywhere and prices fall through the floor in ${ctx.areaLabel}.`,
    },
    warn: {
      neutral: (ctx) =>
        `You warn your contacts about the warehouse leak. ${ctx.drugName ?? 'Product'} floods ${ctx.cityName} before anyone can control the spill.`,
    },
  },
  market_spike: {
    sell: {
      success: (ctx) =>
        `Buyers panic-bid on ${ctx.drugName ?? 'product'} across ${ctx.areaLabel}. You sell into the spike before the block catches its breath.`,
    },
    hold: {
      neutral: (ctx) =>
        `Prices on ${ctx.drugName ?? 'product'} keep climbing in ${ctx.areaLabel}. You hold and watch the frenzy build.`,
    },
    rumor: {
      neutral: (ctx) =>
        `You spread the spike rumor through ${ctx.areaLabel}. ${ctx.drugName ?? 'Product'} moves at a premium whether the story is true or not.`,
    },
  },
  market_crash: {
    buy: {
      success: (ctx) =>
        `A flood of ${ctx.drugName ?? 'product'} hits ${ctx.areaLabel}. You buy cheap while sellers dump inventory.`,
    },
    ignore: {
      neutral: (ctx) =>
        `The crash rolls through ${ctx.areaLabel}. ${ctx.drugName ?? 'Product'} sits on corners at prices nobody wanted yesterday.`,
    },
    warn: {
      neutral: (ctx) =>
        `You warn your network about the ${ctx.drugName ?? 'product'} crash in ${ctx.cityName}. Goodwill costs nothing; panic costs everything.`,
    },
  },
  debt: {
    pay: {
      success: 'Bruno counts the partial payment and backs off — for now. The debt still breathes down your neck.',
    },
    promise: {
      failure: 'You promise what you cannot pay. Bruno adds interest to the threat.',
    },
    intimidate: {
      success: 'You stare Bruno down. He retreats, but the loan sharks remember the insult.',
      failure: 'Bruno laughs at the bluff. The beating is quick and expensive.',
    },
  },
  health: {
    clinic: {
      success: 'The clinic patches you up quietly. You leave sore, solvent, and still off the books.',
    },
    tough: {
      failure: 'You tough it out alone. The city does not pause for pain.',
    },
    favor: {
      neutral: 'You call in a favor that puts you deeper in someone\'s pocket. At least you are upright.',
    },
  },
};

const TITLE_TEMPLATES: Partial<
  Record<EventNarrativeCategory, Partial<Record<NarrativeOutcome, string>>>
> = {
  mugger: { success: 'You Won the Fight', failure: 'You Got Robbed', neutral: 'You Got Away' },
  robbery: { success: 'You Won the Fight', failure: 'You Got Robbed', neutral: 'You Paid Them Off' },
  police: { success: 'The Bribe Worked', failure: 'Heat Increased', neutral: 'You Slipped Through' },
  dea: { failure: 'Federal Heat Increased', neutral: 'Agents Moved On' },
  rival: { success: 'You Held the Block', failure: 'The Deal Went Bad', neutral: 'Uneasy Truce' },
  cartel: { failure: 'Cartel Took Their Cut', neutral: 'You Survived the Meeting' },
  supplier: { success: 'Deal Closed', failure: 'The Deal Went Bad', neutral: 'Supplier Walked' },
  buyer: { success: 'Premium Sale', failure: 'Buyer Walked', neutral: 'Offer Declined' },
  informant: { success: 'Tip Acquired', neutral: 'Intel Passed' },
  raccoon_stash: { success: 'Supply Collapsed', neutral: 'Prices Spiked' },
  warehouse_breakin: { success: 'Prices Crashed', neutral: 'Market Flooded' },
  market_spike: { success: 'Prices Spiked', neutral: 'Market Heating Up' },
  market_crash: { success: 'Prices Crashed', neutral: 'Market Softened' },
  debt: { success: 'Collector Backed Off', failure: 'Debt Got Worse', neutral: 'Promise Made' },
  health: { success: 'Patch Job', failure: 'You Took the Hit', neutral: 'Favor Called In' },
};

function resolveTemplate(
  template: StoryTemplate | undefined,
  ctx: NarrativeContext
): string | null {
  if (!template) return null;
  return typeof template === 'function' ? template(ctx) : template;
}

function pickStory(ctx: NarrativeContext): string | null {
  const categoryTemplates = STORY_TEMPLATES[ctx.category];
  if (!categoryTemplates) return null;

  const choiceTemplates =
    categoryTemplates[ctx.choiceKey] ??
    categoryTemplates[ctx.choiceKey.replace(/s$/, '')] ??
    categoryTemplates.talk ??
    categoryTemplates.pay;

  if (!choiceTemplates) return null;

  return (
    resolveTemplate(choiceTemplates[ctx.outcome], ctx) ??
    resolveTemplate(choiceTemplates.neutral, ctx) ??
    resolveTemplate(choiceTemplates.success, ctx) ??
    resolveTemplate(choiceTemplates.failure, ctx)
  );
}

export function buildEventResolutionTitle(
  event: GameEvent,
  choiceId: string,
  before: GameState,
  after: GameState
): string {
  const ctx = buildNarrativeContext(event, choiceId, before, after);
  const categoryTitle = TITLE_TEMPLATES[ctx.category]?.[ctx.outcome];
  if (categoryTitle) return categoryTitle;

  if (ctx.heatDelta >= 10) return 'Heat Increased';
  if (ctx.cashDelta < -200) return 'You Got Robbed';
  if (ctx.healthDelta <= -10) return 'You Took a Hit';
  if (ctx.repDelta >= 3) return 'Street Cred Gained';
  if (ctx.cashDelta > 0) return 'Payday';

  const choice = event.choices.find((c) => c.id === choiceId);
  return choice ? `${event.title} — ${choice.label}` : `${event.title} — Outcome`;
}

export function buildEventResolutionStory(
  event: GameEvent,
  choiceId: string,
  result: EventResultSummary,
  afterState: GameState,
  beforeState?: GameState
): string {
  if (beforeState) {
    const ctx = buildNarrativeContext(event, choiceId, beforeState, afterState);
    const story = pickStory(ctx);
    if (story) return story;
  }

  if (beforeState) {
    const { areaLabel } = locationLabels(afterState);
    return `The situation resolves in ${areaLabel}. The consequences are immediate.`;
  }

  return result.message;
}
