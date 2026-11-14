import { createServer } from "node:http";
import type { Rng } from "@arcadia/game-core";
import { createApp } from "./app.js";
import { createRooms } from "./rooms.js";
import { attachRealtime } from "./realtime.js";
import { secureRng } from "./rng.js";

export function createGameServer({ rng = secureRng }: { rng?: Rng } = {}) {
  const app = createApp({ rng });
  const httpServer = createServer(app);
  const io = attachRealtime(httpServer, createRooms(rng));
  return { httpServer, io };
}