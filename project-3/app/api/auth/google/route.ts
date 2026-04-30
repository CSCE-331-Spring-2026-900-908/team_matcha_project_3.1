import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyGoogleToken, signToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { idToken, source } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID Token is required' }, { status: 400 });
    }

    const payload = await verifyGoogleToken(idToken);
    if (!payload || !payload.email || !payload.email_verified) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const { email, name, sub: googleId } = payload;

    const client = await pool.connect();
    try {
      const userResult = await client.query(
        `SELECT
           u.id,
           u.google_id,
           u.email,
           COALESCE(e.name, u.name) AS name,
           u.role,
           u.employee_id
         FROM app_users u
         LEFT JOIN employees e
           ON e.employeeid = u.employee_id
         WHERE google_id = $1 OR LOWER(email) = LOWER($2)
         ORDER BY CASE WHEN google_id = $1 THEN 0 ELSE 1 END
         LIMIT 1`,
        [googleId, email]
      );

      let user = userResult.rows.length > 0 ? userResult.rows[0] : null;

      if (userResult.rows.length === 0) {
        if (source !== 'kiosk') {
          return NextResponse.json(
            { error: 'This Google account is not authorized for this POS.' },
            { status: 403 }
          );
        }
        // Kiosk customers can self-register
        const insertResult = await client.query(
          `INSERT INTO app_users (google_id, email, name, role, employee_id)
           VALUES ($1, $2, $3, $4, NULL)
           RETURNING id, google_id, email, name, role, employee_id`,
          [googleId, email, name, 'customer']
        );
        user = insertResult.rows[0];
      }
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 500 });
      }

      if (user.role === 'customer' && source !== 'kiosk') {
        return NextResponse.json(
          { error: 'This Google account is not authorized for this POS.' },
          { status: 403 }
        );
      }

      if (
        user.google_id !== googleId ||
        user.email !== email
      ) {
        const updatedUserResult = await client.query(
          `UPDATE app_users
           SET google_id = $1, email = $2
           WHERE id = $3
           RETURNING id, google_id, email, name, role, employee_id`,
          [googleId, email, user.id]
        );
        user = {
          ...updatedUserResult.rows[0],
          name: user.name,
        };
      }

      // 3. Generate Session JWT
      const token = signToken({
        userId: user.id,
        employeeId: user.employee_id ?? null,
        email: user.email,
        role: user.role,
        name: user.name || '',
      });

      return NextResponse.json({
        token,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employee_id ?? null,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
