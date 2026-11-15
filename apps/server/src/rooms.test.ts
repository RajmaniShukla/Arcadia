import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Ack } from "@arcadia/game-core";
import { createRooms } from "./rooms.js";
import type { Rooms } from "./rooms.js";

const alwaysSix = () => 0.99;

function must<T extends object>(res: Ack<T>) {
  if (!res.ok) throw new Error(`expected ok, got: ${res.error}`);
  return res;
}

function setup() {
  const rooms = createRooms(alwaysSix, { turnMs: 1000, awayMs: 200, botMs: 50, emptyRoomMs: 5000 });
  const changed: string[] = [];
  rooms.subscribe((code) => changed.push(code));
  return { rooms, changed };
}

function startGame(rooms: Rooms) {
  const a = must(rooms.create(2, "sock-a")); // red
  const b = must(rooms.join(a.code, "sock-b")); // yellow
  return { code: a.code, a, b };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("turn clock", () => {
  it("auto-rolls for a connected player who runs out of time", () => {
    const { rooms, changed } = setup();
    const { code } = startGame(rooms);

    vi.advanceTimersByTime(999);
    expect(rooms.snapshot(code)?.lastRoll).toBeNull(); // still waiting

    vi.advanceTimersByTime(1);
    expect(rooms.snapshot(code)?.lastRoll).toEqual({ color: "red", dice: 6 });
    expect(changed).toContain(code); // listeners were told
  });

  it("keeps playing for an idle player, one decision per timeout", () => {
    const { rooms } = setup();
    const { code } = startGame(rooms);

    vi.advanceTimersByTime(1000); // auto-roll
    vi.advanceTimersByTime(1000); // auto-move
    const game = rooms.snapshot(code)!.game!;
    expect(game.players[0].tokens[0]).toBe(0);
    expect(game.turn).toBe(0); // a 6 grants another turn
  });

  it("restarts the clock when the player acts in time", () => {
    const { rooms } = setup();
    const { code } = startGame(rooms);

    vi.advanceTimersByTime(900);
    expect(rooms.roll(code, 0)).toEqual({ ok: true }); // a manual roll just before the deadline

    vi.advanceTimersByTime(900); // t=1800: the OLD timer would have fired at 1000
    expect(rooms.snapshot(code)!.game!.phase).toBe("move"); // no automatic move happened yet
  });

  it("gives a disconnected player a shorter clock", () => {
    const { rooms } = setup();
    const { code } = startGame(rooms);
    rooms.release(code, 0, "sock-a");

    vi.advanceTimersByTime(199);
    expect(rooms.snapshot(code)?.lastRoll).toBeNull();
    vi.advanceTimersByTime(1);
    expect(rooms.snapshot(code)?.lastRoll).not.toBeNull();
  });
});

describe("leaving", () => {
  it("replaces a player who leaves mid-game with a bot that acts quickly", () => {
    const { rooms } = setup();
    const { code } = startGame(rooms);

    expect(rooms.leave(code, 0, "sock-a")).toEqual({ ok: true });
    expect(rooms.snapshot(code)!.seats[0]).toMatchObject({ occupied: true, bot: true, connected: false });

    vi.advanceTimersByTime(50);
    expect(rooms.snapshot(code)?.lastRoll?.color).toBe("red");
  });

  it("frees the seat when someone leaves the lobby", () => {
    const { rooms } = setup();
    const a = must(rooms.create(3, "sock-a"));
    const b = must(rooms.join(a.code, "sock-b"));

    rooms.leave(a.code, b.seat, "sock-b");
    expect(rooms.snapshot(a.code)!.seats[1].occupied).toBe(false);
    expect(rooms.join(a.code, "sock-c")).toMatchObject({ ok: true, seat: 1 });
  });

  it("refuses new players once the game has started", () => {
    const { rooms } = setup();
    const { code } = startGame(rooms);
    rooms.leave(code, 1, "sock-b");
    expect(rooms.join(code, "sock-c")).toEqual({ ok: false, error: "the game has already started" });
  });
});

describe("cleanup", () => {
  it("pauses, then deletes, a room nobody is connected to", () => {
    const { rooms } = setup();
    const { code } = startGame(rooms);
    rooms.release(code, 0, "sock-a");
    rooms.release(code, 1, "sock-b");

    vi.advanceTimersByTime(4999);
    expect(rooms.snapshot(code)).not.toBeNull();
    expect(rooms.snapshot(code)!.lastRoll).toBeNull(); // paused: no auto-play happened

    vi.advanceTimersByTime(1);
    expect(rooms.snapshot(code)).toBeNull();
  });

  it("keeps the room if someone comes back in time", () => {
    const { rooms } = setup();
    const { code, a } = startGame(rooms);
    rooms.release(code, 0, "sock-a");
    rooms.release(code, 1, "sock-b");

    vi.advanceTimersByTime(4000);
    must(rooms.rejoin(code, a.token, "sock-a2"));

    vi.advanceTimersByTime(10_000);
    expect(rooms.snapshot(code)).not.toBeNull();
  });
});