import type { PoolClient } from 'pg';

import pool from '@/lib/db';
import { formatToppings, normalizeToppingName, parseToppings } from '@/lib/toppings';
import { earnPoints } from './rewards';

export type UnavailableOrderItem = {
  itemName: string;
  ingredientName: string;
  requested: number;
  available: number;
  unavailableQuantity: number;
  type: 'menu-item' | 'topping';
};

export class OrderAvailabilityError extends Error {
  unavailableItems: UnavailableOrderItem[];

  constructor(unavailableItems: UnavailableOrderItem[]) {
    super('One or more order items are unavailable.');
    this.name = 'OrderAvailabilityError';
    this.unavailableItems = unavailableItems;
  }
}

type OrderItemInput = {
  menuid: number;
  quantity: number;
  cost: number;
  iceLevel?: string;
  sugarLevel?: string;
  topping?: string;
  toppings?: string[];
};

type InventoryLookupRow = {
  inventoryid: number;
  name: string;
  inventorynum: number | string | null;
};

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
  items: OrderItemInput[],
  userID?: number
) {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await validateOrderInventory(connection, items);
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
      const itemQuantity = getOrderedQuantity(item.quantity);
      await connection.query(
        'INSERT INTO order_items (orderid, menuid, quantity, cost, iceLevel, sugarLevel, topping) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          orderId,
          item.menuid,
          itemQuantity,
          item.cost,
          item.iceLevel || 'Regular Ice',
          item.sugarLevel || '100%',
          toppingString,
        ]
      );

      await decrementMenuItemInventory(connection, item.menuid, itemQuantity);
      await decrementToppingInventory(connection, toppingString, itemQuantity);
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

function getOrderedQuantity(quantity: number) {
  return Math.max(1, Math.floor(Number(quantity) || 1));
}

function findToppingInventoryItem(
  inventoryRows: InventoryLookupRow[],
  topping: string
) {
  return inventoryRows.find((item) => {
    const inventoryName = normalizeToppingName(item.name);
    const toppingName = normalizeToppingName(topping);

    if (inventoryName === toppingName) return true;

    if (topping === 'Boba') {
      return inventoryName.includes('tapioca') || inventoryName.includes('boba');
    }

    return inventoryName.includes(toppingName);
  });
}

