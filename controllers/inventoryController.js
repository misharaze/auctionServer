import { pool } from "../db/index.js";

export const getMyInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(`
      SELECT
        ui.id AS inventory_id,
        i.id AS item_id,
        i.name,
        i.image_url,
        i.price,
        i.rarity,
        ui.created_at
      FROM user_items ui
      JOIN items i ON i.id = ui.item_id
      WHERE ui.user_id = $1
      ORDER BY ui.created_at DESC
    `, [userId]);

    res.json(rows);
  } catch (e) {
    console.error("getMyInventory error:", e);
    res.status(500).json({ error: "Failed to load inventory" });
  }
};