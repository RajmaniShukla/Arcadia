import type { ReactNode } from "react";
import GameScreen from "./GameScreen";
import Lobby from "./Lobby";
import WaitingRoom from "./WaitingRoom";
import { useAnimatedSnapshot } from "./useAnimatedSnapshot";
import { useRoom } from "./useRoom";

export default function App() {
  const room = useRoom();
  const { view, face, rolling, animating } = useAnimatedSnapshot(room.snapshot);
  const offline = room.status !== "online";

  let screen: ReactNode;
  if (room.restoring) {
    screen = <p>Restoring your game…</p>;
  } else if (!room.me || !view) {
    screen = <Lobby disabled={offline} onCreate={room.createRoom} onJoin={room.joinRoom} />;
  } else if (!view.game) {
    screen = <WaitingRoom snapshot={view} />;
  } else {
    screen = (
      <GameScreen
        snapshot={view}
        game={view.game}
        me={room.me}
        face={face}
        rolling={rolling}
        blocked={animating || offline}
        onRoll={room.roll}
        onMove={room.move}
      />
    );
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h1>Arcadia · Ludo</h1>

      {offline && (
        <p role="status">
          {room.status === "connecting" ? "Connecting to the server…" : "Connection lost, reconnecting…"}
        </p>
      )}
      {room.error && (
        <p role="alert" style={{ color: "#c62828" }}>
          {room.error}
        </p>
      )}

      {screen}

      {room.me && (
        <p>
          <button onClick={room.leave}>Leave room</button>
        </p>
      )}
    </main>
  );
}