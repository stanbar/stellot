import jwt from 'jsonwebtoken';

const secretKey = process.env.SESSION_JWT_SECRET;
const audience = 'Stellot';
const issuer = 'Stellot';
if (!secretKey) {
  throw new Error('SESSION_JWT_SECRET must be set')
}

export function createSessionToken(userId: string): string {
  return jwt.sign({ userId }, secretKey!, { audience, issuer })
}

export function verifyAndGetUserId(token: string): string {
  const encoded = jwt.verify(token, secretKey!, { audience, issuer });
  // @ts-ignore
  return encoded.userId;
}
