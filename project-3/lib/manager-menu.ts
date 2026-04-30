import type { PoolClient } from 'pg';

import pool from '@/lib/db';

export type MenuCategory = {
  categoryId: number;
  name: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
};

export type RecipeIngredient = {
  id: number;
  inventoryId: number;
  inventoryName: string;
  itemQuantity: number;
  inventoryIsActive: boolean;
};

export type ManagerMenuItem = {
  menuId: number;
  name: string;
  cost: number;
  salesNum: number;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  isActive: boolean;
  archivedAt: string | null;
  recipe: RecipeIngredient[];
};

export type MenuItemInput = {
  name: string;
  cost: number;
  imageUrl: string | null;
  categoryId: number | null;
  recipe: Array<{
    inventoryId: number;
    itemQuantity: number;
  }>;
};

type CategoryRow = {
  category_id: number;
  name: string;
  color?: string | null;
  display_order: number | string | null;
  is_active: boolean | null;
};

type ManagerMenuRow = {
  menuid: number;
  name: string;
  cost: number | string;
  salesnum: number | string | null;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  is_active: boolean | null;
  archived_at: Date | string | null;
};

type RecipeRow = {
  id: number;
  menuid: number;
  inventoryid: number;
  inventory_name: string;
  itemquantity: number | string;
  inventory_is_active: boolean | null;
};

function mapCategoryRow(row: CategoryRow): MenuCategory {
  return {
    categoryId: row.category_id,
    name: row.name,
    color: row.color ?? '#667463',
    displayOrder: Number(row.display_order ?? 0),
    isActive: row.is_active ?? true,
  };
}

function mapMenuRow(
  row: ManagerMenuRow,
  recipeByMenuId: Map<number, RecipeIngredient[]>
): ManagerMenuItem {
  return {
    menuId: row.menuid,
    name: row.name,
    cost: Number(row.cost),
    salesNum: Number(row.salesnum ?? 0),
    imageUrl: row.image_url,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryColor: row.category_color,
    isActive: row.is_active ?? true,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
    recipe: recipeByMenuId.get(row.menuid) ?? [],
  };
}

function normalizeRecipe(input: MenuItemInput['recipe']) {
  const byInventoryId = new Map<number, number>();

  for (const row of input) {
    const inventoryId = Math.floor(Number(row.inventoryId));
    const itemQuantity = Math.max(1, Math.floor(Number(row.itemQuantity) || 0));

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) continue;

    byInventoryId.set(
      inventoryId,
      (byInventoryId.get(inventoryId) ?? 0) + itemQuantity
    );
  }

  return Array.from(byInventoryId, ([inventoryId, itemQuantity]) => ({
    inventoryId,
    itemQuantity,
  }));
}

async function syncMenuSequence(client: PoolClient) {
  await client.query(
    `SELECT setval(
      pg_get_serial_sequence('menu', 'menuid'),
      COALESCE((SELECT MAX(menuid) FROM menu), 0) + 1,
      false
    );`
  );
}

async function syncMenuItemsSequence(client: PoolClient) {
  await client.query(
    `SELECT setval(
      pg_get_serial_sequence('menu_items', 'id'),
      COALESCE((SELECT MAX(id) FROM menu_items), 0) + 1,
      false
    );`
  );
}

async function replaceRecipe(
  client: PoolClient,
  menuId: number,
  recipe: MenuItemInput['recipe']
) {
  const normalizedRecipe = normalizeRecipe(recipe);

  await client.query('DELETE FROM menu_items WHERE menuid = $1;', [menuId]);
  if (normalizedRecipe.length === 0) return;

  await syncMenuItemsSequence(client);

  for (const ingredient of normalizedRecipe) {
    await client.query(
      `INSERT INTO menu_items (inventoryid, menuid, itemquantity)
       VALUES ($1, $2, $3);`,
      [ingredient.inventoryId, menuId, ingredient.itemQuantity]
    );
  }
}

export async function getMenuCategories(includeInactive = false) {
  const result = await pool.query<CategoryRow>(
    `SELECT category_id, name, color, display_order, is_active
     FROM menu_categories
     WHERE $1::boolean OR COALESCE(is_active, true) = true
     ORDER BY display_order ASC, name ASC;`,
    [includeInactive]
  );

  return result.rows.map(mapCategoryRow);
}

export async function createMenuCategory(input: {
  name: string;
  color: string;
}) {
  const nextOrderResult = await pool.query<{ next_order: number }>(
    `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
     FROM menu_categories;`
  );
  const nextOrder = Number(nextOrderResult.rows[0]?.next_order ?? 1);

  const result = await pool.query<CategoryRow>(
    `INSERT INTO menu_categories (name, color, display_order, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING category_id, name, color, display_order, is_active;`,
    [input.name, input.color, nextOrder]
  );

  return mapCategoryRow(result.rows[0]);
}

export async function updateMenuCategory(
  categoryId: number,
  input: { name: string; color: string; isActive: boolean }
) {
  const result = await pool.query<CategoryRow>(
    `UPDATE menu_categories
     SET name = $2, color = $3, is_active = $4
     WHERE category_id = $1
     RETURNING category_id, name, color, display_order, is_active;`,
    [categoryId, input.name, input.color, input.isActive]
  );

  return result.rows[0] ? mapCategoryRow(result.rows[0]) : null;
}

