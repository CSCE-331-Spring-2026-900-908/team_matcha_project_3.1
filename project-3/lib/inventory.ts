import pool from '@/lib/db';

export type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  useAverage: number;
  daysLeft: number | null;
  status: 'In Stock' | 'Low Soon' | 'Low Stock';
};

function getInventoryStatus(
  inventoryNum: number,
  useAverage: number
): InventoryItem['status'] {
  if (useAverage <= 0) {
    return inventoryNum <= 0 ? 'Low Stock' : 'In Stock';
  }

  const daysLeft = inventoryNum / useAverage;

  if (daysLeft <= 14) {
    return 'Low Stock';
  }

  if (daysLeft <= 45) {
    return 'Low Soon';
  }

  return 'In Stock';
}

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
        status: getInventoryStatus(inventoryNum, useAverage),
      };
    });
  } finally {
    client.release();
  }
}
