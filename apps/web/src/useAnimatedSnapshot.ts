import { useCallback, useEffect, useRef, useState } from "react";
import { movedTokenIndex, rollWasApplied } from "@arcadia/game-core";
import type { RoomSnapshot } from "@arcadia/game-core";
import { sleep, walkFrames } from "./board/animation";

export function useAnimatedSnapshot(snapshot: RoomSnapshot | null) {
  const [view, setView] = useState<RoomSnapshot | null>(null);
  const [animating, setAnimating] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [shuffleFace, setShuffleFace] = useState(1);

  const queue = useRef<RoomSnapshot[]>([]); // snapshots waiting to be shown, in order
  const shown = useRef<RoomSnapshot | null>(null); // the latest snapshot actually on screen
  const running = useRef(false);
  const epoch = useRef(0); // bumped on reset so a half-finished animation can't resurrect old state
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setAnimating(true);

    while (queue.current.length > 0) {
      const next = queue.current.shift()!;
      const stamp = epoch.current;
      const stale = () => !alive.current || epoch.current !== stamp;
      const prev = shown.current;

      if (prev?.game && next.game && prev.code === next.code) {
        const moved = movedTokenIndex(prev.game, next.game);
        if (moved !== null) {
          for (const frame of walkFrames(prev.game, moved)) {
            if (stale()) break;
            setView({ ...prev, game: frame });
            await sleep(160);
          }
        } else if (rollWasApplied(prev.game, next.game)) {
          setRolling(true);
          for (let i = 0; i < 6 && !stale(); i++) {
            setShuffleFace(1 + Math.floor(Math.random() * 6)); // cosmetic only
            await sleep(70);
          }
          setRolling(false);
        }
      }

      if (!stale()) {
        shown.current = next; // the real, final state always wins
        setView(next);
      }
    }

    running.current = false;
    setAnimating(false);
  }, []);

  useEffect(() => {
    if (snapshot === null) {
      epoch.current += 1;
      queue.current = [];
      shown.current = null;
      setView(null);
      return;
    }
    queue.current.push(snapshot);
    void run();
  }, [snapshot, run]);

  const face = rolling ? shuffleFace : (view?.lastRoll?.dice ?? 1);
  return { view, face, rolling, animating };
}