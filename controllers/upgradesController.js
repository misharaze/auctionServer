import { pool } from "../db/index.js";
import { createNotification } from "../services/notification.Services.js";

export const tryUpgrade = async (req, res) => {
  const userId = req.user.id;
  const { fromInventoryId, toItemId } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) берем предмет из инвентаря пользователя (и цену item через JOIN)
    const { rows: [fromInv] } = await client.query(
      `
      SELECT 
        inv.id,
        inv.status,
        i.id   AS item_id,
        i.price AS price
      FROM inventory inv
      JOIN items i ON i.id = inv.item_id
      WHERE inv.id = $1 AND inv.user_id = $2
      FOR UPDATE
      `,
      [fromInventoryId, userId]
    );

    if (!fromInv) throw new Error("Inventory item not found");
    if (fromInv.status !== "available") throw new Error("Item not available");

    // 2) целевой предмет
    const { rows: [toItem] } = await client.query(
      `
      SELECT id, price, name
      FROM items
      WHERE id = $1
      `,
      [toItemId]
    );

    if (!toItem) throw new Error("Target item not found");

    // 3) шанс
    const chance = Math.min(95, Math.max(1, Math.floor((Number(fromInv.price) / Number(toItem.price)) * 100)));
    const roll = Math.random() * 100;
    const success = roll <= chance;

    // 4) апдейт инвентаря
    if (success) {
      // удаляем старый предмет
      await client.query(`DELETE FROM inventory WHERE id = $1`, [fromInventoryId]);

      // добавляем новый предмет в inventory
      await client.query(
        `
        INSERT INTO inventory (user_id, item_id, status)
        VALUES ($1, $2, 'available')
        `,
        [userId, toItem.id]
      );

      await createNotification({
        userId,
        type: "upgrade:success",
        message: `Апгрейд успешен! Вы получили ${toItem.name}`,
      });
    } else {
      // сжигаем предмет
      await client.query(
        `
        UPDATE inventory
        SET status = 'burned'
        WHERE id = $1
        `,
        [fromInventoryId]
      );

      await createNotification({
        userId,
        type: "upgrade:fail",
        message: `Апгрейд не удался. Предмет сгорел`,
      });
    }

    // 5) история
    await client.query(
      `
      INSERT INTO upgrade_history (user_id, from_inventory_id, to_item_id, chance, success)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [userId, fromInventoryId, toItemId, chance, success]
    );

    await client.query("COMMIT");

    res.json({ success, chance });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
};