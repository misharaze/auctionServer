import { pool } from "../db/index.js";

/**
 * GET /api/giveaways
 * Активные розыгрыши
 */

export const getAllGiveaways = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        g.id,
        g.title,
        g.image,
        g.ends_at,
        COUNT(DISTINCT gp.user_id)::int AS participants
      FROM giveaways g
      LEFT JOIN giveaway_participants gp
        ON gp.giveaway_id = g.id
      WHERE g.is_finished = false
        AND g.ends_at > NOW()
      GROUP BY g.id
      ORDER BY g.ends_at ASC
    `);

    res.json(rows);
  } catch (e) {
    console.error("getAllGiveaways error:", e);
    res.status(500).json({ error: "Failed to load giveaways" });
  }
};

/**
 * POST /api/giveaways/:id/join
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
    console.error("joinGiveaway error:", e);
    res.status(500).json({ error: "Failed to join giveaway" });
  }
};


/**
 * GET /api/giveaways/history
 * История завершённых розыгрышей
 */
export const getGiveawayHistory = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        g.id,
        g.title,
        g.image,
        g.ends_at,
        u.username AS winner,
        COUNT(gp.user_id)::int AS participants
      FROM giveaways g
      LEFT JOIN users u
        ON u.id = g.winner_id
      LEFT JOIN giveaway_participants gp
        ON gp.giveaway_id = g.id
      WHERE g.is_finished = true
      GROUP BY g.id, u.username
      ORDER BY g.ends_at DESC
      LIMIT 50
    `);

    res.json(rows);
  } catch (e) {
    console.error("getGiveawayHistory error:", e);
    res.status(500).json({ error: "Failed to load giveaway history" });
  }
};

/**
 * Завершение розыгрыша (внутренний сервис)
 */
export const finishGiveaway = async (giveawayId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Выбираем победителя
    const { rows: winnerRows } = await client.query(
      `
      SELECT user_id
      FROM giveaway_participants
      WHERE giveaway_id = $1
      ORDER BY RANDOM()
      LIMIT 1
      `,
      [giveawayId]
    );

    // Если участников нет — просто закрываем розыгрыш
    if (winnerRows.length === 0) {
      await client.query(
        `UPDATE giveaways SET is_finished = true WHERE id = $1`,
        [giveawayId]
      );
      await client.query("COMMIT");
      return;
    }

    const winnerId = winnerRows[0].user_id;

    // 2️⃣ Получаем предмет розыгрыша
    const { rows: giveawayRows } = await client.query(
      `
      SELECT item_id
      FROM giveaways
      WHERE id = $1
      `,
      [giveawayId]
    );

    const itemId = giveawayRows[0]?.item_id;

    // 3️⃣ Кладём предмет в инвентарь победителя
    if (itemId) {
      await client.query(
        `
        INSERT INTO inventory (user_id, item_id, status)
        VALUES ($1, $2, 'available')
        `,
        [winnerId, itemId]
      );
    }

    // 4️⃣ Обновляем розыгрыш
    await client.query(
      `
      UPDATE giveaways
      SET
        winner_id = $1,
        is_finished = true
      WHERE id = $2
      `,
      [winnerId, giveawayId]
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("finishGiveaway error:", e);
  } finally {
    client.release();
  }
};