async function validateOrderInventory(
  connection: PoolClient,
  items: OrderItemInput[]
) {
  const requiredByInventory = new Map<
    number,
    {
      ingredientName: string;
      requested: number;
      available: number;
      orderItems: Map<
        string,
        {
          orderedQuantity: number;
          requested: number;
          unitsPerItem: number;
        }
      >;
      type: 'menu-item' | 'topping';
    }
  >();
  const unavailableItems: UnavailableOrderItem[] = [];

  const inventoryResult = await connection.query<InventoryLookupRow>(
    'SELECT inventoryid, name, inventorynum FROM inventory FOR UPDATE;'
  );
  const inventoryRows = inventoryResult.rows;

  const menuItemResult = await connection.query<{
    menuid: number;
    menuname: string;
    inventoryid: number | null;
    ingredientname: string | null;
    inventorynum: number | string | null;
    itemquantity: number | string | null;
  }>(
    `SELECT
       menu.menuid,
       menu.name AS menuname,
       menu_item.inventoryid,
       inventory.name AS ingredientname,
       inventory.inventorynum,
       menu_item.itemquantity
     FROM menu
     LEFT JOIN menu_items AS menu_item ON menu_item.menuid = menu.menuid
     LEFT JOIN inventory ON inventory.inventoryid = menu_item.inventoryid
     WHERE menu.menuid = ANY($1::int[]);`,
    [items.map((item) => item.menuid)]
  );

  const menuRowsById = menuItemResult.rows.reduce<
    Map<number, typeof menuItemResult.rows>
  >((rowsById, row) => {
    rowsById.set(row.menuid, [...(rowsById.get(row.menuid) ?? []), row]);
    return rowsById;
  }, new Map());

  for (const item of items) {
    const itemQuantity = getOrderedQuantity(item.quantity);
    const menuRows = menuRowsById.get(item.menuid) ?? [];
    const itemName = menuRows[0]?.menuname ?? `Menu item #${item.menuid}`;
    const ingredientRows = menuRows.filter(
      (row) => row.inventoryid !== null && row.itemquantity !== null
    );

    if (ingredientRows.length === 0) {
      unavailableItems.push({
        itemName,
        ingredientName: 'recipe ingredients',
        requested: itemQuantity,
        available: 0,
        unavailableQuantity: itemQuantity,
        type: 'menu-item',
      });
    }

    for (const row of ingredientRows) {
      const inventoryId = Number(row.inventoryid);
      const requested = Number(row.itemquantity) * itemQuantity;
      const existing = requiredByInventory.get(inventoryId);

      if (existing) {
        existing.requested += requested;
        const existingItem = existing.orderItems.get(itemName);
        existing.orderItems.set(itemName, {
          requested: (existingItem?.requested ?? 0) + requested,
          orderedQuantity: (existingItem?.orderedQuantity ?? 0) + itemQuantity,
          unitsPerItem: Number(row.itemquantity),
        });
        continue;
      }

      requiredByInventory.set(inventoryId, {
        ingredientName: row.ingredientname ?? `Inventory item #${inventoryId}`,
        requested,
        available: Number(row.inventorynum ?? 0),
        orderItems: new Map([
          [
            itemName,
            {
              orderedQuantity: itemQuantity,
              requested,
              unitsPerItem: Number(row.itemquantity),
            },
          ],
        ]),
        type: 'menu-item',
      });
    }

    for (const topping of parseToppings(item.toppings ?? item.topping)) {
      const inventoryItem = findToppingInventoryItem(inventoryRows, topping);

      if (!inventoryItem) {
        unavailableItems.push({
          itemName: topping,
          ingredientName: topping,
          requested: itemQuantity,
          available: 0,
          unavailableQuantity: itemQuantity,
          type: 'topping',
        });
        continue;
      }

      const existing = requiredByInventory.get(inventoryItem.inventoryid);

      if (existing) {
        existing.requested += itemQuantity;
        const existingItem = existing.orderItems.get(topping);
        existing.orderItems.set(topping, {
          requested: (existingItem?.requested ?? 0) + itemQuantity,
          orderedQuantity: (existingItem?.orderedQuantity ?? 0) + itemQuantity,
          unitsPerItem: 1,
        });
        continue;
      }

      requiredByInventory.set(inventoryItem.inventoryid, {
        ingredientName: inventoryItem.name,
        requested: itemQuantity,
        available: Number(inventoryItem.inventorynum ?? 0),
        orderItems: new Map([
          [
            topping,
            {
              orderedQuantity: itemQuantity,
              requested: itemQuantity,
              unitsPerItem: 1,
            },
          ],
        ]),
        type: 'topping',
      });
    }
  }

  for (const requirement of requiredByInventory.values()) {
    if (requirement.available >= requirement.requested) continue;

    let remainingAvailable = requirement.available;

    for (const [itemName, itemRequirement] of requirement.orderItems) {
      const purchasableQuantity = Math.min(
        itemRequirement.orderedQuantity,
        Math.floor(remainingAvailable / itemRequirement.unitsPerItem)
      );
      const unavailableQuantity = itemRequirement.orderedQuantity - purchasableQuantity;

      remainingAvailable -= purchasableQuantity * itemRequirement.unitsPerItem;
      if (unavailableQuantity <= 0) continue;

      unavailableItems.push({
        itemName,
        ingredientName: requirement.ingredientName,
        requested: unavailableQuantity * itemRequirement.unitsPerItem,
        available: requirement.available,
        unavailableQuantity,
        type: requirement.type,
      });
    }
  }

  if (unavailableItems.length > 0) {
    throw new OrderAvailabilityError(unavailableItems);
  }
}

async function decrementMenuItemInventory(
  connection: PoolClient,
  menuId: number,
  quantity: number
) {
  await connection.query(
    `UPDATE inventory AS inventory_item
     SET inventorynum = GREATEST(
       0,
       inventory_item.inventorynum - (menu_item.itemquantity * $2)
     )
     FROM menu_items AS menu_item
     WHERE menu_item.inventoryid = inventory_item.inventoryid
       AND menu_item.menuid = $1;`,
    [menuId, quantity]
  );
}

async function decrementToppingInventory(
  connection: PoolClient,
  toppingString: string,
  quantity: number
) {
  const toppings = parseToppings(toppingString);

  if (toppings.length === 0) return;

  const inventoryResult = await connection.query<{
    inventoryid: number;
    name: string;
    inventorynum: number | string | null;
  }>('SELECT inventoryid, name, inventorynum FROM inventory;');

  for (const topping of toppings) {
    const matchingInventoryItem = findToppingInventoryItem(inventoryResult.rows, topping);

    if (!matchingInventoryItem) continue;

    await connection.query(
      `UPDATE inventory
       SET inventorynum = GREATEST(0, inventorynum - $2)
       WHERE inventoryid = $1;`,
      [matchingInventoryItem.inventoryid, quantity]
    );
  }
}
