export type Rng = () => number; // returns a number in [0, 1)

/** Small seedable generator (mulberry32): same seed, same sequence. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollDice(rng: Rng = Math.random): number {
  return Math.floor(rng() * 6) + 1;
}