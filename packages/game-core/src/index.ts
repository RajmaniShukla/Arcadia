export * from "./board.js";
export * from "./state.js";
export * from "./moves.js";

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}