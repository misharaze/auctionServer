import { query } from "../db/index.js";
import { notifyUser } from "../Socket/Notifications.socket.js";

export const createNotification = async ({
  userId,
  type,
  message,
}) => {
  const { rows } = await query(
    `
    INSERT INTO notifications (user_id, type, message)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [userId, type, message]
  );

  const notification = rows[0];

  // 🔔 real-time уведомление
  notifyUser(userId, notification);

  return notification;
};
