import type { Color } from "./board.js";
import type { GameState } from "./state.js";

export interface SeatView {
  color: Color;
  occupied: boolean;
  connected: boolean;
}

/** Everything a client needs to draw a room. Never contains secrets. */
export interface RoomSnapshot {
  code: string;
  seats: SeatView[];
  game: GameState | null; // null until every seat is taken
  legalMoves: number[];
  lastRoll: { color: Color; dice: number } | null;
}

export interface JoinedInfo {
  code: string;
  token: string; // secret: proves you own this seat
  seat: number;
  color: Color;
}

export type Ack<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface ClientToServerEvents {
  "room:create": (req: { playerCount: number }, ack: (res: Ack<JoinedInfo>) => void) => void;
  "room:join": (req: { code: string }, ack: (res: Ack<JoinedInfo>) => void) => void;
  "room:rejoin": (req: { code: string; token: string }, ack: (res: Ack<JoinedInfo>) => void) => void;
  "game:roll": (ack: (res: Ack) => void) => void;
  "game:move": (req: { tokenIndex: number }, ack: (res: Ack) => void) => void;
}

export interface ServerToClientEvents {
  "room:state": (snapshot: RoomSnapshot) => void;
}
