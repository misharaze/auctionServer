import { pool } from "../db/index.js";
import { applyOperation } from "./WalletServices.js";
import { createNotification } from ".//notification.Services.js";

export const finishAuction = async (auctionId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const auctionRes = await client.query(
      `
      SELECT status
      FROM auctions
      WHERE id = $1
      FOR UPDATE
      `,
      [auctionId]
    );

    if (!auctionRes.rows.length) {
      throw new Error("Auction not found");
    }

    if (auctionRes.rows[0].status === "ended") {
      throw new Error("Auction already finished");
    }

    const bidsRes = await client.query(
      `
      SELECT id, user_id, amount
      FROM bids
      WHERE auction_id = $1
      ORDER BY amount DESC
      LIMIT 2
      `,
      [auctionId]
    );

    if (bidsRes.rows.length < 2) {
      throw new Error("Not enough bids");
    }

    const [winner, payer] = bidsRes.rows;

    await applyOperation(client, {
      userId: payer.user_id,
      type: "bid:pay",
      amount: -payer.amount,
      meta: { auctionId },
    });

    await client.query(
      `
      UPDATE auctions
      SET status = 'ended',
          winner_bid_id = $1,
          payer_bid_id = $2
      WHERE id = $3
      `,
      [winner.id, payer.id, auctionId]
    );

    await client.query("COMMIT");

    // 🔔 уведомления
    await createNotification({
      userId: winner.user_id,
      type: "auction:win",
      message: `Вы выиграли аукцион за ${winner.amount} ₽`,
    });

    await createNotification({
      userId: payer.user_id,
      type: "auction:second",
      message: `Вы заняли 2 место и оплатили ${payer.amount} ₽`,
    });

    return { ok: true };

  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
