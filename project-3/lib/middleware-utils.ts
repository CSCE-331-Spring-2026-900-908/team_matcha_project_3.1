import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth-utils';

export type AuthenticatedHandler = (
  req: NextRequest,
  user: JWTPayload
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware wrapper for API routes to enforce authentication and roles
 */
export async function withAuth(
  req: NextRequest,
  allowedRoles: JWTPayload['role'][],
  handler: AuthenticatedHandler
) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  return handler(req, user);
}
