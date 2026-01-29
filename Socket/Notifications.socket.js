import { getIO } from "./Socket.js";
import { createNotification } from "../services/notification.Services.js";

export const notifyUser = async (userId, payload) => {
  const io = getIO();

  const notification = await createNotification({
    userId,
    type: payload.type,
    message: payload.message,
  });

  io.to(`user:${userId}`).emit("notification:new", notification);
};
