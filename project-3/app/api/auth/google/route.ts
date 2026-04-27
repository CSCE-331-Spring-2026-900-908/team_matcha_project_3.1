import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyGoogleToken, signToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID Token is required' }, { status: 400 });
    }

    // 1. Verify Google Token
    const payload = await verifyGoogleToken(idToken);
    if (!payload || !payload.email || !payload.email_verified) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const { email, name, sub: googleId } = payload;

    // 2. Allow login only for pre-authorized users already present in app_users.
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

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'This Google account is not authorized for this POS.' },
          { status: 403 }
        );
      }

      let user = userResult.rows[0];

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
