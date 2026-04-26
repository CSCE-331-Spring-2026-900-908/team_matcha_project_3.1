import type { PoolClient } from 'pg';

import pool from '@/lib/db';
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

    await syncSequence(connection, 'order_items', 'id');

    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (orderid, menuid, quantity, cost, iceLevel, sugarLevel, topping) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          orderId,
          item.menuid,
          item.quantity,
          item.cost,
          item.iceLevel || 'Regular Ice',
          item.sugarLevel || '100%',
          item.toppings?.join(', ') || 'None',
        ]
      );
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
