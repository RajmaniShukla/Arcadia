import { useState } from "react";
import type { RoomSnapshot } from "@arcadia/game-core";
import Button from "./ui/Button";
import { FILL } from "./board/colors";

export default function WaitingRoom({ snapshot }: { snapshot: RoomSnapshot }) {
  const [copied, setCopied] = useState(false);
  const filled = snapshot.seats.filter((s) => s.occupied).length;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(snapshot.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The clipboard API is unavailable on plain http addresses (like a LAN IP); ignore.
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-5 rounded-2xl bg-white p-6 text-center shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Room code</p>
      <p className="font-mono text-5xl font-bold tracking-[0.2em] text-brand">{snapshot.code}</p>
      <Button variant="secondary" onClick={copyCode}>
        {copied ? "Copied!" : "Copy code"}
      </Button>
      <p className="text-slate-600">
        Waiting for players ({filled}/{snapshot.seats.length})
      </p>
      <ul className="flex w-full flex-col gap-2">
        {snapshot.seats.map((seat) => (
          <li
            key={seat.color}
            className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left"
          >
            <span className="size-4 rounded-full" style={{ backgroundColor: FILL[seat.color] }} />
            <span className="capitalize">{seat.color}</span>
            <span className="ml-auto text-sm text-slate-500">
              {seat.occupied ? (seat.connected ? "joined" : "away") : "empty"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}