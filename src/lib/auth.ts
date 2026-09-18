import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'omni_qr_saas_enterprise_jwt_secret_2026';

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  teamId?: string;
  teamName?: string;
  iat: number;
  exp: number;
}

/**
 * Creates a hashed password representation using SHA-256 and salt
 */
export function hashPassword(password: string): string {
  const salt = 'omni_salt_998877';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

/**
 * Verifies if plain password matches stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  return hashPassword(password) === storedHash;
}

/**
 * Generates a simple secure JWT session token
 */
export function createSessionToken(payload: Omit<UserSessionPayload, 'iat' | 'exp'>): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 86400 * 7; // 7 days expiration

  const fullPayload: UserSessionPayload = { ...payload, iat, exp };
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies and decodes session token
 */
export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(base64Payload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload: UserSessionPayload = JSON.parse(
      Buffer.from(base64Payload, 'base64url').toString('utf8')
    );

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
