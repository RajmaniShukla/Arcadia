export * from "./board.js";

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}