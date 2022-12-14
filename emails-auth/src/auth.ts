import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

if (!process.env.JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY must be set')
}
if (!process.env.EMAILS_AS_JWT_AUDIENCE) {
  throw new Error('EMAILS_AS_JWT_AUDIENCE must be set')
}
if (!process.env.EMAILS_AS_JWT_ISSUER) {
  throw new Error('EMAILS_AS_JWT_ISSUER must be set')
}
const pathToPrivateKey =  path.join(process.cwd(), process.env.JWT_PRIV_KEY);
const privateKey = fs.readFileSync(pathToPrivateKey);
if (fs.existsSync(pathToPrivateKey)) {
  console.log('JWT Private key exists');
} else {
  throw new Error(`JWT Private key does not exist on path ${pathToPrivateKey}`)
}
const audience = process.env.EMAILS_AS_JWT_AUDIENCE;
const issuer = process.env.EMAILS_AS_JWT_ISSUER;

export function createJwt(email: string): string {
  return jwt.sign({}, privateKey, {
    expiresIn: '30d',
    subject: email,
    audience,
    issuer,
    algorithm: 'ES256',
  })
}
