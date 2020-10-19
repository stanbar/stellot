import { Keypair, Memo, Transaction } from 'stellar-sdk';
import BN from 'bn.js';
import { Voting, Authorization } from '@stellot/types';
import { ed25519, SignerSession, VoterSession } from '@stellot/crypto';
import { getRandomInt } from './utils';
import { validateProof } from './validators';
import Keychain from './types/keychain';

interface InitSession {
  id: number;
  signerSession: SignerSession;
}

// Voting.id -> UserId -> InitSession[]
// TODO move to database
const initSessions: Map<string, Map<string, Array<InitSession>>> = new Map();

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
      return true;
  }
}

export interface ChallengeSession extends InitSession {
  id: number;
  blindedTransactionsBatch: Array<BN>;
  lucky: boolean;
}

// TODO move to database
const challengeSessions: Map<string, Map<string, ChallengeSession[]>> = new Map();
const cutAndChooseCount = 100;

export interface InitResponse {
  id: number;
  R: Buffer;
  P: Buffer;
}

export function createSession(voting: Voting, userId: string, keychain: Keychain): InitResponse[] {
  const distributionKeypair = Keypair.fromSecret(keychain.distribution);
  const userSessions = new Array<InitSession>(cutAndChooseCount);
  const response = new Array<InitResponse>(cutAndChooseCount);
  for (let i = 0; i < cutAndChooseCount; i += 1) {
    const signerSession = new SignerSession(distributionKeypair.rawSecretKey());
    const R = signerSession.publicNonce();
    const P = signerSession.publicKey();
    response[i] = {
      id: i,
      R: ed25519.encodePoint(R),
      P: ed25519.encodePoint(P),
    };
    userSessions[i] = { id: i, signerSession };
  }
  const votingSessions: Map<string, InitSession[]> = initSessions.get(voting.id) || new Map();
  votingSessions.set(userId, userSessions);
  initSessions.set(voting.id, votingSessions);
  // should we key session by uuid or username or jwt maybe ?
  return response;
}

export type ChallengeRequest = Array<{ id: number; blindedTransactionBatch: BN[] }>;

export function storeAndPickLuckyBatch(
  votingId: string,
  userId: string,
  blindedTransactionBatches: ChallengeRequest,
): number {
  const userSessions = initSessions.get(votingId)?.get(userId);
  if (!userSessions) {
    throw new Error('Could not find corresponding user session');
  }

  const luckyBatchId = getRandomInt(cutAndChooseCount);
  const session = new Array<ChallengeSession>();
  for (let i = 0; i < cutAndChooseCount; i += 1) {
    session[i] = {
      id: i,
      signerSession: userSessions[i].signerSession,
      blindedTransactionsBatch: blindedTransactionBatches[i].blindedTransactionBatch,
      lucky: i === luckyBatchId,
    };
  }

  const votingSessions: Map<string, ChallengeSession[]> =
    challengeSessions.get(votingId) || new Map();
  votingSessions.set(userId, session);
  challengeSessions.set(votingId, votingSessions);
  // TODO save number of attempts preventing DoS
  return luckyBatchId;
}

export interface TransactionInBatch {
  candidateCode: number;
  memo: Memo;
  transaction: Transaction;
  isMyOption: boolean; // TODO remove in clientApp
}

type TransactionsBatch = Array<TransactionInBatch>;

interface ProofSession extends InitSession, ChallengeSession {
  voterSession: VoterSession;
  transactionsBatch: TransactionsBatch;
}

const proofSessions: Map<string, Array<ProofSession>> = new Map();

export function isAlreadyProofedSession(tokenId: string) {
  return proofSessions.get(tokenId) !== undefined;
}

export interface Proof {
  id: number;
  voterSession: { a: BN; b: BN };
  transactionsBatch: TransactionsBatch;
}

export function proofChallenges(votingId: string, userId: string, proofs: Proof[]) {
  const challengeSession = challengeSessions.get(votingId)?.get(userId);
  if (!challengeSession) {
    throw new Error('Could not find corresponding challenge session');
  }
  const valid = challengeSession.every((session, id) => {
    if (session.lucky) return true;
    return validateProof(session, proofs[id]);
  });

  if (!valid) {
    throw new Error('Failed to pass verification');
  }

  const luckySession = challengeSession.find(session => session.lucky)!;
  return signTransactionBatch(luckySession);
}

function signTransactionBatch(session: ChallengeSession): { id: number; sigs: Array<BN> } {
  return {
    id: session.id,
    sigs: session.blindedTransactionsBatch.map(btx => session.signerSession.sign(new BN(btx, 16))),
  };
}
