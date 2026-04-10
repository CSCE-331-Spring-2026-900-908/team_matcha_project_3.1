import pool from '@/lib/db';

export async function createOrder(customerName: string, costTotal: number, employeeID: number, items: {menuid: number; quantity: number; cost: number}[])
{
    const connection = await pool.connect();
    try {
        await connection.query('BEGIN');
        const result = await connection.query(
            'INSERT INTO orders (customername, costtotal, employeeid) VALUES ($1, $2, $3) RETURNING orderid',
            [customerName, costTotal, employeeID]
        );
        for(const item of items)
        {
            await connection.query(
                'INSERT INTO order_items (orderid, menuid, quantity, cost) VALUES ($1, $2, $3, $4)',
                [result.rows[0].orderid, item.menuid, item.quantity, item.cost]
            );
        }
        await connection.query('COMMIT');

        return result.rows[0];
    }
    catch (e)
    {
        await connection.query('ROLLBACK');
        throw e;
    }
    finally 
    {
        connection.release();
    }
}
