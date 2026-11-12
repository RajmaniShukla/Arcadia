import { describe, it, expect } from "vitest";
import { createGame } from "./state.js";
import { getLegalMoves, destination } from "./moves.js";

describe("getLegalMoves", () => {
  it("allows nothing when all tokens are in the yard and dice is not 6", () => {
    const game = createGame(["red", "green"]);
    expect(getLegalMoves(game, 3)).toEqual([]);
  });

  it("allows every yard token to leave on a 6", () => {
    const game = createGame(["red", "green"]);
    expect(getLegalMoves(game, 6)).toEqual([0, 1, 2, 3]);
  });

  it("skips finished tokens and tokens that would overshoot home", () => {
    const game = createGame(["red", "green"]);
    game.players[0].tokens = [-1, 54, 56, 10];

    expect(getLegalMoves(game, 2)).toEqual([1, 3]);
    expect(getLegalMoves(game, 6)).toEqual([0, 3]);
  });
});

describe("destination", () => {
  it("brings yard tokens to their start square", () => {
    expect(destination(-1, 6)).toBe(0);
  });

  it("advances other tokens by the dice", () => {
    expect(destination(10, 4)).toBe(14);
  });
});