import type { GameState, JoinedInfo, RoomSnapshot } from "@arcadia/game-core";
import Board from "./board/Board";
import Dice from "./board/Dice";

interface GameScreenProps {
  snapshot: RoomSnapshot;
  game: GameState;
  me: JoinedInfo;
  face: number;
  rolling: boolean;
  blocked: boolean; // an animation is playing or the connection is down
  onRoll: () => void;
  onMove: (tokenIndex: number) => void;
}

export default function GameScreen({
  snapshot,
  game,
  me,
  face,
  rolling,
  blocked,
  onRoll,
  onMove,
}: GameScreenProps) {
  const current = game.players[game.turn];
  const myTurn = game.phase !== "finished" && game.turn === me.seat;
  const legal = myTurn && !blocked ? snapshot.legalMoves : [];
  const lastRoll = snapshot.lastRoll;

  return (
    <>
      <Board game={game} legal={legal} onTokenClick={onMove} />

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
        <Dice
          value={face}
          rolling={rolling}
          disabled={blocked || !myTurn || game.phase !== "roll"}
          onRoll={onRoll}
        />
        <div>
          <p style={{ margin: 0 }}>
            {game.phase === "finished" ? (
              <strong>{game.winner === me.color ? "You win!" : `${game.winner} wins`}</strong>
            ) : myTurn ? (
              <strong>Your turn</strong>
            ) : (
              <>
                Waiting for <strong>{current.color}</strong>
              </>
            )}
          </p>
          <p style={{ margin: "4px 0 0" }}>
            {lastRoll ? `${lastRoll.color} rolled ${lastRoll.dice}` : "No rolls yet"}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 14, color: "#555" }}>
        You are <strong>{me.color}</strong> ·{" "}
        {snapshot.seats.map((s) => `${s.color}${s.connected ? "" : " (away)"}`).join(" · ")}
      </p>
    </>
  );
}