import { Voting, Authorization } from '@stellot/types';
import { SignerSession, ed25519 } from '@stellot/crypto';
import BN from 'bn.js';
import { Keypair, Asset } from 'stellar-sdk';
import { createBallotIssuingTransaction } from './stellar';
import { getKeychain } from './database/keychain';
import { getVotingById } from './database/voting';
import { consumeChannel, Channel } from './database/channels';

if (!process.env.BLIND_TOKEN_JWT_SECRET) {
  throw new Error('BLIND_TOKEN_JWT_SECRET must be set');
}
const blindTokenSecretKey = Buffer.from(process.env.BLIND_TOKEN_JWT_SECRET, 'base64');
const blindKeys = ed25519.keyFromSecret(blindTokenSecretKey);

interface InitResponse {
  nonce: Buffer;
  publicKey: Buffer;
}

interface InitSession {
  signerSession: SignerSession;
}

// Voting.id -> UserId -> InitSession[]
// TODO move to database
const initSessions: Map<string, Map<string, InitSession>> = new Map();

export async function isUserAuthorizedToInitSession(voting: Voting, userId?: string) {
  // TODO move to database
  switch (voting.authorization) {
    case Authorization.KEYBASE:
      return userId && initSessions.get(voting.id)?.get(userId) === undefined;
    case Authorization.EMAILS:
      return userId && initSessions.get(voting.id)?.get(userId) === undefined;
    case Authorization.IP:
      return userId && initSessions.get(voting.id)?.get(userId) === undefined;
    default:
      return true
  }
}

export function createSession(voting: Voting, userId: string): InitResponse {
  const signerSession = new SignerSession(blindTokenSecretKey);
  const R = signerSession.publicNonce();
  const P = signerSession.publicKey();
  const response: InitResponse = {
    nonce: ed25519.encodePoint(R),
    publicKey: ed25519.encodePoint(P),
  };
  console.log({ response });
  const userSession: InitSession = { signerSession };
  const votingSessions: Map<string, InitSession> = initSessions.get(voting.id) || new Map();
  votingSessions.set(userId, userSession);
  initSessions.set(voting.id, votingSessions);
  // should we key session by uuid or username or jwt maybe ?
  return response;
}

export function signBlindly(votingId: string, userId: string, challengeHex: string) {
  return initSessions
    .get(votingId)
    ?.get(userId)
    ?.signerSession.sign(new BN(challengeHex, 16));
}

export function verifyAuthorizationToken(
  message: Buffer,
  signature: Buffer,
  votingId: string,
): boolean {
  // TODO try with Buffers
  console.log({
    message,
    messageFirstByte: message.readUInt8(0),
    messageLength: message.byteLength,

    signature,
    signatureFirstByte: signature.readUInt8(0),
    signatureLength: signature.byteLength,
  });

  const actualPublicKey = message.slice(0, blindKeys.getPublic().length);
  if (!Buffer.from(blindKeys.getPublic()).equals(actualPublicKey)) {
    throw new Error('Malformed authorization token, it must contain public key');
  }

  const actualVotingId = message.slice(blindKeys.getPublic().length).toString();
  if (actualVotingId !== votingId) {
    throw new Error('Malformed authorization token, it must contain votingId');
  }

  // @ts-ignore
  return ed25519.verify(message, [...signature], blindKeys.getPublic());
}

export async function requestAccountCreation(
  votingId: string,
  voterPublicKey: string,
) {
  const channel: Channel | null = await consumeChannel(votingId);
  if (!channel) {
    throw new Error('Could not allocate new channel');
  }
  const voting = await getVotingById(votingId);
  if (!voting) {
    throw new Error(`could not find voting with votingId: ${votingId}`);
  }
  const keychain = await getKeychain(votingId);
  if (!keychain) {
    throw new Error(`could not find keychain with votingId: ${votingId}`);
  }
  return createBallotIssuingTransaction(
    channel.secret,
    Keypair.fromSecret(keychain.distribution),
    voterPublicKey,
    new Asset(voting.assetCode, voting.issueAccountId),
    voting.votesCap,
  );
}
