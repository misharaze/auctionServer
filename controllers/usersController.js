import { query } from "../db/index.js";


export const getMe = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await query(
    `
    SELECT id, username, balance
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  res.json(rows[0]);
};

export const getBalance = async (req, res) => {
  const userId = req.user.id;

  const { rows } = await query(
    `SELECT balance FROM users WHERE id = $1`,
    [userId]
  );

  res.json({ balance: Number(rows[0]?.balance ?? 0) });
};


export const getOperations = async (req, res) => {
  const { rows } = await query(
    `
    SELECT
      id,
      type,
      amount,
      meta,
      created_at
    FROM operations
    WHERE user_id = (SELECT id FROM users LIMIT 1)
    ORDER BY created_at DESC
    LIMIT 100
    `
  );

  res.json(
    rows.map((op) => ({
      id: op.id,
      type: op.type,
      amount: op.amount,
      title: mapOperationTitle(op),
      createdAt: op.created_at,
    }))
  );
};

// 👇 маппинг типов операций → человекочитаемый текст
const mapOperationTitle = (op) => {
  switch (op.type) {
    case "bid_win":
      return "Покупка лота (победа в аукционе)";
    case "bid_pay":
      return "Оплата второго места";
    case "upgrade_win":
      return "Успешный апгрейд";
    case "upgrade_fail":
      return "Неудачный апгрейд";
    case "deposit":
      return "Пополнение баланса";
    case "withdraw":
      return "Вывод средств";
    default:
      return "Операция";
  }
};


export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalRes = await query(
      `SELECT COUNT(*)::int AS total FROM bids WHERE user_id = $1`,
      [userId]
    );

    const winsRes = await query(
      `SELECT COUNT(*)::int AS wins FROM bids WHERE user_id = $1 AND position = 1`,
      [userId]
    );

    const secondRes = await query(
      `SELECT COUNT(*)::int AS second FROM bids WHERE user_id = $1 AND position = 2`,
      [userId]
    );

    const total = totalRes.rows[0].total;
    const wins = winsRes.rows[0].wins;
    const second = secondRes.rows[0].second;

    res.json({
      total,
      wins,
      second,
      winRate: total ? Math.round((wins / total) * 100) : 0,
      riskRate: total ? Math.round((second / total) * 100) : 0,
    });
  } catch (e) {
    console.error("❌ getMyStats error:", e);
    res.status(500).json({ error: "Failed to load stats" });
  }
};
