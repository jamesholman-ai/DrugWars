import { BuyerType } from '../types/contracts';

export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  club_owner: 'Club Owner',
  street_crew: 'Street Crew',
  rich_client: 'Rich Client',
  party_promoter: 'Party Promoter',
  cartel_middleman: 'Cartel Middleman',
  rival_buyer: 'Rival Buyer',
};

export const BUYER_NAMES: Record<BuyerType, string[]> = {
  club_owner: ['Marco V.', 'DJ Pulse', 'Ivory Room', 'Club Nexus'],
  street_crew: ['East Side Crew', 'Block 7', 'The Fam', 'Corner Kings'],
  rich_client: ['Mr. Ashford', 'The Collector', 'Silk Tie', 'Penthouse Pete'],
  party_promoter: ['Rave King', 'Neon Nights', 'Festival Fred', 'After Hours'],
  cartel_middleman: ['El Mensajero', 'The Broker', 'Silent Hand', 'Route Man'],
  rival_buyer: ['Opposite Block', 'Red Crew', 'Out-of-Town', 'Hostile Buyer'],
};

export const CONTRACT_DRUGS_BY_BUYER: Record<BuyerType, string[]> = {
  club_owner: ['cocaine', 'mdma', 'ketamine', 'ecstasy'],
  street_crew: ['crack', 'heroin', 'weed', 'meth'],
  rich_client: ['cocaine', 'ketamine', 'heroin', 'lsd'],
  party_promoter: ['mdma', 'ecstasy', 'mushrooms', 'ketamine'],
  cartel_middleman: ['cocaine', 'heroin', 'meth', 'crack'],
  rival_buyer: ['cocaine', 'weed', 'crack', 'heroin'],
};

/** Max pending offers shown at once. */
export const MAX_CONTRACT_OFFERS = 4;
export const MAX_ACTIVE_CONTRACTS = 3;
export const MAX_CONTRACT_HISTORY = 20;
