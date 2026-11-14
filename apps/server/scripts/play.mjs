import readline from "node:readline";
import { io } from "socket.io-client";

const [, , action, arg] = process.argv; // "create 2"  or  "join CODE"
const socket = io("http://127.0.0.1:3001");

socket.on("room:state", (s) => {
  console.log(`\n--- room ${s.code} ---`);
  console.log("seats:", s.seats.map((x) => x.color + (x.occupied ? (x.connected ? "" : " (away)") : " (empty)")).join(", "));
  if (!s.game) return;
  const g = s.game;
  console.log("turn:", g.players[g.turn].color, "| phase:", g.phase, "| winner:", g.winner ?? "-");
  console.log("last roll:", s.lastRoll ? `${s.lastRoll.color} rolled ${s.lastRoll.dice}` : "-");
  console.log("legal moves:", s.legalMoves.join(", ") || "-");
  for (const p of g.players) console.log(" ", p.color.padEnd(7), p.tokens.join(" "));
});

socket.on("connect", async () => {
  const res =
    action === "create"
      ? await socket.emitWithAck("room:create", { playerCount: Number(arg) })
      : await socket.emitWithAck("room:join", { code: arg });
  console.log(res.ok ? `You are ${res.color} in room ${res.code}` : `Error: ${res.error}`);
  console.log("Commands: roll | move <0-3> | quit");
});

readline.createInterface({ input: process.stdin }).on("line", async (line) => {
  const [cmd, n] = line.trim().split(/\s+/);
  if (cmd === "quit") process.exit(0);
  const res =
    cmd === "roll"
      ? await socket.emitWithAck("game:roll")
      : cmd === "move"
        ? await socket.emitWithAck("game:move", { tokenIndex: Number(n) })
        : { ok: false, error: "unknown command" };
  if (!res.ok) console.log("Refused:", res.error);
});