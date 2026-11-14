import type { RoomSnapshot } from "@arcadia/game-core";

export default function WaitingRoom({ snapshot }: { snapshot: RoomSnapshot }) {
  const filled = snapshot.seats.filter((s) => s.occupied).length;

  return (
    <section>
      <h2>
        Room code:{" "}
        <span style={{ fontFamily: "monospace", letterSpacing: 4 }}>{snapshot.code}</span>
      </h2>
      <p>
        Share this code. Waiting for players ({filled}/{snapshot.seats.length})…
      </p>
      <ul>
        {snapshot.seats.map((seat) => (
          <li key={seat.color}>
            {seat.color}: {seat.occupied ? (seat.connected ? "joined" : "away") : "empty"}
          </li>
        ))}
      </ul>
    </section>
  );
}