import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";

let ioInstance = null;

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
       methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ✅ auth middleware для socket
  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const payload = verifyToken(token);
      socket.user = payload; // { id, ... }
      socket.join(`user:${payload.id}`); // личная комната для уведомлений
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  ioInstance.on("connection", (socket) => {
    // ✅ подписка на аукцион-комнату
    socket.on("join-auction", (auctionId) => {
      socket.join(`auction:${auctionId}`);
    });

    // можно добавить leave-auction, если нужно
    socket.on("leave-auction", (auctionId) => {
      socket.leave(`auction:${auctionId}`);
    });
  });
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};

export const emitAuctionEvent = (auctionId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`auction:${auctionId}`).emit(event, payload);
};
