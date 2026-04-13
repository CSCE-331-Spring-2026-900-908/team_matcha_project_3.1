import pool from '@/lib/db';

export type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  useAverage: number;
  daysLeft: number | null;
};

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'SELECT inventoryid, name, cost, inventorynum, useaverage FROM inventory ORDER BY name ASC;'
    );

    return result.rows.map((row) => {
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
    });
  } finally {
    client.release();
  }
}

export async function updateInventoryItem(
  inventoryId: number,
  cost: number,
  inventoryNum: number
): Promise<InventoryItem | null> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE inventory
       SET cost = $2, inventorynum = $3
       WHERE inventoryid = $1
       RETURNING inventoryid, name, cost, inventorynum, useaverage;`,
      [inventoryId, cost, inventoryNum]
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const nextInventoryNum = Number(row.inventorynum);
    const useAverage = Number(row.useaverage);

    return {
      inventoryId: row.inventoryid,
      name: row.name,
      cost: Number(row.cost),
      inventoryNum: nextInventoryNum,
      useAverage,
      daysLeft: useAverage > 0 ? Math.floor(nextInventoryNum / useAverage) : null,
    };
  } finally {
    client.release();
  }
}
