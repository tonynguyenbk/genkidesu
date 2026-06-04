import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-secret-min-32-chars-genki2026',
);

const ACCESS_EXPIRY = process.env['JWT_ACCESS_EXPIRY'] ?? '15m';
const REFRESH_EXPIRY = process.env['JWT_REFRESH_EXPIRY'] ?? '30d';

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if (payload['type'] !== 'refresh') {
    throw new Error('Not a refresh token');
  }
  return payload;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
