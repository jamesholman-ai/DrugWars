import { MissionDefinition } from '../types/missions';

export const STORY_ARC_ORDER = ['street_starter', 'city_operator', 'empire_builder'] as const;
export type StoryArcId = (typeof STORY_ARC_ORDER)[number];

export const STORY_ARC_LABELS: Record<StoryArcId, string> = {
  street_starter: 'Street Starter',
  city_operator: 'City Operator',
  empire_builder: 'Empire Builder',
};

export const STORY_MISSIONS: MissionDefinition[] = [
  // Street Starter
  {
    id: 'ss_first_sale',
    title: 'First Move',
    description: 'Make your first street sale. Hit the market and move product.',
    type: 'trade_run',
    requirements: [{ key: 'sales', target: 1 }],
    rewards: { cash: 300, reputation: 3 },
    chainId: 'street_starter',
    nextMissionId: 'ss_debt_chunk',
    arcOrder: 1,
  },
  {
    id: 'ss_debt_chunk',
    title: 'Pay The Shark',
    description: 'Pay down at least $1,000 of your debt. Stay alive.',
    type: 'debt_payment',
    requirements: [{ key: 'debt_paid', target: 1000 }],
    rewards: { cash: 250, reputation: 3, heatReduction: 3 },
    chainId: 'street_starter',
    nextMissionId: 'ss_safehouse',
    arcOrder: 2,
  },
  {
    id: 'ss_safehouse',
    title: 'Secure Storage',
    description: 'Buy your first property. You need somewhere to store product off the street.',
    type: 'safehouse_purchase',
    requirements: [{ key: 'safehouses', target: 1 }],
    rewards: { cash: 400, reputation: 4 },
    chainId: 'street_starter',
    nextMissionId: 'ss_runner',
    arcOrder: 3,
  },
  {
    id: 'ss_runner',
    title: 'Build The Bench',
    description: 'Hire your first crew member. Extra hands keep the machine moving.',
    type: 'crew_recruitment',
    requirements: [{ key: 'crew_hired', target: 1 }],
    rewards: { cash: 500, reputation: 5, crewLoyalty: 8 },
    chainId: 'street_starter',
    arcOrder: 4,
  },
  // City Operator
  {
    id: 'co_supplier',
    title: 'Wholesale Connect',
    description: 'Complete a supplier deal. Buy bulk from a connected source.',
    type: 'supplier_job',
    requirements: [{ key: 'supplier_buys', target: 1 }],
    rewards: { cash: 600, reputation: 4, supplierTrust: 5 },
    chainId: 'city_operator',
    nextMissionId: 'co_contract',
    arcOrder: 1,
  },
  {
    id: 'co_contract',
    title: 'Buyer Drop',
    description: 'Fulfill a buyer contract. Deliver on time, get paid.',
    type: 'buyer_delivery',
    requirements: [{ key: 'contracts', target: 1 }],
    rewards: { cash: 800, reputation: 5 },
    chainId: 'city_operator',
    nextMissionId: 'co_heat',
    arcOrder: 2,
  },
  {
    id: 'co_heat',
    title: 'Cool Down',
    description: 'Get your heat below 50. Fly under the radar.',
    type: 'heat_reduction',
    requirements: [{ key: 'heat_max', target: 50 }],
    rewards: { cash: 400, reputation: 4, heatReduction: 8 },
    chainId: 'city_operator',
    nextMissionId: 'co_business',
    arcOrder: 3,
  },
  {
    id: 'co_business',
    title: 'Legitimate Front',
    description: 'Purchase your first business. Start building an empire.',
    type: 'business_purchase',
    requirements: [{ key: 'businesses', target: 1 }],
    rewards: { cash: 1200, reputation: 6 },
    chainId: 'city_operator',
    arcOrder: 4,
  },
  // Empire Builder
  {
    id: 'eb_businesses',
    title: 'Portfolio Play',
    description: 'Own 3 businesses across your territory.',
    type: 'business_purchase',
    requirements: [{ key: 'businesses', target: 3 }],
    rewards: { cash: 2500, reputation: 8 },
    chainId: 'empire_builder',
    nextMissionId: 'eb_safehouses',
    arcOrder: 1,
  },
  {
    id: 'eb_safehouses',
    title: 'Two-City Network',
    description: 'Own properties in 2 different cities.',
    type: 'safehouse_purchase',
    requirements: [{ key: 'safehouse_cities', target: 2 }],
    rewards: { cash: 2000, reputation: 7 },
    chainId: 'empire_builder',
    nextMissionId: 'eb_crew',
    arcOrder: 2,
  },
  {
    id: 'eb_crew',
    title: 'Full Roster',
    description: 'Have 3 active crew members on payroll.',
    type: 'crew_recruitment',
    requirements: [{ key: 'crew_active', target: 3 }],
    rewards: { cash: 1800, reputation: 6, crewLoyalty: 10 },
    chainId: 'empire_builder',
    nextMissionId: 'eb_elite',
    arcOrder: 3,
  },
  {
    id: 'eb_elite',
    title: 'Street Royalty',
    description: 'Reach Plug rank or 50+ reputation. You run the block.',
    type: 'survival_challenge',
    requirements: [{ key: 'elite', target: 1, minRank: 'plug', minReputation: 50 }],
    rewards: { cash: 5000, reputation: 10, heatReduction: 5 },
    chainId: 'empire_builder',
    arcOrder: 4,
  },
];

export const MISSION_MAP = Object.fromEntries(
  STORY_MISSIONS.map((m) => [m.id, m])
) as Record<string, MissionDefinition>;

export const CHAIN_START_MISSION: Record<StoryArcId, string> = {
  street_starter: 'ss_first_sale',
  city_operator: 'co_supplier',
  empire_builder: 'eb_businesses',
};

export const MAX_COMPLETED_MISSIONS = 40;
export const MAX_FAILED_MISSIONS = 20;
export const DAILY_OBJECTIVE_COUNT = 3;
