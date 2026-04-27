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
        `SELECT id, google_id, email, name, role
         FROM app_users
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
          'INSERT INTO app_users (google_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING id, google_id, email, name, role',
          [googleId, email, name, 'customer']
        );
        user = insertResult.rows[0];
      }
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 500 });
      }

      if (
        user.google_id !== googleId ||
        user.email !== email ||
        user.name !== (name || user.name)
      ) {
        const updatedUserResult = await client.query(
          `UPDATE app_users
           SET google_id = $1, email = $2, name = $3
           WHERE id = $4
           RETURNING id, google_id, email, name, role`,
          [googleId, email, name || user.name, user.id]
        );
        user = updatedUserResult.rows[0];
      }

      // 3. Generate Session JWT
      const token = signToken({
        userId: user.id,
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
