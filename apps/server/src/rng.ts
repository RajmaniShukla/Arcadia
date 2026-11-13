import { randomInt } from "node:crypto";
import type { Rng } from "@arcadia/game-core";

/** Cryptographically secure random number in [0, 1). Unlike Math.random, it can't be predicted. */
export const secureRng: Rng = () => randomInt(0, 2 ** 32) / 2 ** 32;