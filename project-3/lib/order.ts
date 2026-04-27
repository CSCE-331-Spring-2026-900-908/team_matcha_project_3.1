import type { PoolClient } from 'pg';

import pool from '@/lib/db';
import { formatToppings, parseToppings } from '@/lib/toppings';
import { earnPoints } from './rewards';

async function syncSequence(
  connection: PoolClient,
  tableName: string,
  columnName: string
) {
  await connection.query(
    `SELECT setval(
      pg_get_serial_sequence($1, $2),
      COALESCE((SELECT MAX(${columnName}) FROM ${tableName}), 0) + 1,
      false
    );`,
    [tableName, columnName]
  );
}

export async function createOrder(
  customerName: string,
  costTotal: number,
  employeeID: number,
  items: {
    menuid: number;
    quantity: number;
    cost: number;
    iceLevel?: string;
    sugarLevel?: string;
    topping?: string;
    toppings?: string[];
  }[],
  userID?: number
) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await syncSequence(connection, 'orders', 'orderid');

    const result = await connection.query(
      'INSERT INTO orders (customername, costtotal, employeeid) VALUES ($1, $2, $3) RETURNING orderid',
      [customerName, costTotal, employeeID]
    );
    const orderId = result.rows[0].orderid;

    await connection.query(
      `UPDATE employees
       SET ordernum = COALESCE(ordernum, 0) + 1
       WHERE employeeid = $1`,
      [employeeID]
    );

    await syncSequence(connection, 'order_items', 'id');

    for (const item of items) {
      const toppingString = formatToppings(item.toppings ?? item.topping);
      await connection.query(
        'INSERT INTO order_items (orderid, menuid, quantity, cost, iceLevel, sugarLevel, topping) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          orderId,
          item.menuid,
          item.quantity,
          item.cost,
          item.iceLevel || 'Regular Ice',
          item.sugarLevel || '100%',
          toppingString,
        ]
      );

      await decrementToppingInventory(connection, toppingString, item.quantity);
    }
    if(userID) 
    {
      await earnPoints(connection, userID, orderId, costTotal);
    }
    await connection.query('COMMIT');

    return result.rows[0];
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
}

async function decrementToppingInventory(
  connection: PoolClient,
  toppingString: string,
  quantity: number
) {
  const toppings = parseToppings(toppingString);
  const itemQuantity = Math.max(1, Math.floor(Number(quantity) || 1));

  if (toppings.length === 0) return;

  const inventoryResult = await connection.query<{
    inventoryid: number;
    name: string;
  }>('SELECT inventoryid, name FROM inventory;');

  for (const topping of toppings) {
    const matchingInventoryItem = inventoryResult.rows.find((item) =>
      parseToppings(item.name).includes(topping)
    );

    if (!matchingInventoryItem) continue;

    await connection.query(
      `UPDATE inventory
       SET inventorynum = GREATEST(0, inventorynum - $2)
       WHERE inventoryid = $1;`,
      [matchingInventoryItem.inventoryid, itemQuantity]
    );
  }
}
