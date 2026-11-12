import { HOME, YARD, toTrackSquare, isSafeSquare } from "./board.js";
import type { GameState } from "./state.js";
import { getLegalMoves, destination } from "./moves.js";

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

  const mover = state.players[state.turn];
  const from = mover.tokens[tokenIndex];
  const to = destination(from, dice);
  const landing = toTrackSquare(mover.color, to);
  let captured = false;

  const players = state.players.map((player, i) => {
    if (i === state.turn) {
      return {
        ...player,
        tokens: player.tokens.map((p, t) => (t === tokenIndex ? to : p)),
      };
    }
    if (landing === null || isSafeSquare(landing)) return player;

    return {
      ...player,
      tokens: player.tokens.map((p) => {
        if (toTrackSquare(player.color, p) === landing) {
          captured = true;
          return YARD;
        }
        return p;
      }),
    };
  });

  if (players[state.turn].tokens.every((p) => p === HOME)) {
    return { ...state, players, dice: null, phase: "finished", winner: mover.color };
  }

  const next: GameState = { ...state, players, dice: null, phase: "roll" };
  return dice === 6 || captured ? next : nextTurn(next);
}