/** Presentation-only reputation flavor — no gameplay changes. */

export interface ReputationFlavor {
  streetName: string;
  headline: string;
  supplierNote: string;
  buyerNote: string;
  mediaLine: string;
}

export function getReputationFlavor(reputation: number): ReputationFlavor {
  if (reputation >= 80) {
    return {
      streetName: 'The Ghost',
      headline: 'Untouchable — the city whispers your name.',
      supplierNote: 'Wholesale connects compete for your business.',
      buyerNote: 'Buyers pay premium without haggling.',
      mediaLine: 'Anonymous kingpin linked to record seizures — police deny leads.',
    };
  }
  if (reputation >= 60) {
    return {
      streetName: 'Kingpin',
      headline: 'Respected — rivals think twice before moving on you.',
      supplierNote: 'Exclusive bulk offers unlock at top tiers.',
      buyerNote: 'Contracts pay reputation bonuses on delivery.',
      mediaLine: 'Organized crime task force expands downtown operations.',
    };
  }
  if (reputation >= 45) {
    return {
      streetName: 'Heavy',
      headline: 'Feared — corners give you space.',
      supplierNote: 'Mid-tier suppliers take your calls seriously.',
      buyerNote: 'Street buyers negotiate harder when heat is high.',
      mediaLine: 'Gang violence erupts near nightclub district.',
    };
  }
  if (reputation >= 30) {
    return {
      streetName: 'Connected',
      headline: 'Connected — your name travels block to block.',
      supplierNote: 'Standard supplier access; better deals at higher rep.',
      buyerNote: 'Buyers expect quality — reputation affects payouts.',
      mediaLine: 'Nightclub district booming as tourism returns.',
    };
  }
  if (reputation >= 15) {
    return {
      streetName: 'Noticed',
      headline: 'Noticed — people remember your face.',
      supplierNote: 'Some suppliers still gatekeep by reputation.',
      buyerNote: 'Buyers push for discounts on small deals.',
      mediaLine: 'Local dealers report increased police patrols.',
    };
  }
  return {
    streetName: 'Unknown',
    headline: 'Unknown — you are just another face in the crowd.',
    supplierNote: 'Low rep suppliers ignore cold calls.',
    buyerNote: 'Buyers negotiate hard — you have no leverage.',
    mediaLine: 'Routine street activity — nothing on the wire yet.',
  };
}

export function getHubReputationLine(reputation: number): string {
  const f = getReputationFlavor(reputation);
  return `${f.streetName} · ${f.headline}`;
}
