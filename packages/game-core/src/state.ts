import { Color, TOKENS_PER_PLAYER, YARD } from "./board.js";

export type Phase = "roll" | "move" | "finished";

export interface Player {
  color: Color;
  tokens: number[]; // one progress value per token (see the table in lesson 4)
}

export interface GameState {
  players: Player[];
  turn: number; // index into players
  dice: number | null;
  phase: Phase;
  winner: Color | null;
}

export function createGame(colors: Color[]): GameState {
  return {
    players: colors.map((color) => ({
      color,
      tokens: Array(TOKENS_PER_PLAYER).fill(YARD),
    })),
    turn: 0,
    dice: null,
    phase: "roll",
    winner: null,
  };
}