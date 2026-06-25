/** Weighted random selection utilities — inject `random` for deterministic tests. */

export interface WeightedItem<T> {
  item: T;
  weight: number;
}

export function weightedPick<T>(
  items: WeightedItem<T>[],
  random: () => number = Math.random
): T | null {
  const valid = items.filter((i) => i.weight > 0);
  if (valid.length === 0) return null;

  const total = valid.reduce((sum, i) => sum + i.weight, 0);
  let roll = random() * total;

  for (const entry of valid) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }

  return valid[valid.length - 1].item;
}

export function adjustWeight(base: number, factor: number): number {
  return Math.max(0, Math.round(base * factor));
}
