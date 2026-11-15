import { createServer } from "node:http";
import type { Rng } from "@arcadia/game-core";
import { createApp } from "./app.js";
import { createRooms } from "./rooms.js";
import type { Timing } from "./rooms.js";
import { attachRealtime } from "./realtime.js";
import { secureRng } from "./rng.js";

export function createGameServer({
  rng = secureRng,
  timing,
}: { rng?: Rng; timing?: Partial<Timing> } = {}) {
  const app = createApp({ rng });
  const httpServer = createServer(app);
  const io = attachRealtime(httpServer, createRooms(rng, timing));
  return { httpServer, io };
}