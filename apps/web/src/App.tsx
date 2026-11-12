import { useState } from "react";
import { createGame, applyRoll, applyMove, getLegalMoves, rollDice, YARD, HOME } from "@arcadia/game-core";
import type { GameState } from "@arcadia/game-core";

const COLORS = ["red", "green", "yellow", "blue"] as const;

export default function App() {
  const [game, setGame] = useState<GameState>(() => createGame([...COLORS]));

  const current = game.players[game.turn];
  const legal =
    game.phase === "move" && game.dice !== null ? getLegalMoves(game, game.dice) : [];

  function handleRoll() {
    setGame(applyRoll(game, rollDice()));
  }

  function handleMove(tokenIndex: number) {
    setGame(applyMove(game, tokenIndex));
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1>Arcadia · Ludo</h1>

      {game.phase === "finished" ? (
        <h2>{game.winner} wins!</h2>
      ) : (
        <p>
          Turn: <strong>{current.color}</strong> · Dice: {game.dice ?? "-"}
        </p>
      )}

      <button onClick={handleRoll} disabled={game.phase !== "roll"}>
        Roll dice
      </button>{" "}
      <button onClick={() => setGame(createGame([...COLORS]))}>New game</button>

      <ul>
        {game.players.map((player) => (
          <li key={player.color}>
            <strong>{player.color}</strong>:{" "}
            {player.tokens.map((progress, index) => (
              <button
                key={index}
                onClick={() => handleMove(index)}
                disabled={player.color !== current.color || !legal.includes(index)}
              >
                {progress === YARD ? "yard" : progress === HOME ? "home" : progress}
              </button>
            ))}
          </li>
        ))}
      </ul>
    </main>
  );
}