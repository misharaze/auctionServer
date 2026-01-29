import { pool } from "../db/index.js";

/**
 * GET /api/giveaways
 * Получить все активные розыгрыши
 */

export const getAllGiveaways = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        g.id,
        g.title,
        g.image,
        g.ends_at,
        COUNT(p.id)::int AS participants
      FROM giveaways g
      LEFT JOIN giveaway_participants p
        ON p.giveaway_id = g.id
      WHERE g.is_finished = false
        AND g.ends_at > NOW()
      GROUP BY g.id
      ORDER BY g.ends_at ASC
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load giveaways" });
  }
};

/**
 * POST /api/giveaways/:id/join
 * Участвовать в розыгрыше
 */

export const joinGiveaway = async (req, res) => {
  const userId = req.user.id;
  const giveawayId = req.params.id;

  try {
    await pool.query(
      `
      INSERT INTO giveaway_participants (giveaway_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [giveawayId, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to join giveaway" });
  }
};

export const getGiveawayHistory = async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      g.id,
      g.title,
      g.image,
      g.ends_at,
      u.username AS winner,
      COUNT(p.id)::int AS participants
    FROM giveaways g
    LEFT JOIN users u ON u.id = g.winner_id
    LEFT JOIN giveaway_participants p ON p.giveaway_id = g.id
    WHERE g.is_finished = true
    GROUP BY g.id, u.username
    ORDER BY g.ends_at DESC
    LIMIT 50
  `);

  res.json(rows);
};

export const finishGiveaway = async (giveawayId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: [winner] } = await client.query(
      `
      SELECT user_id
      FROM giveaway_participants
      WHERE giveaway_id = $1
      ORDER BY RANDOM()
      LIMIT 1
      `,
      [giveawayId]
    );

    if (!winner) {
      await client.query(
        `UPDATE giveaways SET is_finished = true WHERE id = $1`,
        [giveawayId]
      );
      await client.query("COMMIT");
      return;
    }

    const { rows: [giveaway] } = await client.query(
      `
      SELECT item_id
      FROM giveaways
      WHERE id = $1
      `,
      [giveawayId]
    );

    await client.query(
      `
      INSERT INTO inventory (user_id, item_id, status)
      VALUES ($1, $2, 'available')
      `,
      [winner.user_id, giveaway.item_id]
    );

    await client.query(
      `
      UPDATE giveaways
      SET winner_id = $1, is_finished = true
      WHERE id = $2
      `,
      [winner.user_id, giveawayId]
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
  }
};
