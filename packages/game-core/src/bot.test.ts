import { describe, it, expect } from "vitest";
import { createGame } from "./state.js";
import { chooseBotMove } from "./bot.js";

function moveState(tokens: number[], dice: number) {
  const game = createGame(["red", "green"]);
  game.players[0].tokens = tokens;
  return { ...game, dice, phase: "move" as const };
}

describe("chooseBotMove", () => {
  it("returns null when nothing can move", () => {
    expect(chooseBotMove(moveState([-1, -1, -1, -1], 3))).toBeNull();
  });

  it("finishes a token when it can", () => {
    expect(chooseBotMove(moveState([54, 10, -1, -1], 2))).toBe(0);
  });

  it("brings a token out of the yard on a 6 before advancing others", () => {
    expect(chooseBotMove(moveState([-1, 20, 30, -1], 6))).toBe(0);
  });

  it("otherwise advances the most advanced token", () => {
    expect(chooseBotMove(moveState([5, 30, 12, -1], 3))).toBe(1);
  });
});