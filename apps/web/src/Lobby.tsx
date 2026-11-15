import { useState } from "react";
import Button from "./ui/Button";

interface LobbyProps {
  disabled: boolean;
  onCreate: (playerCount: number) => void;
  onJoin: (code: string) => void;
}

export default function Lobby({ disabled, onCreate, onJoin }: LobbyProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [code, setCode] = useState("");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create a room</h2>
        <div className="flex gap-2" role="group" aria-label="Number of players">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={playerCount === n}
              onClick={() => setPlayerCount(n)}
              className={`min-h-11 flex-1 touch-manipulation rounded-xl font-semibold ring-1 ${
                playerCount === n
                  ? "bg-slate-900 text-white ring-slate-900"
                  : "bg-white text-slate-700 ring-slate-300"
              }`}
            >
              {n} players
            </button>
          ))}
        </div>
        <Button disabled={disabled} onClick={() => onCreate(playerCount)}>
          Create room
        </Button>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Join a room</h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault(); // otherwise the browser reloads the page on Enter
            onJoin(code);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={5}
            placeholder="ROOM CODE"
            aria-label="Room code"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 rounded-xl px-4 text-center font-mono text-xl uppercase tracking-[0.3em] ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <Button type="submit" disabled={disabled || code.length !== 5}>
            Join
          </Button>
        </form>
      </section>
    </div>
  );
}