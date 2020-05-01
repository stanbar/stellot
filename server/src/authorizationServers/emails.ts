import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Voting, EmailsAuthOptions } from '@stellot/types';

if (!process.env.KEYBASE_AS_JWT_PUB_KEY) {
  throw new Error('KEYBASE_AS_JWT_PUB_KEY must be set')
}
if (!process.env.KEYBASE_AS_JWT_AUDIENCE) {
  throw new Error('KEYBASE_AS_JWT_AUDIENCE must be set')
}
if (!process.env.KEYBASE_AS_JWT_ISSUER) {
  throw new Error('KEYBASE_AS_JWT_ISSUER must be set')
}

const publicKey = fs.readFileSync(path.join(process.cwd(), process.env.KEYBASE_AS_JWT_PUB_KEY));
const audience = process.env.KEYBASE_AS_JWT_AUDIENCE;
const issuer = process.env.KEYBASE_AS_JWT_ISSUER;

export function authenticateToken(authToken: string, voting: Voting): string {
  const subject = getSubject(authToken);
  const { emails }: { emails: string[] | undefined }
    = (voting.authorizationOptions as EmailsAuthOptions)
  if (!emails) {
    throw new Error('Could not find emails list')
  }
  if (!emails.includes(subject)) {
    throw new Error('Provided email in not eligable to vote')
  }

  return subject;
}

function getSubject(authToken: string): string {
  const decodedToken = jwt.verify(authToken, publicKey, { audience, issuer });

  // @ts-ignore
  if (!decodedToken || !decodedToken.sub) {
    throw new Error('token is missing sub field')
  }
  // @ts-ignore
  if (!decodedToken.sub) {
    throw new Error('token subject field is empty')
  }
  // @ts-ignore
  return decodedToken.sub;
}
