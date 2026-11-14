import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Ack, ClientToServerEvents, JoinedInfo, ServerToClientEvents } from "@arcadia/game-core";
import { fail } from "./rooms.js";
import type { Rooms } from "./rooms.js";

interface SocketData {
  code?: string; // the room this connection is in
  seat?: number; // the seat it controls
}

/** Read a field from untrusted input without assuming its shape. */
function field(input: unknown, key: string): unknown {
  return typeof input === "object" && input !== null
    ? (input as Record<string, unknown>)[key]
    : undefined;
}

/** Answer the client's acknowledgement callback, if it actually sent one. */
function reply(ack: unknown, result: Ack): void {
  if (typeof ack === "function") ack(result);
}

export function attachRealtime(httpServer: HttpServer, rooms: Rooms) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    { cors: { origin: "*" } } // wide open for development; we'll restrict it before deploying
  );

  function broadcast(code: string): void {
    const snapshot = rooms.snapshot(code);
    if (snapshot) io.to(code).emit("room:state", snapshot);
  }

  io.on("connection", (socket) => {
    async function enterRoom(ack: unknown, attempt: () => Ack<JoinedInfo>): Promise<void> {
      if (socket.data.code !== undefined) {
        reply(ack, fail("already in a room"));
        return;
      }
      const result = attempt();
      if (result.ok) {
        socket.data.code = result.code;
        socket.data.seat = result.seat;
        await socket.join(result.code);
        broadcast(result.code); // state first...
      }
      reply(ack, result); // ...acknowledgement second
    }

    socket.on("room:create", (req, ack) => {
      const playerCount = field(req, "playerCount");
      void enterRoom(ack, () =>
        typeof playerCount === "number"
          ? rooms.create(playerCount, socket.id)
          : fail("playerCount must be a number")
      );
    });

    socket.on("room:join", (req, ack) => {
      const code = field(req, "code");
      void enterRoom(ack, () =>
        typeof code === "string" ? rooms.join(code, socket.id) : fail("code must be a string")
      );
    });

    socket.on("room:rejoin", (req, ack) => {
      const code = field(req, "code");
      const token = field(req, "token");
      void enterRoom(ack, () =>
        typeof code === "string" && typeof token === "string"
          ? rooms.rejoin(code, token, socket.id)
          : fail("code and token must be strings")
      );
    });

    socket.on("game:roll", (ack) => {
      const { code, seat } = socket.data;
      if (code === undefined || seat === undefined) {
        reply(ack, fail("join a room first"));
        return;
      }
      const result = rooms.roll(code, seat);
      if (result.ok) broadcast(code);
      reply(ack, result);
    });

    socket.on("game:move", (req, ack) => {
      const { code, seat } = socket.data;
      if (code === undefined || seat === undefined) {
        reply(ack, fail("join a room first"));
        return;
      }
      const tokenIndex = field(req, "tokenIndex");
      if (typeof tokenIndex !== "number" || !Number.isInteger(tokenIndex)) {
        reply(ack, fail("tokenIndex must be an integer"));
        return;
      }
      const result = rooms.move(code, seat, tokenIndex);
      if (result.ok) broadcast(code);
      reply(ack, result);
    });

    socket.on("disconnect", () => {
      const { code, seat } = socket.data;
      if (code === undefined || seat === undefined) return;
      rooms.release(code, seat, socket.id);
      broadcast(code);
    });
  });

  return io;
}