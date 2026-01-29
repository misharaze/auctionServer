import { query } from "../db/index.js";

export const getMyNotifications = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await query(
    `
    SELECT *
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 100
    `,
    [userId]
  );

  res.json(rows);
};

export const markAllRead = async (req, res) => {
  const userId = req.user.id;

  await query(
    `
    UPDATE notifications
    SET read = true
    WHERE user_id = $1
    `,
    [userId]
  );

  res.json({ ok: true });
};
