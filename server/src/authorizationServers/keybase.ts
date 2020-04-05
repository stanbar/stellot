import fetch from 'node-fetch';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { Voting, KeybaseAuthOptions } from '@stellot/types';

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

export async function authenticateToken(authToken: string, voting: Voting)
  : Promise<string> {
  return getUsername(authToken, (voting.authorizationOptions as KeybaseAuthOptions)?.team);
}

async function getUsername(authToken: string, requiredTeam?: string)
  : Promise<string> {
  const decodedToken = jwt.verify(authToken, publicKey, { audience, issuer });

  // @ts-ignore
  if (!decodedToken || !decodedToken.sub) {
    throw new Error('token is missing sub field')
  }
  // @ts-ignore
  if (requiredTeam) {
    // @ts-ignore
    if (!decodedToken.requiredTeam) {
      throw new Error('token does not contain requiredTeam field while it is required')
    }
    // @ts-ignore
    if (decodedToken.requiredTeam !== requiredTeam) {
      // @ts-ignore
      throw new Error(`token has different requiredTeam proof ${decodedToken.requiredTeam}`)
    }
  }
  // @ts-ignore
  if (!decodedToken.sub) {
    throw new Error('token subject field is empty')
  }
  // @ts-ignore
  return decodedToken.sub;
}


export function joinTeam(team: string) {
  fetch(`${process.env.KEYBASE_AUTH_SERVER_URL}/auth/keybase/joinTeam`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ team }),
  });
  // we don't really care about the result
  // should we abort it it failed to join team ? no
  // should we abort if it is already in team ? no
}
