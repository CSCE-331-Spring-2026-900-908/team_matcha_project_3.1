import type { PoolClient } from 'pg';

import pool from '@/lib/db';

export type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  useAverage: number;
  daysLeft: number | null;
  categoryId: number | null;
  categoryName: string | null;
  isActive: boolean;
  archivedAt: string | null;
};

type InventoryRow = {
  inventoryid: number;
  name: string;
  cost: string | number;
  inventorynum: number | string;
  useaverage: number | string;
  category_id: number | null;
  category_name?: string | null;
  is_active: boolean | null;
  archived_at: Date | string | null;
};

export type InventoryCategory = {
  categoryId: number;
  name: string;
  displayOrder: number;
  isActive: boolean;
};

type InventoryCategoryRow = {
  category_id: number;
  name: string;
  display_order: number | string | null;
  is_active: boolean | null;
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
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    isActive: row.is_active ?? true,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
  };
}

function mapInventoryCategoryRow(row: InventoryCategoryRow): InventoryCategory {
  return {
    categoryId: row.category_id,
    name: row.name,
    displayOrder: Number(row.display_order ?? 0),
    isActive: row.is_active ?? true,
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

export async function getInventoryItems(
  includeArchived = false
): Promise<InventoryItem[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<InventoryRow>(
      `SELECT
        inventory.inventoryid,
        inventory.name,
        inventory.cost,
        inventory.inventorynum,
        inventory.useaverage,
        inventory.category_id,
        category.name AS category_name,
        inventory.is_active,
        inventory.archived_at
       FROM inventory
       LEFT JOIN inventory_categories AS category
         ON category.category_id = inventory.category_id
       WHERE $1::boolean OR COALESCE(inventory.is_active, true) = true
       ORDER BY COALESCE(inventory.is_active, true) DESC, inventory.name ASC;`,
      [includeArchived]
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
  inventoryNum: number,
  categoryId: number | null
): Promise<InventoryItem | null> {
  const client = await pool.connect();

  try {
    const result = await client.query<InventoryRow>(
      `UPDATE inventory
       SET name = $2, cost = $3, inventorynum = $4, category_id = $5
       WHERE inventoryid = $1
       RETURNING
        inventoryid,
        name,
        cost,
        inventorynum,
        useaverage,
        category_id,
        NULL::text AS category_name,
        is_active,
        archived_at;`,
      [inventoryId, name, cost, inventoryNum, categoryId]
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
  useAverage: number,
  categoryId: number | null
): Promise<InventoryItem> {
  const client = await pool.connect();

  try {
    await syncInventorySequence(client);

    const result = await client.query<InventoryRow>(
      `INSERT INTO inventory (name, cost, inventorynum, useaverage, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
        inventoryid,
        name,
        cost,
        inventorynum,
        useaverage,
        category_id,
        NULL::text AS category_name,
        is_active,
        archived_at;`,
      [name, cost, inventoryNum, useAverage, categoryId]
    );

    return mapInventoryRow(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function deleteInventoryItem(
  inventoryId: number
): Promise<{ deleted: boolean; archived: boolean; inUse: boolean }> {
  const client = await pool.connect();

  try {
    const usageResult = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM menu_items WHERE inventoryid = $1;',
      [inventoryId]
    );

    if (Number(usageResult.rows[0]?.count ?? 0) > 0) {
      const archiveResult = await client.query(
        `UPDATE inventory
         SET is_active = false, archived_at = NOW()
         WHERE inventoryid = $1;`,
        [inventoryId]
      );

      return {
        deleted: false,
        archived: (archiveResult.rowCount ?? 0) > 0,
        inUse: true,
      };
    }

    const deleteResult = await client.query(
      'DELETE FROM inventory WHERE inventoryid = $1;',
      [inventoryId]
    );

    return {
      deleted: (deleteResult.rowCount ?? 0) > 0,
      archived: false,
      inUse: false,
    };
  } finally {
    client.release();
  }
}

export async function restoreInventoryItem(inventoryId: number) {
  const result = await pool.query(
    `UPDATE inventory
     SET is_active = true, archived_at = NULL
     WHERE inventoryid = $1;`,
    [inventoryId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getInventoryCategories(includeInactive = false) {
  const result = await pool.query<InventoryCategoryRow>(
    `SELECT category_id, name, display_order, is_active
     FROM inventory_categories
     WHERE $1::boolean OR COALESCE(is_active, true) = true
     ORDER BY display_order ASC, name ASC;`,
    [includeInactive]
  );

  return result.rows.map(mapInventoryCategoryRow);
}

export async function createInventoryCategory(input: {
  name: string;
}) {
  const nextOrderResult = await pool.query<{ next_order: number }>(
    `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
     FROM inventory_categories;`
  );
  const nextOrder = Number(nextOrderResult.rows[0]?.next_order ?? 1);

  const result = await pool.query<InventoryCategoryRow>(
    `INSERT INTO inventory_categories (name, display_order, is_active)
     VALUES ($1, $2, true)
     RETURNING category_id, name, display_order, is_active;`,
    [input.name, nextOrder]
  );

  return mapInventoryCategoryRow(result.rows[0]);
}

export async function updateInventoryCategory(
  categoryId: number,
  input: { name: string; isActive: boolean }
) {
  const result = await pool.query<InventoryCategoryRow>(
    `UPDATE inventory_categories
     SET name = $2, is_active = $3
     WHERE category_id = $1
     RETURNING category_id, name, display_order, is_active;`,
    [categoryId, input.name, input.isActive]
  );

  return result.rows[0] ? mapInventoryCategoryRow(result.rows[0]) : null;
}

export async function deleteInventoryCategory(categoryId: number) {
  const usageResult = await pool.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM inventory WHERE category_id = $1;',
    [categoryId]
  );

  if (Number(usageResult.rows[0]?.count ?? 0) > 0) {
    const updated = await pool.query<InventoryCategoryRow>(
      `UPDATE inventory_categories
       SET is_active = false
       WHERE category_id = $1
       RETURNING category_id, name, display_order, is_active;`,
      [categoryId]
    );

    return {
      deleted: false,
      category: updated.rows[0] ? mapInventoryCategoryRow(updated.rows[0]) : null,
    };
  }

  const deleted = await pool.query(
    'DELETE FROM inventory_categories WHERE category_id = $1;',
    [categoryId]
  );

  return { deleted: (deleted.rowCount ?? 0) > 0, category: null };
}

export async function reorderInventoryCategories(categoryIds: number[]) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, categoryId] of categoryIds.entries()) {
      await client.query(
        `UPDATE inventory_categories
         SET display_order = $2
         WHERE category_id = $1;`,
        [categoryId, index + 1]
      );
    }

    await client.query('COMMIT');
    return getInventoryCategories(true);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
