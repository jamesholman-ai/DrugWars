import { TutorialStepDefinition } from '../types/tutorial';

export const TUTORIAL_STEPS: TutorialStepDefinition[] = [
  {
    id: 'trade',
    title: 'Buy Low, Sell High',
    body: 'Open Market from the bottom bar. Buy cheap drugs (▼ trend), travel or wait for prices to rise, then sell high (▲ trend). Every sale adds dirty cash and a little heat.',
    hint: 'Tap MARKET → buy Weed → sell when price is up.',
    highlight: 'market',
  },
  {
    id: 'travel',
    title: 'Areas vs Cities',
    body: 'Area travel moves you within a city same-day (cheap). City travel jumps to another city and costs a full day — debt interest still hits overnight.',
    hint: 'Use TRAVEL for new prices. Stay Here refreshes without advancing the day.',
    highlight: 'travel',
  },
  {
    id: 'debt_heat',
    title: 'Debt & Heat',
    body: 'Your loan shark adds interest every day you advance. Heat attracts police — lay low, bribe, or buy fronts to cool off. Pay debt from the Hub when you can.',
    hint: 'Watch the Heat bar. Status tab has legal actions.',
    highlight: 'heat',
  },
  {
    id: 'stash',
    title: 'Storage & Properties',
    body: 'Storage is what you carry on the street. Buy a property on-site to store product off your person — less loss if you get hit. Deposit from the Storage tab.',
    hint: 'STORAGE tab → Properties when ready.',
    highlight: 'stash',
  },
  {
    id: 'deals',
    title: 'Suppliers & Contracts',
    body: 'Suppliers sell bulk at a discount. Contracts pay you to deliver product to a buyer on deadline. Both are mid-game money engines.',
    hint: 'SUPPLY and DEALS tabs on the bottom bar.',
    highlight: 'supply',
  },
  {
    id: 'empire',
    title: 'Crew, Business & Missions',
    body: 'Hire crew for bonuses. Buy businesses for clean income and laundering. Missions guide your next move — claim rewards when complete.',
    hint: 'Hub shows empire stats. MISSIONS tracks story and daily goals.',
    highlight: 'missions',
  },
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;
