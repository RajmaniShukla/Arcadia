import { createGameServer } from "./server.js";

const port = Number(process.env.PORT) || 3001;
const turnMs = Number(process.env.TURN_MS);

createGameServer({ timing: turnMs > 0 ? { turnMs } : {} }).httpServer.listen(port, () => {
  console.log(`Arcadia server listening on http://localhost:${port}`);
});