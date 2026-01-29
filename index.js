import app from "./app.js";
import { initSocket } from "./Socket/Socket.js";
import http from "http";

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// 🔥 socket.io
initSocket(server);


server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
