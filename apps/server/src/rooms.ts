import { randomInt, randomUUID } from "node:crypto";
import {
  applyMove,
  applyRoll,
  chooseBotMove,
  createGame,
  currentLegalMoves,
  rollDice,
  seatColors,
} from "@arcadia/game-core";
import type { Ack, Color, GameState, JoinedInfo, Rng, RoomSnapshot } from "@arcadia/game-core";

export interface Timing {
  turnMs: number; // how long a connected player has for each decision
  awayMs: number; // how long a disconnected player has
  botMs: number; // pause before a bot acts, so humans can follow along
  emptyRoomMs: number; // how long a room with nobody connected is kept
}

export const DEFAULT_TIMING: Timing = {
  turnMs: 30_000,
  awayMs: 8_000,
  botMs: 1_000,
  emptyRoomMs: 10 * 60_000,
};

type Timer = ReturnType<typeof setTimeout>;

interface Seat {
  color: Color;
  kind: "empty" | "human" | "bot";
  token: string | null; // secret proving ownership (humans only)
  socketId: string | null; // the live connection sitting here; null = away
}

interface Room {
  code: string;
  seats: Seat[];
  game: GameState | null;
  lastRoll: { color: Color; dice: number } | null;
  turnTimer: Timer | null;
  turnEndsAt: number | null;
  cleanupTimer: Timer | null;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes

export const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function later(ms: number, fn: () => void): Timer {
  const timer = setTimeout(fn, ms);
  timer.unref?.(); // a pending timer must never keep the process alive
  return timer;
}

export function createRooms(rng: Rng, overrides: Partial<Timing> = {}) {
  const timing: Timing = { ...DEFAULT_TIMING, ...overrides };
  const rooms = new Map<string, Room>();
  const listeners = new Set<(code: string) => void>();

  /** Hear about changes nobody asked for (a timer fired). */
  function subscribe(listener: (code: string) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function notify(code: string): void {
    for (const listener of listeners) listener(code);
  }

  function newCode(): string {
    for (;;) {
      const code = Array.from(
        { length: 5 },
        () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
      ).join("");
      if (!rooms.has(code)) return code;
    }
  }

  function destroy(code: string): void {
    const room = rooms.get(code);
    if (!room) return;
    if (room.turnTimer) clearTimeout(room.turnTimer);
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    rooms.delete(code);
  }

  /**
   * Re-plan the room's timers. Call this after ANYTHING that could change who
   * we are waiting for: a roll, a move, someone arriving, leaving or dropping.
   */
  function settle(room: Room): void {
    if (room.turnTimer) clearTimeout(room.turnTimer);
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
    room.turnTimer = null;
    room.cleanupTimer = null;
    room.turnEndsAt = null;

    // Nobody connected: pause the game and start the countdown to deletion.
    if (!room.seats.some((s) => s.socketId !== null)) {
      room.cleanupTimer = later(timing.emptyRoomMs, () => destroy(room.code));
      return;
    }

    const game = room.game;
    if (!game || game.phase === "finished") return;

    const seat = room.seats[game.turn];
    const delay =
      seat.kind === "bot" ? timing.botMs : seat.socketId !== null ? timing.turnMs : timing.awayMs;
    room.turnEndsAt = Date.now() + delay;
    room.turnTimer = later(delay, () => autoPlay(room.code));
  }

  function rollFor(room: Room, game: GameState): void {
    const dice = rollDice(rng);
    room.lastRoll = { color: game.players[game.turn].color, dice };
    room.game = applyRoll(game, dice);
  }

  /** The clock ran out (or a bot's turn came): play for the seat. */
  function autoPlay(code: string): void {
    const room = rooms.get(code);
    const game = room?.game;
    if (!room || !game || game.phase === "finished") return;
    room.turnTimer = null;

    if (game.phase === "roll") {
      rollFor(room, game);
    } else {
      const choice = chooseBotMove(game);
      if (choice !== null) room.game = applyMove(game, choice);
    }
    settle(room);
    notify(code);
  }

  function sit(room: Room, seatIndex: number, socketId: string): JoinedInfo {
    const seat = room.seats[seatIndex];
    const token = randomUUID();
    seat.kind = "human";
    seat.token = token;
    seat.socketId = socketId;

    // Seat order = player order, so seat index === turn index in the game.
    if (room.game === null && room.seats.every((s) => s.kind !== "empty")) {
      room.game = createGame(room.seats.map((s) => s.color));
    }
    settle(room);
    return { code: room.code, token, seat: seatIndex, color: seat.color };
  }

  function create(playerCount: number, socketId: string): Ack<JoinedInfo> {
    const colors = seatColors(playerCount);
    if (!colors) return fail("playerCount must be 2, 3 or 4");

    const room: Room = {
      code: newCode(),
      seats: colors.map((color) => ({
        color,
        kind: "empty" as const,
        token: null,
        socketId: null,
      })),
      game: null,
      lastRoll: null,
      turnTimer: null,
      turnEndsAt: null,
      cleanupTimer: null,
    };
    rooms.set(room.code, room);
    return { ok: true, ...sit(room, 0, socketId) };
  }

  function join(code: string, socketId: string): Ack<JoinedInfo> {
    const room = rooms.get(code.toUpperCase());
    if (!room) return fail("room not found");
    if (room.game !== null) return fail("the game has already started");
    const free = room.seats.findIndex((s) => s.kind === "empty");
    if (free === -1) return fail("room is full");
    return { ok: true, ...sit(room, free, socketId) };
  }

  function rejoin(code: string, token: string, socketId: string): Ack<JoinedInfo> {
    const room = rooms.get(code.toUpperCase());
    if (!room) return fail("room not found");
    const seatIndex = room.seats.findIndex((s) => s.kind === "human" && s.token === token);
    if (seatIndex === -1) return fail("invalid token");

    room.seats[seatIndex].socketId = socketId;
    settle(room);
    return { ok: true, code: room.code, token, seat: seatIndex, color: room.seats[seatIndex].color };
  }

  /** A connection dropped. Only counts if THAT connection still holds the seat. */
  function release(code: string, seat: number, socketId: string): void {
    const room = rooms.get(code);
    const s = room?.seats[seat];
    if (room && s && s.socketId === socketId) {
      s.socketId = null;
      settle(room);
    }
  }

  /** The player chose to leave: free the seat in a lobby, forfeit to a bot mid-game. */
  function leave(code: string, seat: number, socketId: string): Ack {
    const room = rooms.get(code);
    const s = room?.seats[seat];
    if (!room || !s || s.socketId !== socketId) return fail("you are not in that seat");

    s.socketId = null;
    s.token = null; // the old token stops working
    s.kind = room.game === null ? "empty" : "bot";

    if (room.seats.every((x) => x.kind !== "human")) {
      destroy(code); // no humans left, nothing to protect
    } else {
      settle(room);
    }
    return { ok: true };
  }

  function roll(code: string, seat: number): Ack {
    const room = rooms.get(code);
    const game = room?.game;
    if (!room || !game) return fail("the game has not started");
    if (game.turn !== seat) return fail("not your turn");
    if (game.phase !== "roll") return fail("cannot roll right now");

    rollFor(room, game);
    settle(room);
    return { ok: true };
  }

  function move(code: string, seat: number, tokenIndex: number): Ack {
    const room = rooms.get(code);
    const game = room?.game;
    if (!room || !game) return fail("the game has not started");
    if (game.turn !== seat) return fail("not your turn");
    if (game.phase !== "move") return fail("roll the dice first");
    if (!currentLegalMoves(game).includes(tokenIndex)) return fail("that token cannot move");

    room.game = applyMove(game, tokenIndex);
    settle(room);
    return { ok: true };
  }

  function snapshot(code: string): RoomSnapshot | null {
    const room = rooms.get(code);
    if (!room) return null;
    return {
      code: room.code,
      seats: room.seats.map((s) => ({
        color: s.color,
        occupied: s.kind !== "empty",
        connected: s.socketId !== null,
        bot: s.kind === "bot",
      })),
      game: room.game,
      legalMoves: room.game ? currentLegalMoves(room.game) : [],
      lastRoll: room.lastRoll,
      turnMsLeft: room.turnEndsAt === null ? null : Math.max(0, room.turnEndsAt - Date.now()),
    };
  }

  return { create, join, rejoin, release, leave, roll, move, snapshot, subscribe };
}

export type Rooms = ReturnType<typeof createRooms>;