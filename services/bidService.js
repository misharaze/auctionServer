import { pool } from "../db/index.js";
import { applyOperation } from "./WalletServices.js";
import { createNotification } from "./notification.Services.js";

export const placeBidSafe = async ({ auctionId, userId, amount }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: [auction] } = await client.query(
      `
      SELECT id, start_price, min_step, status
      FROM auctions
      WHERE id = $1
      FOR UPDATE
      `,
      [auctionId]
    );

    if (!auction) throw new Error("Auction not found");
    if (auction.status !== "active") throw new Error("Auction not active");

    const { rows: [current] } = await client.query(
      `
      SELECT COALESCE(MAX(amount), $2) AS max
      FROM bids
      WHERE auction_id = $1
      `,
      [auctionId, auction.start_price]
    );

    const minNext = Number(current.max) + Number(auction.min_step);
    if (amount < minNext) {
      throw new Error(`Min bid is ${minNext}`);
    }

    const { rows: [bid] } = await client.query(
      `
      INSERT INTO bids (auction_id, user_id, amount)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [auctionId, userId, amount]
    );

    await applyOperation(client, {
      userId,
      type: "bid",
      amount: -amount,
      meta: { auctionId, bidId: bid.id },
    });

    await client.query("COMMIT");

    // 🔔 УВЕДОМЛЕНИЕ ПОСЛЕ COMMIT
    await createNotification({
      userId,
      type: "bid:placed",
      message: `Вы сделали ставку ${amount} ₽`,
    });

    return bid;

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
