import { createGameServer } from "./server.js";

const port = Number(process.env.PORT) || 3001;

createGameServer().httpServer.listen(port, () => {
  console.log(`Arcadia server listening on http://localhost:${port}`);
});