/** Simple LCG seeded RNG — inject into rollRandomEvent / resolveEventChoice for reproducible tests. */

export function createSeededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
