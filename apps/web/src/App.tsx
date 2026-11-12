import { useState } from "react";
import { createGame, applyRoll, applyMove, getLegalMoves, rollDice } from "@arcadia/game-core";
import type { GameState } from "@arcadia/game-core";
import Board from "./board/Board";

const PLAYERS = ["red", "green", "yellow", "blue"] as const;

export default function App() {
  const [game, setGame] = useState<GameState>(() => createGame([...PLAYERS]));

  const current = game.players[game.turn];
  const legal =
    game.phase === "move" && game.dice !== null ? getLegalMoves(game, game.dice) : [];

  return (
    <main style={{ padding: 16, fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h1>Arcadia · Ludo</h1>

      <Board game={game} legal={legal} onTokenClick={(i) => setGame(applyMove(game, i))} />

      <p>
        {game.phase === "finished" ? (
          <strong>{game.winner} wins!</strong>
        ) : (
          <>
            Turn: <strong>{current.color}</strong> · Dice: {game.dice ?? "-"}
          </>
        )}
      </p>

      <button onClick={() => setGame(applyRoll(game, rollDice()))} disabled={game.phase !== "roll"}>
        Roll dice
      </button>{" "}
      <button onClick={() => setGame(createGame([...PLAYERS]))}>New game</button>
    </main>
  );
}