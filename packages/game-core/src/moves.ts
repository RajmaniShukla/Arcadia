import { HOME, YARD } from "./board.js";
import type { GameState } from "./state.js";

/** Returns the indexes (0-3) of the current player's tokens that may move. */
export function getLegalMoves(state: GameState, dice: number): number[] {
  const player = state.players[state.turn];
  const legal: number[] = [];

  player.tokens.forEach((progress, index) => {
    if (progress === HOME) return; // already finished
    if (progress === YARD) {
      if (dice === 6) legal.push(index); // need a 6 to leave the yard
      return;
    }
    if (progress + dice <= HOME) legal.push(index); // no overshooting home
  });

  return legal;
}