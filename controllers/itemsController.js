import { query } from "../db/index.js";

export const getAllItems = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        id,
        name,
        price,
        COALESCE(image_url, image, NULL) AS image
      FROM items
      ORDER BY price ASC
    `);

    res.json(rows);
  } catch (e) {
    console.error("getAllItems error:", e);
    res.status(500).json({ error: "Failed to load items" });
  }
};
export const getUserInventory = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await query(`
    SELECT i.id, i.name, i.price, i.image
    FROM inventory inv
    JOIN items i ON i.id = inv.item_id
    WHERE inv.user_id = $1 AND inv.status = 'available'
  `, [userId]);

  res.json(rows);
};
