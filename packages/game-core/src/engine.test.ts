import { describe, it, expect } from "vitest";
import { createGame } from "./state.js";
import { applyRoll, applyMove } from "./engine.js";

function inMovePhase(tokens: number[], dice: number) {
  const game = createGame(["red", "green"]);
  game.players[0].tokens = tokens;
  return { ...game, dice, phase: "move" as const };
}

describe("applyRoll", () => {
  it("passes the turn when no move is possible", () => {
    const next = applyRoll(createGame(["red", "green"]), 3);
    expect(next.turn).toBe(1);
    expect(next.phase).toBe("roll");
    expect(next.dice).toBeNull();
  });

  it("enters the move phase when a move exists", () => {
    const next = applyRoll(createGame(["red", "green"]), 6);
    expect(next.turn).toBe(0);
    expect(next.phase).toBe("move");
    expect(next.dice).toBe(6);
  });

  it("rejects rolling during the move phase", () => {
    const state = inMovePhase([-1, -1, -1, -1], 6);
    expect(() => applyRoll(state, 2)).toThrow();
  });
});

describe("applyMove", () => {
  it("brings a token out of the yard and grants an extra turn on a 6", () => {
    const next = applyMove(inMovePhase([-1, -1, -1, -1], 6), 0);
    expect(next.players[0].tokens).toEqual([0, -1, -1, -1]);
    expect(next.turn).toBe(0);
    expect(next.phase).toBe("roll");
  });

  it("advances a token and passes the turn on a non-6", () => {
    const next = applyMove(inMovePhase([10, -1, -1, -1], 4), 0);
    expect(next.players[0].tokens[0]).toBe(14);
    expect(next.turn).toBe(1);
    expect(next.phase).toBe("roll");
  });

  it("rejects an illegal move", () => {
    const state = inMovePhase([-1, 10, -1, -1], 4);
    expect(() => applyMove(state, 0)).toThrow(); // yard token, dice is not 6
  });

  it("does not modify the original state", () => {
    const state = inMovePhase([10, -1, -1, -1], 4);
    const snapshot = structuredClone(state);
    applyMove(state, 0);
    expect(state).toEqual(snapshot);
  });

  it("declares a winner when the last token reaches home", () => {
    const next = applyMove(inMovePhase([56, 56, 56, 54], 2), 3);
    expect(next.phase).toBe("finished");
    expect(next.winner).toBe("red");
  });
});
