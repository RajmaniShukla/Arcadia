import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  Ack,
  ClientToServerEvents,
  JoinedInfo,
  RoomSnapshot,
  ServerToClientEvents,
} from "@arcadia/game-core";

type ArcadiaSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export type ConnectionStatus = "connecting" | "online" | "offline";

interface Session {
  code: string;
  token: string;
}

// Same machine that served the page, port 3001. Override with VITE_SERVER_URL when deploying.
const SERVER_URL: string =
  import.meta.env.VITE_SERVER_URL ?? `http://${window.location.hostname}:3001`;
const SESSION_KEY = "arcadia:session";

function loadSession(): Session | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    if (typeof parsed === "object" && parsed !== null) {
      const { code, token } = parsed as Record<string, unknown>;
      if (typeof code === "string" && typeof token === "string") return { code, token };
    }
  } catch {
    // storage blocked or corrupted: behave as if there is no saved game
  }
  return null;
}

function saveSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // private mode can refuse storage; the game still works, it just can't resume
  }
}

export function useRoom() {
  const socketRef = useRef<ArcadiaSocket | null>(null);
  const inFlight = useRef(false);

  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [restoring, setRestoring] = useState(() => loadSession() !== null);
  const [me, setMe] = useState<JoinedInfo | null>(null);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket: ArcadiaSocket = io(SERVER_URL);
    socketRef.current = socket;

    // "connect" fires on the first connection AND after every automatic reconnect.
    // A reconnect is a brand-new connection to the server, so we must reclaim our seat each time.
    socket.on("connect", () => {
      setStatus("online");
      const session = loadSession();
      if (!session) {
        setRestoring(false);
        return;
      }
      void socket.emitWithAck("room:rejoin", session).then((res) => {
        setRestoring(false);
        if (res.ok) {
          setMe({ code: res.code, token: res.token, seat: res.seat, color: res.color });
        } else {
          saveSession(null);
          setMe(null);
          setSnapshot(null);
          setError("Your previous game is no longer available.");
        }
      });
    });

    socket.on("disconnect", () => setStatus("offline"));
    socket.on("room:state", (next) => setSnapshot(next));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const enter = useCallback((res: Ack<JoinedInfo>) => {
    if (!res.ok) {
      setError(res.error);
      return;
    }
    saveSession({ code: res.code, token: res.token });
    setMe({ code: res.code, token: res.token, seat: res.seat, color: res.color });
    setError(null);
  }, []);

  const createRoom = useCallback(
    async (playerCount: number) => {
      const res = await socketRef.current?.emitWithAck("room:create", { playerCount });
      if (res) enter(res);
    },
    [enter]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const res = await socketRef.current?.emitWithAck("room:join", { code: code.trim() });
      if (res) enter(res);
    },
    [enter]
  );

  // inFlight stops a double-click from sending the same action twice.
  const roll = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await socketRef.current?.emitWithAck("game:roll");
      if (res) setError(res.ok ? null : res.error);
    } finally {
      inFlight.current = false;
    }
  }, []);

  const move = useCallback(async (tokenIndex: number) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await socketRef.current?.emitWithAck("game:move", { tokenIndex });
      if (res) setError(res.ok ? null : res.error);
    } finally {
      inFlight.current = false;
    }
  }, []);

  const leave = useCallback(() => {
    saveSession(null);
    setMe(null);
    setSnapshot(null);
    setError(null);
    // A fresh connection is no longer in the room. (The seat stays taken on the server; see the gaps list.)
    socketRef.current?.disconnect().connect();
  }, []);

  return { status, restoring, me, snapshot, error, createRoom, joinRoom, roll, move, leave };
}