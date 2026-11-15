import { useEffect, useState } from "react";
import type { RoomSnapshot } from "@arcadia/game-core";

/** Whole seconds left on the turn clock, counting down locally from what the server sent. */
export function useCountdown(snapshot: RoomSnapshot | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const msLeft = snapshot?.turnMsLeft ?? null;
    if (msLeft === null) {
      setSecondsLeft(null);
      return;
    }

    // Measured on THIS device's clock, so a wrong system clock can't skew the display.
    const deadline = Date.now() + msLeft;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id); // stop the old interval whenever a new snapshot arrives
  }, [snapshot]);

  return secondsLeft;
}