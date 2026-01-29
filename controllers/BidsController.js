// server/controllers/BidsController.js
import { query } from "../db/index.js";

export const getMyBids = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await query(
      `
      SELECT
        b.id,
        b.amount,
        b.created_at,
        a.id AS auction_id,
        i.name AS item
      FROM bids b
      JOIN auctions a ON a.id = b.auction_id
      JOIN items i ON i.id = a.item_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load bids" });
  }
};
