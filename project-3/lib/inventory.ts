import type { PoolClient } from 'pg';

import pool from '@/lib/db';

export type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  useAverage: number;
  daysLeft: number | null;
};

type InventoryRow = {
  inventoryid: number;
  name: string;
  cost: string | number;
  inventorynum: number | string;
  useaverage: number | string;
};

function mapInventoryRow(row: InventoryRow): InventoryItem {
  const inventoryNum = Number(row.inventorynum);
  const useAverage = Number(row.useaverage);

  return {
    inventoryId: row.inventoryid,
    name: row.name,
    cost: Number(row.cost),
    inventoryNum,
    useAverage,
    daysLeft: useAverage > 0 ? Math.floor(inventoryNum / useAverage) : null,
  };
}

async function syncInventorySequence(client: PoolClient) {
  await client.query(
    `SELECT setval(
      pg_get_serial_sequence('inventory', 'inventoryid'),
      COALESCE((SELECT MAX(inventoryid) FROM inventory), 0) + 1,
      false
    );`
  );
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<InventoryRow>(
      'SELECT inventoryid, name, cost, inventorynum, useaverage FROM inventory ORDER BY name ASC;'
    );

    return result.rows.map(mapInventoryRow);
  } finally {
    client.release();
  }
}

export async function updateInventoryItem(
  inventoryId: number,
  name: string,
  cost: number,
  inventoryNum: number
): Promise<InventoryItem | null> {
  const client = await pool.connect();

  try {
    const result = await client.query<InventoryRow>(
      `UPDATE inventory
       SET name = $2, cost = $3, inventorynum = $4
       WHERE inventoryid = $1
       RETURNING inventoryid, name, cost, inventorynum, useaverage;`,
      [inventoryId, name, cost, inventoryNum]
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return mapInventoryRow(row);
  } finally {
    client.release();
  }
}

export async function createInventoryItem(
  name: string,
  cost: number,
  inventoryNum: number,
  useAverage: number
): Promise<InventoryItem> {
  const client = await pool.connect();

  try {
    await syncInventorySequence(client);

    const result = await client.query<InventoryRow>(
      `INSERT INTO inventory (name, cost, inventorynum, useaverage)
       VALUES ($1, $2, $3, $4)
       RETURNING inventoryid, name, cost, inventorynum, useaverage;`,
      [name, cost, inventoryNum, useAverage]
    );

    return mapInventoryRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function deleteInventoryItem(
  inventoryId: number
): Promise<{ deleted: boolean; inUse: boolean }> {
  const client = await pool.connect();

  try {
    const usageResult = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM menu_items WHERE inventoryid = $1;',
      [inventoryId]
    );

    if (Number(usageResult.rows[0]?.count ?? 0) > 0) {
      return { deleted: false, inUse: true };
    }

    const deleteResult = await client.query(
      'DELETE FROM inventory WHERE inventoryid = $1;',
      [inventoryId]
    );

    return { deleted: (deleteResult.rowCount ?? 0) > 0, inUse: false };
  } finally {
    client.release();
  }
}
