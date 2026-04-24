import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'employee' | 'manager';
  name: string;
}

/**
 * Verifies Google ID Token and returns user info
 */
export async function verifyGoogleToken(token: string) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

/**
 * Signs a JWT for our session
 */
export function signToken(payload: JWTPayload): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Verifies our local JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
