import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

const alwaysSix = () => 0.99; // a fake random source: floor(0.99 * 6) + 1 = 6

async function newGame(app: ReturnType<typeof createApp>) {
  const res = await request(app).post("/games").send({ players: ["red", "green"] });
  return res.body.id as string;
}

describe("server", () => {
  it("answers the health check", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rejects invalid players", async () => {
    const res = await request(createApp()).post("/games").send({ players: ["red"] });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown game", async () => {
    const res = await request(createApp()).get("/games/nope");
    expect(res.status).toBe(404);
  });

  it("plays a roll and a move, with the server choosing the dice", async () => {
    const app = createApp({ rng: alwaysSix });
    const id = await newGame(app);

    const roll = await request(app).post(`/games/${id}/roll`);
    expect(roll.status).toBe(200);
    expect(roll.body.dice).toBe(6);
    expect(roll.body.legalMoves).toEqual([0, 1, 2, 3]);

    const move = await request(app).post(`/games/${id}/move`).send({ tokenIndex: 0 });
    expect(move.status).toBe(200);
    expect(move.body.state.players[0].tokens[0]).toBe(0);
    expect(move.body.state.turn).toBe(0); // a 6 grants an extra turn
  });

  it("refuses to roll twice in a row", async () => {
    const app = createApp({ rng: alwaysSix });
    const id = await newGame(app);
    await request(app).post(`/games/${id}/roll`);
    const again = await request(app).post(`/games/${id}/roll`);
    expect(again.status).toBe(409);
  });

  it("refuses to move before rolling, and rejects a bad token index", async () => {
    const app = createApp();
    const id = await newGame(app);

    const early = await request(app).post(`/games/${id}/move`).send({ tokenIndex: 0 });
    expect(early.status).toBe(409);

    const bad = await request(app).post(`/games/${id}/move`).send({ tokenIndex: 9 });
    expect(bad.status).toBe(400);
  });
});