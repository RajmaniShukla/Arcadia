import { HOME, YARD } from "./board.js";
import type { GameState } from "./state.js";
import { getLegalMoves } from "./moves.js";

function nextTurn(state: GameState): GameState {
  return {
    ...state,
    turn: (state.turn + 1) % state.players.length,
    dice: null,
    phase: "roll",
  };
}

export function applyRoll(state: GameState, dice: number): GameState {
  if (state.phase !== "roll") throw new Error("Cannot roll right now");

  if (getLegalMoves(state, dice).length === 0) return nextTurn(state);
  return { ...state, dice, phase: "move" };
}

export function applyMove(state: GameState, tokenIndex: number): GameState {
  if (state.phase !== "move" || state.dice === null) {
    throw new Error("Cannot move right now");
  }
  const dice = state.dice;
  if (!getLegalMoves(state, dice).includes(tokenIndex)) {
    throw new Error("Illegal move");
  }

  const players = state.players.map((player, i) =>
    i !== state.turn
      ? player
      : {
          ...player,
          tokens: player.tokens.map((progress, t) =>
            t !== tokenIndex ? progress : progress === YARD ? 0 : progress + dice
          ),
        }
  );

  const mover = players[state.turn];
  if (mover.tokens.every((progress) => progress === HOME)) {
    return { ...state, players, dice: null, phase: "finished", winner: mover.color };
  }

  const next: GameState = { ...state, players, dice: null, phase: "roll" };
  return dice === 6 ? next : nextTurn(next);
}