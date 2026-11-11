export type Color = "red" | "green" | "yellow" | "blue";

export const COLORS: readonly Color[] = ["red", "green", "yellow", "blue"];

export const TRACK_LENGTH = 52;
export const TOKENS_PER_PLAYER = 4;

export const YARD = -1;
export const LAST_TRACK_PROGRESS = 50;
export const HOME = 56;

export const START_SQUARE: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

/** Absolute square (0-51) on the shared track, or null if the token is not on it. */
export function toTrackSquare(color: Color, progress: number): number | null {
  if (progress < 0 || progress > LAST_TRACK_PROGRESS) return null;
  return (START_SQUARE[color] + progress) % TRACK_LENGTH;
}

export const SAFE_SQUARES: ReadonlySet<number> = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export function isSafeSquare(square: number): boolean {
  return SAFE_SQUARES.has(square);
}

