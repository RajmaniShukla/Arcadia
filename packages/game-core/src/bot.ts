import { HOME, YARD } from "./board.js";
import { currentLegalMoves, destination } from "./moves.js";
import type { GameState } from "./state.js";

/** Picks a token for the current player to move, or null if no move is possible. */
export function chooseBotMove(state: GameState): number | null {
  const legal = currentLegalMoves(state);
  const dice = state.dice;
  if (legal.length === 0 || dice === null) return null;

  const tokens = state.players[state.turn].tokens;

  // 1. Finish a token if possible.
  const finishing = legal.find((i) => destination(tokens[i], dice) === HOME);
  if (finishing !== undefined) return finishing;

  // 2. Otherwise get a new token out of the yard.
  const leaving = legal.find((i) => tokens[i] === YARD);
  if (leaving !== undefined) return leaving;

  // 3. Otherwise advance the token that is furthest along.
  return legal.reduce((best, i) => (tokens[i] > tokens[best] ? i : best));
}