import { useState } from "react";
import { createGame, applyRoll, applyMove, getLegalMoves, rollDice } from "@arcadia/game-core";
import type { GameState } from "@arcadia/game-core";
import Board from "./board/Board";
import Dice from "./board/Dice";
import { sleep, walkFrames } from "./board/animation";

const PLAYERS = ["red", "green", "yellow", "blue"] as const;

type Anim = "idle" | "rolling" | "walking";

export default function App() {
  const [game, setGame] = useState<GameState>(() => createGame([...PLAYERS])); // the truth
  const [shown, setShown] = useState<GameState>(game); // what the board draws
  const [anim, setAnim] = useState<Anim>("idle");
  const [face, setFace] = useState(1);
  const [message, setMessage] = useState("");

  const busy = anim !== "idle";
  const current = game.players[game.turn];
  const legal =
    game.phase === "move" && game.dice !== null ? getLegalMoves(game, game.dice) : [];

  async function handleRoll() {
    if (busy) return;
    setAnim("rolling");

    const value = rollDice(); // the real result is decided first
    for (let i = 0; i < 6; i++) {
      setFace(1 + Math.floor(Math.random() * 6)); // cosmetic shuffle only
      await sleep(70);
    }
    setFace(value);

    const next = applyRoll(game, value);
    setGame(next);
    setShown(next);
    setMessage(
      next.phase === "move"
        ? `${current.color} rolled ${value}`
        : `${current.color} rolled ${value}, no move possible`
    );
    setAnim("idle");
  }

  async function handleMove(tokenIndex: number) {
    if (busy) return;
    setAnim("walking");

    const next = applyMove(game, tokenIndex);
    for (const frame of walkFrames(game, tokenIndex)) {
      setShown(frame);
      await sleep(160);
    }
    setGame(next);
    setShown(next);
    setAnim("idle");
  }

  function handleNewGame() {
    const fresh = createGame([...PLAYERS]);
    setGame(fresh);
    setShown(fresh);
    setFace(1);
    setMessage("");
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h1>Arcadia · Ludo</h1>

      <Board game={shown} legal={busy ? [] : legal} onTokenClick={handleMove} />

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
        <Dice
          value={face}
          rolling={anim === "rolling"}
          disabled={busy || game.phase !== "roll"}
          onRoll={handleRoll}
        />
        <div>
          <p style={{ margin: 0 }}>
            {game.phase === "finished" ? (
              <strong>{game.winner} wins!</strong>
            ) : (
              <>
                Turn: <strong>{current.color}</strong>
              </>
            )}
          </p>
          <p style={{ margin: "4px 0 0" }}>{message}</p>
        </div>
      </div>

      <p>
        <button onClick={handleNewGame} disabled={busy}>
          New game
        </button>
      </p>
    </main>
  );
}