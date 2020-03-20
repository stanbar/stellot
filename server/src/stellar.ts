import { Keypair, Memo, Transaction } from 'stellar-sdk'
import BN from 'bn.js';
import { ed25519, SignerSession, VoterSession } from './blindsig';
import { getRandomInt } from './utils';
import { validateProof } from './validators';
import Voting from './types/voting';
import Keychain from './types/keychain';

export interface Candidate {
  name: string;
  code: number;
}

interface InitSession {
  id: number;
  signerSession: SignerSession;
}

const initSessions: Map<string, Array<InitSession>> = new Map();

export async function isUserAuthorizedToInitSession(tokenId: string, voting: Voting) {
  return initSessions.get(voting.id) === undefined;
}

export interface ChallengeSession extends InitSession {
  id: number;
  blindedTransactionsBatch: Array<BN>;
  lucky: boolean;
}

const challengeSessions: Map<string, Array<ChallengeSession>> = new Map();
const cutAndChooseCount = 100;

export interface InitResponse {
  id: number;
  R: Buffer;
  P: Buffer;
}

export function createSession(tokenId: string, keychain: Keychain): Array<InitResponse> {
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
  initSessions.set(tokenId, userSessions);
  return response;
}

export type ChallengeRequest = Array<{ id: number; blindedTransactionBatch: BN[] }>

export function storeAndPickLuckyBatch(
  tokenId: string,
  blindedTransactionBatches: ChallengeRequest): number {
  const userSessions = initSessions.get(tokenId);
  if (!userSessions) {
    throw new Error('Could not find corresponding user session')
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
  challengeSessions.set(tokenId, session);
  // TODO save number of attempts preventing DoS
  return luckyBatchId;
}

export interface TransactionInBatch {
  candidateCode: number,
  memo: Memo,
  transaction: Transaction,
  isMyOption: boolean // TODO remove in clientApp
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
  voterSession: { a: BN, b: BN };
  transactionsBatch: TransactionsBatch;
}

export function proofChallenges(tokenId: string, proofs: Proof[]) {
  const challengeSession = challengeSessions.get(tokenId);
  if (!challengeSession) {
    throw new Error('Could not find corresponding challenge session')
  }
  const valid = challengeSession.every((session, id) => {
    if (session.lucky) return true;
    return validateProof(session, proofs[id]);
  });

  if (!valid) {
    throw new Error('Failed to pass verification')
  }

  const luckySession = challengeSession.find(session => session.lucky)!;
  return signTransactionBatch(luckySession);
}

function signTransactionBatch(session: ChallengeSession): { id: number, sigs: Array<BN> } {
  return ({
    id: session.id,
    sigs: session.blindedTransactionsBatch.map(btx => session.signerSession.sign(new BN(btx, 16))),
  })
}
