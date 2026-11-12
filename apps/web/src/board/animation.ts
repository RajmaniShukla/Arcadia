import { YARD, destination } from "@arcadia/game-core";
import type { GameState } from "@arcadia/game-core";

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function withProgress(state: GameState, tokenIndex: number, progress: number): GameState {
  return {
    ...state,
    players: state.players.map((player, i) =>
      i !== state.turn
        ? player
        : { ...player, tokens: player.tokens.map((p, t) => (t === tokenIndex ? progress : p)) }
    ),
  };
}

/** The in-between board states while a token walks (the final square is the real result). */
export function walkFrames(state: GameState, tokenIndex: number): GameState[] {
  if (state.dice === null) return [];
  const from = state.players[state.turn].tokens[tokenIndex];
  if (from === YARD) return []; // leaving the yard is a single hop

  const to = destination(from, state.dice);
  const frames: GameState[] = [];
  for (let p = from + 1; p < to; p++) frames.push(withProgress(state, tokenIndex, p));
  return frames;
}