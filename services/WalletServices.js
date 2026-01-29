import { query } from "../db/index.js";

/**
 * Создаёт операцию и обновляет баланс пользователя
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.type
 * @param {number} params.amount (signed)
 * @param {Object} params.meta
 */

export const applyOperation = async (
  client,
  { userId, type, amount, meta }
) => {
  // 1️⃣ Блокируем пользователя
  const userRes = await client.query(
    `
    SELECT balance
    FROM users
    WHERE id = $1
    FOR UPDATE
    `,
    [userId]
  );

  if (!userRes.rows.length) {
    throw new Error("User not found");
  }

  const currentBalance = userRes.rows[0].balance;
  const nextBalance = currentBalance + amount;

  // 2️⃣ Запрещаем уход в минус
  if (nextBalance < 0) {
    throw new Error("Insufficient funds");
  }

  // 3️⃣ Обновляем баланс
  await client.query(
    `
    UPDATE users
    SET balance = $1
    WHERE id = $2
    `,
    [nextBalance, userId]
  );

  // 4️⃣ Логируем операцию
  await client.query(
    `
    INSERT INTO operations (user_id, type, amount, meta)
    VALUES ($1, $2, $3, $4)
    `,
    [userId, type, amount, JSON.stringify(meta)]
  );
};