export async function deleteMenuCategory(categoryId: number) {
  const usageResult = await pool.query<{ count: string }>(
    'SELECT COUNT(*) AS count FROM menu WHERE category_id = $1;',
    [categoryId]
  );

  if (Number(usageResult.rows[0]?.count ?? 0) > 0) {
    const updated = await pool.query<CategoryRow>(
      `UPDATE menu_categories
       SET is_active = false
       WHERE category_id = $1
       RETURNING category_id, name, color, display_order, is_active;`,
      [categoryId]
    );

    return { deleted: false, category: updated.rows[0] ? mapCategoryRow(updated.rows[0]) : null };
  }

  const deleted = await pool.query(
    'DELETE FROM menu_categories WHERE category_id = $1;',
    [categoryId]
  );

  return { deleted: (deleted.rowCount ?? 0) > 0, category: null };
}

export async function reorderMenuCategories(categoryIds: number[]) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, categoryId] of categoryIds.entries()) {
      await client.query(
        `UPDATE menu_categories
         SET display_order = $2
         WHERE category_id = $1;`,
        [categoryId, index + 1]
      );
    }

    await client.query('COMMIT');
    return getMenuCategories(true);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getManagerMenuItems(includeArchived = false) {
  const client = await pool.connect();

  try {
    const menuResult = await client.query<ManagerMenuRow>(
      `SELECT
        menu.menuid,
        menu.name,
        menu.cost,
        COALESCE(sold_items.salesnum, 0) AS salesnum,
        menu.image_url,
        menu.category_id,
        category.name AS category_name,
        category.color AS category_color,
        menu.is_active,
        menu.archived_at
       FROM menu
       LEFT JOIN menu_categories AS category ON category.category_id = menu.category_id
       LEFT JOIN (
         SELECT menuid, COALESCE(SUM(quantity), 0)::int AS salesnum
         FROM order_items
         GROUP BY menuid
       ) AS sold_items ON sold_items.menuid = menu.menuid
       WHERE $1::boolean OR COALESCE(menu.is_active, true) = true
       ORDER BY COALESCE(menu.is_active, true) DESC, menu.name ASC;`,
      [includeArchived]
    );

    const recipeResult = await client.query<RecipeRow>(
      `SELECT
        menu_items.id,
        menu_items.menuid,
        menu_items.inventoryid,
        inventory.name AS inventory_name,
        menu_items.itemquantity,
        inventory.is_active AS inventory_is_active
       FROM menu_items
       JOIN inventory ON inventory.inventoryid = menu_items.inventoryid
       ORDER BY inventory.name ASC;`
    );

    const recipeByMenuId = new Map<number, RecipeIngredient[]>();

    for (const row of recipeResult.rows) {
      recipeByMenuId.set(row.menuid, [
        ...(recipeByMenuId.get(row.menuid) ?? []),
        {
          id: row.id,
          inventoryId: row.inventoryid,
          inventoryName: row.inventory_name,
          itemQuantity: Number(row.itemquantity),
          inventoryIsActive: row.inventory_is_active ?? true,
        },
      ]);
    }

    return menuResult.rows.map((row) => mapMenuRow(row, recipeByMenuId));
  } finally {
    client.release();
  }
}

export async function createMenuItem(input: MenuItemInput) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await syncMenuSequence(client);

    const result = await client.query<{ menuid: number }>(
      `INSERT INTO menu (name, cost, salesnum, image_url, category_id, is_active, archived_at)
       VALUES ($1, $2, 0, $3, $4, true, NULL)
       RETURNING menuid;`,
      [input.name, input.cost, input.imageUrl, input.categoryId]
    );
    const menuId = result.rows[0].menuid;

    await replaceRecipe(client, menuId, input.recipe);
    await client.query('COMMIT');

    const items = await getManagerMenuItems(true);
    return items.find((item) => item.menuId === menuId) ?? null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateMenuItem(menuId: number, input: MenuItemInput) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<{ menuid: number }>(
      `UPDATE menu
       SET name = $2, cost = $3, image_url = $4, category_id = $5
       WHERE menuid = $1
       RETURNING menuid;`,
      [menuId, input.name, input.cost, input.imageUrl, input.categoryId]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await replaceRecipe(client, menuId, input.recipe);
    await client.query('COMMIT');

    const items = await getManagerMenuItems(true);
    return items.find((item) => item.menuId === menuId) ?? null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteOrArchiveMenuItem(menuId: number) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usageResult = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM order_items WHERE menuid = $1;',
      [menuId]
    );
    const hasOrderHistory = Number(usageResult.rows[0]?.count ?? 0) > 0;

    if (hasOrderHistory) {
      const archiveResult = await client.query(
        `UPDATE menu
         SET is_active = false, archived_at = NOW()
         WHERE menuid = $1;`,
        [menuId]
      );
      await client.query('COMMIT');

      return {
        deleted: false,
        archived: (archiveResult.rowCount ?? 0) > 0,
      };
    }

    await client.query('DELETE FROM menu_items WHERE menuid = $1;', [menuId]);
    const deleteResult = await client.query('DELETE FROM menu WHERE menuid = $1;', [
      menuId,
    ]);
    await client.query('COMMIT');

    return {
      deleted: (deleteResult.rowCount ?? 0) > 0,
      archived: false,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function restoreMenuItem(menuId: number) {
  const result = await pool.query(
    `UPDATE menu
     SET is_active = true, archived_at = NULL
     WHERE menuid = $1;`,
    [menuId]
  );

  return (result.rowCount ?? 0) > 0;
}
