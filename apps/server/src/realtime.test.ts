import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as connect } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { AddressInfo } from "node:net";
import type {
  Ack,
  ClientToServerEvents,
  RoomSnapshot,
  ServerToClientEvents,
} from "@arcadia/game-core";
import { createGameServer } from "./server.js";

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

let server: ReturnType<typeof createGameServer>;
let url: string;
const clients: Client[] = [];

beforeEach(async () => {
  server = createGameServer({ rng: () => 0.99 }); // always rolls a 6
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve)); // 0 = any free port
  const { port } = server.httpServer.address() as AddressInfo;
  url = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  clients.forEach((c) => c.disconnect());
  clients.length = 0;
  await server.io.close();
});

function connectClient(): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client: Client = connect(url, { transports: ["websocket"] });
    clients.push(client);
    client.on("connect", () => resolve(client));
    client.on("connect_error", reject);
  });
}

/** Resolves with the first room snapshot that satisfies `test`. Attach it BEFORE the action that causes it. */
function waitForState(client: Client, test: (s: RoomSnapshot) => boolean): Promise<RoomSnapshot> {
  return new Promise((resolve) => {
    const listener = (snapshot: RoomSnapshot) => {
      if (test(snapshot)) {
        client.off("room:state", listener);
        resolve(snapshot);
      }
    };
    client.on("room:state", listener);
  });
}

function expectOk<T extends object>(res: Ack<T>) {
  if (!res.ok) throw new Error(`expected ok, got: ${res.error}`);
  return res;
}

async function startGame() {
  const alice = await connectClient();
  const bob = await connectClient();
  const aliceInfo = expectOk(await alice.emitWithAck("room:create", { playerCount: 2 }));

  const started = Promise.all([
    waitForState(alice, (s) => s.game !== null),
    waitForState(bob, (s) => s.game !== null),
  ]);
  const bobInfo = expectOk(await bob.emitWithAck("room:join", { code: aliceInfo.code }));
  await started;
  return { alice, bob, aliceInfo, bobInfo };
}

describe("realtime", () => {
  it("seats players and starts the game when the last seat fills", async () => {
    const alice = await connectClient();
    const bob = await connectClient();

    const created = expectOk(await alice.emitWithAck("room:create", { playerCount: 2 }));
    expect(created.color).toBe("red");
    expect(created.code).toHaveLength(5);

    const aliceSees = waitForState(alice, (s) => s.game !== null);
    const bobSees = waitForState(bob, (s) => s.game !== null);
    const joined = expectOk(await bob.emitWithAck("room:join", { code: created.code }));
    expect(joined.color).toBe("yellow");

    const [a, b] = await Promise.all([aliceSees, bobSees]);
    expect(a).toEqual(b); // everyone receives the same snapshot
    expect(a.seats.every((s) => s.occupied && s.connected)).toBe(true);
    expect(JSON.stringify(a)).not.toContain(created.token); // secrets never leave the server
  });

  it("lets only the player whose turn it is roll, then tells everyone", async () => {
    const { alice, bob } = await startGame();

    const early = await bob.emitWithAck("game:roll");
    expect(early).toEqual({ ok: false, error: "not your turn" });

    const rolled = waitForState(bob, (s) => s.lastRoll !== null);
    expect((await alice.emitWithAck("game:roll")).ok).toBe(true);
    const snapshot = await rolled;
    expect(snapshot.lastRoll).toEqual({ color: "red", dice: 6 });
    expect(snapshot.game?.phase).toBe("move");
    expect(snapshot.legalMoves).toEqual([0, 1, 2, 3]);

    const moved = waitForState(bob, (s) => s.game?.players[0].tokens[0] === 0);
    expect((await alice.emitWithAck("game:move", { tokenIndex: 0 })).ok).toBe(true);
    expect((await moved).game?.turn).toBe(0); // a 6 grants an extra turn
  });

  it("rejects malformed payloads instead of crashing", async () => {
    const { alice } = await startGame();
    const bad = await alice.emitWithAck(
      "game:move",
      { tokenIndex: "0" } as unknown as { tokenIndex: number }
    );
    expect(bad.ok).toBe(false);

    const stranger = await connectClient();
    const nothing = await stranger.emitWithAck("room:join", null as unknown as { code: string });
    expect(nothing.ok).toBe(false);

    // The server survived both and still works.
    expect((await stranger.emitWithAck("room:create", { playerCount: 2 })).ok).toBe(true);
  });

  it("lets a player reclaim their seat, and a stale disconnect cannot evict them", async () => {
    const { alice, aliceInfo } = await startGame();
    const alice2 = await connectClient(); // e.g. the page was refreshed

    const wrong = await alice2.emitWithAck("room:rejoin", { code: aliceInfo.code, token: "nope" });
    expect(wrong.ok).toBe(false);

    const back = expectOk(
      await alice2.emitWithAck("room:rejoin", { code: aliceInfo.code, token: aliceInfo.token })
    );
    expect(back.seat).toBe(0);

    // The OLD connection dies only after the new one took the seat.
    const next = new Promise<RoomSnapshot>((resolve) => alice2.once("room:state", resolve));
    alice.disconnect();
    expect((await next).seats[0].connected).toBe(true);
  });
});