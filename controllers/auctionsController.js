import { query } from "../db/index.js";
import { emitAuctionEvent } from "../Socket/Socket.js";

import { finishAuction } from "../services/auctionsServices.js";
import { placeBidSafe } from "../services/bidService.js";

/* =========================
   GET /api/auctions
========================= */
export const getAuctions = async (req, res) => {
  try {
   const { rows } = await query(`
  SELECT 
    a.id,
    a.start_price,
    a.min_step,
    a.status,
    i.name AS title,
    i.image_url,
    GREATEST(
      FLOOR(EXTRACT(EPOCH FROM (a.ends_at - NOW()))),
      0
    ) AS time_left,
    COUNT(b.id) AS bids_count,
    MAX(b.amount) AS leader
  FROM auctions a
  JOIN items i ON i.id = a.item_id
  LEFT JOIN bids b ON b.auction_id = a.id
  WHERE a.status = 'active'
  GROUP BY a.id, i.name, i.image_url
  ORDER BY a.created_at DESC
`);
res.json(
  rows.map((a) => ({
    id: a.id,
    title: a.title,
    image: a.image_url,
    startPrice: Number(a.start_price),
    minStep: Number(a.min_step),
    timeLeft: Number(a.time_left),
    bidsCount: Number(a.bids_count),
    leader: a.leader ? Number(a.leader) : Number(a.start_price),
  }))
);

  
  } catch (e) {
    console.error("getAuctions error:", e);
    res.status(500).json({ error: "Failed to load auctions" });
  }
};

/* =========================
   GET /api/auctions/:id
========================= */
export const getAuctionById = async (req, res) => {
  const { id } = req.params;

  try {
    const auctionRes = await query(
      `
     SELECT 
  a.id,
  a.start_price,
  a.min_step,
  a.status,
  i.name AS title,
  i.image_url,
  GREATEST(
    FLOOR(EXTRACT(EPOCH FROM (a.ends_at - NOW()))),
    0
  ) AS time_left
FROM auctions a
JOIN items i ON i.id = a.item_id
WHERE a.id = $1;
      `,
      [id]
    );

    if (!auctionRes.rows.length) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const bidsRes = await query(
      `
      SELECT 
        b.id,
        b.amount,
        b.created_at,
        u.username
      FROM bids b
      JOIN users u ON u.id = b.user_id
      WHERE b.auction_id = $1
      ORDER BY b.amount DESC
      `,
      [id]
    );

    const a = auctionRes.rows[0];

    res.json({
      id: a.id,
      title: a.title,
      startPrice: Number(a.start_price),
      minStep: Number(a.min_step ?? 10),
      status: a.status,
      timeLeft: Number(a.time_left ?? 0),
      bids: bidsRes.rows.map((b) => ({
        id: b.id,
        amount: Number(b.amount),
        user: b.username,
        created_at: b.created_at,
      })),
    });
  } catch (e) {
    console.error("getAuctionById error:", e);
    res.status(500).json({ error: "Failed to load auction" });
  }
};

/* =========================
   POST /api/auctions/:id/bid
========================= */
export const placeBid = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const userId = req.user.id;

  try {
    await placeBidSafe({
      auctionId: id,
      userId,
      amount,
    });

    emitAuctionEvent(id, "auction:bid", { auctionId: id });

    res.json({ ok: true });
  } catch (e) {
    console.error("placeBid error:", e);
    res.status(400).json({ error: e.message });
  }
};

/* =========================
   POST /api/auctions/:id/close
========================= */
export const closeAuction = async (req, res) => {
  const { id } = req.params;

  try {
    await finishAuction(id);

    emitAuctionEvent(id, "auction:end", { auctionId: id });

    res.json({ ok: true });
  } catch (e) {
    console.error("closeAuction error:", e);
    res.status(400).json({ error: e.message });
  }
};
