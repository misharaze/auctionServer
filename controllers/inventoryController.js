// server/controllers/inventoryController.js
import { query } from "../db/index.js";

export const getMyInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await query(
      `
      SELECT 
        inv.id,                 -- inventory id (нужно для апгрейда)
        inv.status,
        inv.created_at,
        i.id   AS item_id,
        i.name AS name,
        i.price AS price,
        COALESCE(i.image_url, i.image, NULL) AS image
      FROM inventory inv
      JOIN items i ON i.id = inv.item_id
      WHERE inv.user_id = $1
      ORDER BY inv.created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (e) {
    console.error("getMyInventory error:", e);
    res.status(500).json({ error: "Failed to load inventory" });
  }
};
