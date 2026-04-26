import type { PoolClient } from 'pg';
import pool from '@/lib/db';

export async function earnPoints(client: PoolClient, userId: number, orderID: number, costTotal: number): Promise<void>
{
    const pointsEarned = Math.floor(costTotal);
    await client.query(
    'INSERT INTO rewards (userid, orderid, points, type) VALUES ($1, $2, $3, $4)',
    [
        userId,
        orderID,
        pointsEarned,
        'earn'
    ]);

    await client.query('UPDATE app_users SET points_balance = points_balance + $1 WHERE id = $2', [pointsEarned, userId]);

  }

export async function redeemPoints(client: PoolClient, userId: number): Promise<void>
{   
    const result = await client.query('SELECT points_balance FROM app_users WHERE id = $1', [userId]);
    const currentPoints = result.rows[0]?.points_balance;
    const redeemPoints = 50; //change based on frere drink points

        if (currentPoints >= redeemPoints) {
            await client.query('UPDATE app_users SET points_balance = points_balance - $1 WHERE id = $2', [redeemPoints, userId]);
            await client.query('INSERT INTO rewards (userid, points, type) VALUES ($1, $2, $3)', [userId, -50, 'redeem']);
        }
        else {
            throw new Error('Not enough points to redeem');
        }
    };

export async function getPointsBalance(userId: number): Promise<number>
{
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT points_balance FROM app_users WHERE id = $1', [userId]);
        return result.rows[0]?.points_balance || 0;
    } finally {
        client.release();
    }
}
