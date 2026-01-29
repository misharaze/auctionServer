// controllers/home.controller.js
import { pool } from "../db/index.js";

export const getHomeData = async (req, res) => {
  try {
    const { rows: auctions } = await pool.query(`
      SELECT
        a.id,
        i.name AS title,
        i.image,
        a.ends_at,
        COUNT(b.id) AS bids_count,
        MAX(b.amount) AS leader_price,
        COALESCE(
          (
            SELECT amount
            FROM bids
            WHERE auction_id = a.id
            ORDER BY amount DESC
            OFFSET 1 LIMIT 1
          ),
          a.start_price
        ) AS second_price
      FROM auctions a
      JOIN items i ON i.id = a.item_id
      LEFT JOIN bids b ON b.auction_id = a.id
      WHERE a.ends_at > NOW()
      GROUP BY a.id, i.name, i.image
      ORDER BY a.ends_at
      LIMIT 6
    `);

    const { rows: [stats] } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM auctions WHERE ends_at > NOW()) AS "activeAuctions",
        (SELECT COUNT(*) FROM bids WHERE created_at::date = CURRENT_DATE) AS "betsToday"
    `);

    const { rows: feed } = await pool.query(`
      SELECT id, text
      FROM feed_events
      ORDER BY created_at DESC
      LIMIT 8
    `);

    res.json({
      auctions,
      stats,
      feed,
    });
  } catch (e) {
    console.error("HOME ERROR:", e);
    res.status(500).json({ error: "Failed to load home data" });
  }
};
