import { randomInt, randomUUID } from "node:crypto";
import {
  applyMove,
  applyRoll,
  createGame,
  currentLegalMoves,
  rollDice,
  seatColors,
} from "@arcadia/game-core";
import type { Ack, Color, GameState, JoinedInfo, Rng, RoomSnapshot } from "@arcadia/game-core";

interface Seat {
  color: Color;
  token: string | null; // secret proving ownership; null = empty seat
  socketId: string | null; // the live connection sitting here; null = player is away
}

interface Room {
  code: string;
  seats: Seat[];
  game: GameState | null;
  lastRoll: { color: Color; dice: number } | null;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes

export const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

export function createRooms(rng: Rng) {
  const rooms = new Map<string, Room>();

  function newCode(): string {
    for (;;) {
      const code = Array.from(
        { length: 5 },
        () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
      ).join("");
      if (!rooms.has(code)) return code;
    }
  }

  function sit(room: Room, seatIndex: number, socketId: string): JoinedInfo {
    const seat = room.seats[seatIndex];
    const token = randomUUID();
    seat.token = token;
    seat.socketId = socketId;

    // Seat order = player order, so seat index === turn index in the game.
    if (room.game === null && room.seats.every((s) => s.token !== null)) {
      room.game = createGame(room.seats.map((s) => s.color));
    }
    return { code: room.code, token, seat: seatIndex, color: seat.color };
  }

  function create(playerCount: number, socketId: string): Ack<JoinedInfo> {
    const colors = seatColors(playerCount);
    if (!colors) return fail("playerCount must be 2, 3 or 4");

    const room: Room = {
      code: newCode(),
      seats: colors.map((color) => ({ color, token: null, socketId: null })),
      game: null,
      lastRoll: null,
    };
    rooms.set(room.code, room);
    return { ok: true, ...sit(room, 0, socketId) };
  }

  function join(code: string, socketId: string): Ack<JoinedInfo> {
    const room = rooms.get(code.toUpperCase());
    if (!room) return fail("room not found");
    const free = room.seats.findIndex((s) => s.token === null);
    if (free === -1) return fail("room is full");
    return { ok: true, ...sit(room, free, socketId) };
  }

  function rejoin(code: string, token: string, socketId: string): Ack<JoinedInfo> {
    const room = rooms.get(code.toUpperCase());
    if (!room) return fail("room not found");
    const seatIndex = room.seats.findIndex((s) => s.token === token);
    if (seatIndex === -1) return fail("invalid token");
    room.seats[seatIndex].socketId = socketId;
    return { ok: true, code: room.code, token, seat: seatIndex, color: room.seats[seatIndex].color };
  }

  /** A connection left. Only clears the seat if THAT connection still holds it. */
  function release(code: string, seat: number, socketId: string): void {
    const s = rooms.get(code)?.seats[seat];
    if (s && s.socketId === socketId) s.socketId = null;
  }

  function roll(code: string, seat: number): Ack {
    const room = rooms.get(code);
    const game = room?.game;
    if (!room || !game) return fail("the game has not started");
    if (game.turn !== seat) return fail("not your turn");
    if (game.phase !== "roll") return fail("cannot roll right now");

    const dice = rollDice(rng); // the server decides, using the injected source
    room.lastRoll = { color: game.players[game.turn].color, dice };
    room.game = applyRoll(game, dice);
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
    return { ok: true };
  }

  function snapshot(code: string): RoomSnapshot | null {
    const room = rooms.get(code);
    if (!room) return null;
    return {
      code: room.code,
      seats: room.seats.map((s) => ({
        color: s.color,
        occupied: s.token !== null,
        connected: s.socketId !== null,
      })),
      game: room.game,
      legalMoves: room.game ? currentLegalMoves(room.game) : [],
      lastRoll: room.lastRoll,
    };
  }

  return { create, join, rejoin, release, roll, move, snapshot };
}

export type Rooms = ReturnType<typeof createRooms>;