import type { GameState, JoinedInfo, RoomSnapshot } from "@arcadia/game-core";
import Board from "./board/Board";
import Dice from "./board/Dice";
import { FILL } from "./board/colors";
import { useCountdown } from "./useCountdown";

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
  const finished = game.phase === "finished";
  const myTurn = !finished && game.turn === me.seat;
  const legal = myTurn && !blocked ? snapshot.legalMoves : [];
  const lastRoll = snapshot.lastRoll;
  const secondsLeft = useCountdown(snapshot);
  const currentSeat = snapshot.seats[game.turn];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="rounded-2xl bg-white p-2 shadow-sm sm:p-3 lg:flex-1">
        <Board game={game} legal={legal} onTokenClick={onMove} />
      </div>

      <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
        <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <Dice
            value={face}
            rolling={rolling}
            disabled={blocked || !myTurn || game.phase !== "roll"}
            onRoll={onRoll}
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold">
              {finished
                ? game.winner === me.color
                  ? "You win!"
                  : `${game.winner} wins`
                : myTurn
                  ? "Your turn"
                  : `${current.color}'s turn`}
            </p>
            <p className="text-sm text-slate-500">
              {lastRoll ? `${lastRoll.color} rolled ${lastRoll.dice}` : "No rolls yet"}
            </p>
            {!finished && !currentSeat.bot && secondsLeft !== null && (
              <p
                className={`text-sm font-medium ${
                  secondsLeft <= 5 ? "text-red-600" : "text-slate-500"
                }`}
              >
                ⏱ {secondsLeft}s left
              </p>
            )}
          </div>
        </section>

        <ul className="flex flex-wrap gap-2">
          {snapshot.seats.map((seat) => {
            const isMe = seat.color === me.color;
            return (
              <li
                key={seat.color}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm capitalize ring-1 ${
                  isMe
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-300"
                }`}
              >
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: FILL[seat.color] }}
                />
                {isMe ? "You" : seat.color}
                {!finished && seat.color === current.color && <span aria-label="current turn">▶</span>}
                {seat.bot && <span className="text-xs opacity-70">(bot)</span>}
                {!seat.bot && !seat.connected && <span className="text-xs opacity-70">(away)</span>}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}