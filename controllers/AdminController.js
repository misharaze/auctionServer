// controllers/adminController.js
import { pool } from "../db/index.js";

export const getAdminStats = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM auctions WHERE status='active') AS active_auctions,
        (SELECT COUNT(*) FROM bids) AS total_bids,
        (SELECT COALESCE(SUM(balance),0) FROM users) AS total_balance,
        (SELECT COALESCE(SUM(amount),0) FROM operations WHERE type='deposit') AS total_deposits,
        (SELECT COALESCE(SUM(amount),0) FROM operations WHERE type='fee') AS platform_profit
    `);

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load admin stats" });
  }
};


export const getAdminDashboard = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE is_banned = false) AS active_users,
        (SELECT COUNT(*) FROM users WHERE last_seen > NOW() - INTERVAL '5 minutes') AS online_users,
        (SELECT COUNT(*) FROM bids WHERE created_at::date = CURRENT_DATE) AS bids_today,
        (SELECT COALESCE(SUM(amount),0) FROM operations WHERE type='deposit') AS total_deposits,
        (SELECT COALESCE(SUM(amount),0) FROM operations WHERE type='fee') AS platform_profit,
        (SELECT COALESCE(SUM(amount),0) FROM operations WHERE type='bid') AS total_turnover
    `);

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load admin dashboard" });
  }
};



export const toggleBanUser = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `
      UPDATE users
      SET is_banned = NOT is_banned
      WHERE id = $1
      RETURNING id, is_banned
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update user" });
  }
};

export const closeAuction = async (req, res) => {
  const { id } = req.params;

  await pool.query(`
    UPDATE auctions
    SET status = 'closed',
        ends_at = NOW()
    WHERE id = $1
  `, [id]);

  res.json({ success: true });
};

export const deleteAuction = async (req, res) => {
  const { id } = req.params;

  await pool.query(`
    DELETE FROM auctions WHERE id = $1
  `, [id]);

  res.json({ success: true });
};






