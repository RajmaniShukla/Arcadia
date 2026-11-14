import { useState } from "react";

interface LobbyProps {
  disabled: boolean;
  onCreate: (playerCount: number) => void;
  onJoin: (code: string) => void;
}

export default function Lobby({ disabled, onCreate, onJoin }: LobbyProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [code, setCode] = useState("");

  return (
    <section>
      <h2>Create a room</h2>
      <label>
        Players{" "}
        <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
          {[2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>{" "}
      <button disabled={disabled} onClick={() => onCreate(playerCount)}>
        Create room
      </button>

      <h2>Join a room</h2>
      <form
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
          style={{ fontFamily: "monospace", letterSpacing: 3, width: 120 }}
        />{" "}
        <button type="submit" disabled={disabled || code.length !== 5}>
          Join
        </button>
      </form>
    </section>
  );
}