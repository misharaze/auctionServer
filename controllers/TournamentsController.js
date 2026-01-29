import { pool } from "../db/index.js";

export const getAllTournaments = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.*,
        COUNT(p.id) AS players
      FROM tournaments t
      LEFT JOIN tournament_participants p
        ON p.tournament_id = t.id
      GROUP BY t.id
      ORDER BY t.starts_at ASC
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load tournaments" });
  }
};

export const joinTournament = async (req, res) => {
  try {
    const userId = req.user.id;
    const tournamentId = req.params.id;

    await pool.query(
      `
      INSERT INTO tournament_participants (tournament_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [tournamentId, userId]
    );

    res.json({ success: true });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ error: "Вы уже участвуете" });
    }

    console.error(e);
    res.status(500).json({ error: "Failed to join tournament" });
  }
};
