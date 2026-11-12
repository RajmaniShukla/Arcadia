import { describe, it, expect } from "vitest";
import { createGame, type GameState } from "./state.js";
import { applyRoll, applyMove } from "./engine.js";
import { getLegalMoves } from "./moves.js";
import { createRng, rollDice } from "./dice.js";
import { COLORS, HOME, YARD, TOKENS_PER_PLAYER } from "./board.js";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function checkInvariants(state: GameState, seed: number): void {
  for (const player of state.players) {
    check(player.tokens.length === TOKENS_PER_PLAYER, `seed ${seed}: token count changed`);
    for (const p of player.tokens) {
      check(p >= YARD && p <= HOME, `seed ${seed}: ${player.color} token at invalid progress ${p}`);
    }
  }
  check(state.turn >= 0 && state.turn < state.players.length, `seed ${seed}: invalid turn`);
  if (state.phase === "roll") check(state.dice === null, `seed ${seed}: dice set in roll phase`);
  if (state.phase === "move") check(state.dice !== null, `seed ${seed}: no dice in move phase`);
  if (state.phase === "finished") check(state.winner !== null, `seed ${seed}: finished without winner`);
}

function playRandomGame(seed: number, playerCount: number) {
  const rng = createRng(seed);
  let state = createGame(COLORS.slice(0, playerCount));
  let steps = 0;

  while (state.phase !== "finished") {
    check(steps++ < 100_000, `seed ${seed}: game did not finish`);

    if (state.phase === "roll") {
      state = applyRoll(state, rollDice(rng));
    } else {
      const legal = getLegalMoves(state, state.dice!);
      const choice = legal[Math.floor(rng() * legal.length)];
      state = applyMove(state, choice);
    }
    checkInvariants(state, seed);
  }
  return { state, steps };
}

describe("random full games", () => {
  for (const players of [2, 3, 4]) {
    it(`${players}-player games always finish in a valid state`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const { state } = playRandomGame(seed, players);
        const winner = state.players.find((p) => p.color === state.winner)!;
        check(winner.tokens.every((p) => p === HOME), `seed ${seed}: winner has unfinished tokens`);
      }
    });
  }

  it("is deterministic: the same seed replays the same game", () => {
    expect(playRandomGame(42, 4)).toEqual(playRandomGame(42, 4));
  });
});