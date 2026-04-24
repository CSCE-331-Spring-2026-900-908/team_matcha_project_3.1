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
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const { email, name, sub: googleId } = payload;

    // 2. Find or Create User in DB
    const client = await pool.connect();
    try {
      let userResult = await client.query(
        'SELECT id, google_id, email, name, role FROM app_users WHERE google_id = $1',
        [googleId]
      );

      let user;
      if (userResult.rows.length === 0) {
        // Create default 'employee'
        const insertResult = await client.query(
          'INSERT INTO app_users (google_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING id, google_id, email, name, role',
          [googleId, email, name, 'employee']
        );
        user = insertResult.rows[0];
        console.log(`New user created: ${email} with role: employee`);
      } else {
        user = userResult.rows[0];
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
