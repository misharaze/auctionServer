import { query } from "../db/index.js";
import { pool } from "../db/index.js";

export const getOperations = async (req, res) => {
  try {
    // ⚠️ временно: берём первого пользователя
    const userRes = await query(`SELECT id FROM users LIMIT 1`);
    const userId = userRes.rows[0].id;

    const { rows } = await query(
      `
      SELECT type, amount, created_at, meta
      FROM operations
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load operations" });
  }
};



export const deposit = async (req, res) => {
  const client = await pool.connect();

  try {
    const { amount, method } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await client.query("BEGIN");

    // 1️⃣ операция
    const operationRes = await client.query(
      `
      INSERT INTO operations (user_id, type, amount, meta)
      VALUES ($1, 'deposit', $2, $3)
      RETURNING *
      `,
      [userId, amount, { method }]
    );

    // 2️⃣ обновляем баланс
    const balanceRes = await client.query(
      `
      UPDATE users
      SET balance = balance + $1
      WHERE id = $2
      RETURNING balance
      `,
      [amount, userId]
    );

    await client.query("COMMIT");
    
await notifyUser(req.user.id, {
  type: "wallet:withdraw",
  message: `Создана заявка на вывод ${amount} ₽`,
});



    res.json({
      balance: balanceRes.rows[0].balance,
      operation: operationRes.rows[0],
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ deposit error:", e);
    res.status(500).json({ error: "Deposit failed" });
  } finally {
    client.release();
  }
};

export const getDepositsHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT
        id,
        amount,
        meta,
        created_at
      FROM operations
      WHERE user_id = $1
        AND type = 'deposit'
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (e) {
    console.error("❌ getDepositsHistory error:", e);
    res.status(500).json({ error: "Failed to load deposits" });
  }
};


export const withdraw = async (req, res) => {
  const client = await pool.connect();

  try {
    const { amount, method, details } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await client.query("BEGIN");

    const balanceRes = await client.query(
      `SELECT balance FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    const balance = balanceRes.rows[0].balance;

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const operationRes = await client.query(
      `
      INSERT INTO operations (user_id, type, amount, meta)
      VALUES ($1, 'withdraw', $2, $3)
      RETURNING *
      `,
      [userId, -amount, { method, details }]
    );

    const newBalanceRes = await client.query(
      `
      UPDATE users
      SET balance = balance - $1
      WHERE id = $2
      RETURNING balance
      `,
      [amount, userId]
    );

    await client.query("COMMIT");

await notifyUser(req.user.id, {
  type: "wallet:withdraw",
  message: `Создана заявка на вывод ${amount} ₽`,
});


    res.json({
      balance: newBalanceRes.rows[0].balance,
      operation: operationRes.rows[0],
    });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ withdraw error:", e);
    res.status(500).json({ error: "Withdraw failed" });
  } finally {
    client.release();
  }
};

export const getWithdrawHistory = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT id, amount, meta, created_at
    FROM operations
    WHERE user_id = $1 AND type = 'withdraw'
    ORDER BY created_at DESC
    `,
    [req.user.id]
  );

  res.json(rows);
};
