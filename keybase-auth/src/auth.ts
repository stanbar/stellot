import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

if (!process.env.JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY must be set')
}
if (!process.env.KEYBASE_AS_JWT_AUDIENCE) {
  throw new Error('KEYBASE_AS_JWT_AUDIENCE must be set')
}
if (!process.env.KEYBASE_AS_JWT_ISSUER) {
  throw new Error('KEYBASE_AS_JWT_ISSUER must be set')
}
const privateKey = fs.readFileSync(path.join(process.cwd(), process.env.JWT_PRIV_KEY));
const audience = process.env.KEYBASE_AS_JWT_AUDIENCE;
const issuer = process.env.KEYBASE_AS_JWT_ISSUER;

export function createJwt(username: string, requiredTeam?: string): string {
  const today = new Date();

  const exp = new Date();
  exp.setDate(today.getDate() + 60);

  return jwt.sign({ requiredTeam }, privateKey, {
    expiresIn: '2 days',
    subject: username,
    audience,
    issuer,
    algorithm: 'ES256',
  })
}
