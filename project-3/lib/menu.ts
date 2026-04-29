import pool from '@/lib/db';

export type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
  image_url?: string;
  category_id?: number | null;
  category_label?: string | null;
  category_color?: string | null;
  category_display_order?: number | null;
  stockStatus?: 'low' | 'out';
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<{
      menuid: number;
      name: string;
      cost: string | number;
      image_url?: string | null;
      category_id?: number | null;
      category_label?: string | null;
      category_color?: string | null;
      category_display_order?: number | string | null;
      inventoryid: number | null;
      inventorynum: number | string | null;
      inventory_is_active: boolean | null;
      useaverage: number | string | null;
      itemquantity: number | string | null;
    }>(
      `SELECT
        menu.menuid,
        menu.name,
        menu.cost,
        menu.image_url,
        menu.category_id,
        menu_category.name AS category_label,
        menu_category.color AS category_color,
        menu_category.display_order AS category_display_order,
        menu_item.inventoryid,
        inventory.inventorynum,
        inventory.is_active AS inventory_is_active,
        inventory.useaverage,
        menu_item.itemquantity
       FROM menu
       LEFT JOIN menu_categories AS menu_category
         ON menu_category.category_id = menu.category_id
       LEFT JOIN menu_items AS menu_item ON menu_item.menuid = menu.menuid
       LEFT JOIN inventory ON inventory.inventoryid = menu_item.inventoryid
       WHERE COALESCE(menu.is_active, true) = true
       ORDER BY menu.name ASC;`
    );

    const menuItems = new Map<number, MenuItem>();
    const statuses = new Map<number, 'low' | 'out'>();

    for (const row of result.rows) {
      if (!menuItems.has(row.menuid)) {
        menuItems.set(row.menuid, {
          menuid: row.menuid,
          name: row.name,
          cost: Number(row.cost),
          image_url: row.image_url ?? undefined,
          category_id: row.category_id ?? null,
          category_label: row.category_label ?? null,
          category_color: row.category_color ?? null,
          category_display_order:
            row.category_display_order === null ||
            row.category_display_order === undefined
              ? null
              : Number(row.category_display_order),
        });
      }

      if (row.inventoryid === null || row.itemquantity === null) continue;

      const currentStatus = statuses.get(row.menuid);
      if (currentStatus === 'out') continue;

      const stock = row.inventory_is_active === false ? 0 : Number(row.inventorynum ?? 0);
      const itemQuantity = Math.max(1, Number(row.itemquantity) || 1);
      const useAverage = Number(row.useaverage ?? 0);
      const daysLeft = useAverage > 0 ? Math.floor(stock / useAverage) : null;

      if (stock <= 0 || stock < itemQuantity) {
        statuses.set(row.menuid, 'out');
      } else if (stock <= 100 || (daysLeft !== null && daysLeft <= 14)) {
        statuses.set(row.menuid, 'low');
      }
    }

    return Array.from(menuItems.values()).map((item) => ({
      ...item,
      stockStatus: statuses.get(item.menuid),
    }));
  } finally {
    client.release();
  }
}
