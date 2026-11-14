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
/** Where a token ends up after moving: yard tokens enter at 0, others advance by the dice. */
export function destination(progress: number, dice: number): number {
  return progress === YARD ? 0 : progress + dice;
}

/** Legal token indexes for the current turn, or [] when no dice value is waiting. */
export function currentLegalMoves(state: GameState): number[] {
  return state.phase === "move" && state.dice !== null ? getLegalMoves(state, state.dice) : [];
}