/** FNV-1a hash for deterministic seeds from strings. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hashCombine(...parts: (string | number)[]): number {
  return hashString(parts.join('|'));
}
