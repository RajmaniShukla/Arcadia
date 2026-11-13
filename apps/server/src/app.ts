import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import {
  COLORS,
  TOKENS_PER_PLAYER,
  applyMove,
  applyRoll,
  createGame,
  getLegalMoves,
  rollDice,
} from "@arcadia/game-core";
import type { Color, GameState, Rng } from "@arcadia/game-core";
import { secureRng } from "./rng.js";

function parsePlayers(value: unknown): Color[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4) return null;
  const known: readonly unknown[] = COLORS;
  if (!value.every((c) => known.includes(c))) return null;
  if (new Set(value).size !== value.length) return null;
  return value as Color[];
}

function isTokenIndex(value: unknown): value is number {
  return (
    Number.isInteger(value) && (value as number) >= 0 && (value as number) < TOKENS_PER_PLAYER
  );
}

function legalMovesOf(state: GameState): number[] {
  return state.phase === "move" && state.dice !== null ? getLegalMoves(state, state.dice) : [];
}

function getStatus(err: unknown): number {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 600) return status;
  }
  return 500;
}

export function createApp({ rng = secureRng }: { rng?: Rng } = {}) {
  const app = express();
  const games = new Map<string, GameState>(); // in memory: lost when the server restarts

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/games", (req, res) => {
    const players = parsePlayers((req.body ?? {}).players);
    if (!players) {
      res.status(400).json({
        error: "players must be 2-4 unique colors from: red, green, yellow, blue",
      });
      return;
    }
    const id = randomUUID();
    const state = createGame(players);
    games.set(id, state);
    res.status(201).json({ id, state, legalMoves: [] });
  });

  app.get("/games/:id", (req, res) => {
    const state = games.get(req.params.id);
    if (!state) {
      res.status(404).json({ error: "game not found" });
      return;
    }
    res.json({ id: req.params.id, state, legalMoves: legalMovesOf(state) });
  });

  app.post("/games/:id/roll", (req, res) => {
    const state = games.get(req.params.id);
    if (!state) {
      res.status(404).json({ error: "game not found" });
      return;
    }
    if (state.phase !== "roll") {
      res.status(409).json({ error: "cannot roll right now" });
      return;
    }

    const dice = rollDice(rng); // the SERVER decides the roll
    const next = applyRoll(state, dice);
    games.set(req.params.id, next);
    // `dice` is sent separately: if no move was possible, next.dice is already null (lesson 12).
    res.json({ id: req.params.id, dice, state: next, legalMoves: legalMovesOf(next) });
  });

  app.post("/games/:id/move", (req, res) => {
    const state = games.get(req.params.id);
    if (!state) {
      res.status(404).json({ error: "game not found" });
      return;
    }

    const tokenIndex = (req.body ?? {}).tokenIndex;
    if (!isTokenIndex(tokenIndex)) {
      res.status(400).json({ error: `tokenIndex must be an integer from 0 to ${TOKENS_PER_PLAYER - 1}` });
      return;
    }
    if (state.phase !== "move" || state.dice === null) {
      res.status(409).json({ error: "cannot move right now" });
      return;
    }
    if (!getLegalMoves(state, state.dice).includes(tokenIndex)) {
      res.status(409).json({ error: "illegal move" });
      return;
    }

    const next = applyMove(state, tokenIndex);
    games.set(req.params.id, next);
    res.json({ id: req.params.id, state: next, legalMoves: legalMovesOf(next) });
  });

  // Anything that matched no route above.
  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });

  // Error handler: Express recognizes it by its FOUR parameters, so `_next` must stay.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = getStatus(err);
    if (status >= 500) console.error(err); // log the details privately...
    res.status(status).json({ error: status >= 500 ? "internal server error" : "bad request" }); // ...but never leak them
  });

  return app;
}