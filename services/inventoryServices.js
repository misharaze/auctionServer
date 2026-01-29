import { query } from "../db/index.js";

export const grantItemToUser = async ({ userId, itemId, source, meta = {} }) => {
  await query(
    `
    INSERT INTO user_items (user_id, item_id, source, meta)
    VALUES ($1, $2, $3, $4)
    `,
    [userId, itemId, source, meta]
  );
};

export const getUserInventory = async (userId) => {
  const { rows } = await query(
    `
    SELECT
      ui.id,
      ui.source,
      ui.meta,
      ui.created_at,
      i.id as item_id,
      i.name,
      i.price_market
    FROM user_items ui
    JOIN items i ON i.id = ui.item_id
    WHERE ui.user_id = $1
    ORDER BY ui.created_at DESC
    LIMIT 200
    `,
    [userId]
  );

  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    meta: r.meta,
    createdAt: r.created_at,
    item: {
      id: r.item_id,
      name: r.name,
      priceMarket: r.price_market,
    },
  }));
};
