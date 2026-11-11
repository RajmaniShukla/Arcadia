import { describe, it, expect } from "vitest";
import { createGame } from "./state.js";
import { applyMove } from "./engine.js";

function setup(red: number[], green: number[], dice: number) {
  const game = createGame(["red", "green"]);
  game.players[0].tokens = red;
  game.players[1].tokens = green;
  return { ...game, dice, phase: "move" as const };
}

describe("captures", () => {
  it("sends an opponent token back to the yard and grants an extra turn", () => {
    // red 2 -> 5 lands on square 5; green progress 44 is square (13+44)%52 = 5
    const next = applyMove(setup([2, -1, -1, -1], [44, -1, -1, -1], 3), 0);
    expect(next.players[0].tokens[0]).toBe(5);
    expect(next.players[1].tokens[0]).toBe(-1);
    expect(next.turn).toBe(0);
    expect(next.phase).toBe("roll");
  });

  it("does not capture on a safe square", () => {
    // red 5 -> 8 lands on square 8 (a star); green progress 47 is square 8
    const next = applyMove(setup([5, -1, -1, -1], [47, -1, -1, -1], 3), 0);
    expect(next.players[1].tokens[0]).toBe(47);
    expect(next.turn).toBe(1); // no capture, no 6, so the turn passes
  });

  it("does not capture the mover's own tokens", () => {
    const next = applyMove(setup([2, 5, -1, -1], [-1, -1, -1, -1], 3), 0);
    expect(next.players[0].tokens).toEqual([5, 5, -1, -1]);
  });
});

