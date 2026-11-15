import type { ReactNode } from "react";
import Banner from "./ui/Banner";
import Button from "./ui/Button";
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
    screen = <p className="text-slate-500">Restoring your game…</p>;
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
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-3 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Arcadia <span className="font-medium text-slate-400">· Ludo</span>
          </h1>
          {room.me && (
            <Button variant="secondary" onClick={room.leave}>
              Leave
            </Button>
          )}
        </header>

        {offline && (
          <Banner tone="info">
            {room.status === "connecting"
              ? "Connecting to the server…"
              : "Connection lost, reconnecting…"}
          </Banner>
        )}
        {room.error && <Banner tone="error">{room.error}</Banner>}

        {screen}
      </div>
    </div>
  );
}