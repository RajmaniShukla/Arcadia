import { describe, it, expect } from "vitest";
import { createGame } from "./state.js";
import { applyMove, applyRoll } from "./engine.js";
import { movedTokenIndex, rollWasApplied } from "./diff.js";

describe("movedTokenIndex", () => {
  it("finds the token that just moved", () => {
    const rolled = applyRoll(createGame(["red", "green"]), 6);
    const moved = applyMove(rolled, 2);
    expect(movedTokenIndex(rolled, moved)).toBe(2);
  });

  it("is null when nothing moved", () => {
    const fresh = createGame(["red", "green"]);
    const rolled = applyRoll(fresh, 6);
    expect(movedTokenIndex(fresh, rolled)).toBeNull(); // a roll is not a move
    expect(movedTokenIndex(rolled, rolled)).toBeNull();
  });
});

describe("rollWasApplied", () => {
  it("is true when a roll opens the move phase", () => {
    const fresh = createGame(["red", "green"]);
    expect(rollWasApplied(fresh, applyRoll(fresh, 6))).toBe(true);
  });

  it("is true when a roll passes the turn because nothing can move", () => {
    const fresh = createGame(["red", "green"]);
    expect(rollWasApplied(fresh, applyRoll(fresh, 3))).toBe(true);
  });

  it("is false when the state did not change", () => {
    const fresh = createGame(["red", "green"]);
    expect(rollWasApplied(fresh, fresh)).toBe(false);
  });
});