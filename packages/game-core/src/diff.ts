import type { GameState } from "./state.js";

/** The index of the token the current mover just moved, or null if nothing moved. */
export function movedTokenIndex(before: GameState, after: GameState): number | null {
  if (before.phase !== "move") return null;
  const was = before.players[before.turn]?.tokens;
  const now = after.players[before.turn]?.tokens;
  if (!was || !now) return null;
  const index = was.findIndex((progress, i) => progress !== now[i]);
  return index === -1 ? null : index;
}

/** True if a dice roll was applied between the two states. */
export function rollWasApplied(before: GameState, after: GameState): boolean {
  return before.phase === "roll" && (after.phase !== "roll" || after.turn !== before.turn);
}