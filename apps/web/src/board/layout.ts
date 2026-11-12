import { HOME, YARD, LAST_TRACK_PROGRESS, toTrackSquare } from "@arcadia/game-core";
import type { Color, GameState } from "@arcadia/game-core";

export type Cell = readonly [col: number, row: number];
export interface Point { x: number; y: number }
export interface TokenView { color: Color; index: number; x: number; y: number }

// The 52 shared squares in play order.
// The array index IS the absolute square number game-core uses (0-51).
export const TRACK: readonly Cell[] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0],
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7],
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14],
  [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7],
  [0, 6],
];

// Progress 51-55 for each color: the private column leading to the center.
export const HOME_COLUMN: Record<Color, readonly Cell[]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
};

export const YARD_ORIGIN: Record<Color, Cell> = {
  red: [0, 0],
  green: [9, 0],
  yellow: [9, 9],
  blue: [0, 9],
};

// Where the 4 tokens sit inside a 6x6 yard.
export const YARD_SLOTS: readonly Cell[] = [[2, 2], [4, 2], [2, 4], [4, 4]];

// Finished tokens gather in the center triangle of their color.
const HOME_SPOT: Record<Color, Point> = {
  red: { x: 6.55, y: 7.5 },
  green: { x: 7.5, y: 6.55 },
  yellow: { x: 8.45, y: 7.5 },
  blue: { x: 7.5, y: 8.45 },
};

const center = ([col, row]: Cell): Point => ({ x: col + 0.5, y: row + 0.5 });

function tokenPoint(color: Color, index: number, progress: number): Point {
  if (progress === YARD) {
    const [ox, oy] = YARD_ORIGIN[color];
    const [sx, sy] = YARD_SLOTS[index];
    return { x: ox + sx, y: oy + sy };
  }
  if (progress === HOME) {
    const spot = HOME_SPOT[color];
    const shift = (index - 1.5) * 0.4;
    return color === "red" || color === "yellow"
      ? { x: spot.x, y: spot.y + shift }
      : { x: spot.x + shift, y: spot.y };
  }
  const square = toTrackSquare(color, progress);
  if (square !== null) return center(TRACK[square]);
  return center(HOME_COLUMN[color][progress - LAST_TRACK_PROGRESS - 1]);
}

/** Pixel-space position of every token, spreading tokens that share a spot. */
export function layoutTokens(game: GameState): TokenView[] {
  const views: TokenView[] = game.players.flatMap((player) =>
    player.tokens.map((progress, index) => ({
      color: player.color,
      index,
      ...tokenPoint(player.color, index, progress),
    }))
  );

  const groups = new Map<string, TokenView[]>();
  for (const view of views) {
    const key = `${view.x.toFixed(2)},${view.y.toFixed(2)}`;
    groups.set(key, [...(groups.get(key) ?? []), view]);
  }

  return [...groups.values()].flatMap((group) =>
    group.length === 1
      ? group
      : group.map((view, i) => {
          const angle = (2 * Math.PI * i) / group.length;
          return { ...view, x: view.x + Math.cos(angle) * 0.18, y: view.y + Math.sin(angle) * 0.18 };
        })
  );
}