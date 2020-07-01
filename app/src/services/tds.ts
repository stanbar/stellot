import { Voting, CreateVotingRequest, CreateVotingResponse } from '@stellot/types';
import BN from 'bn.js';
import { Memo, Transaction } from 'stellar-sdk';

const BASE_URL = REACT_APP_ENV === 'production' ? TDS_SERVER_URL : '';

export async function fetchVotes(): Promise<Voting[]> {
  const res = await fetch(`${BASE_URL}/api/voting`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function fetchVoting(votingSlug: string): Promise<Voting> {
  console.log({ fetchVoting: votingSlug });
  const res = await fetch(`${BASE_URL}/api/voting/${votingSlug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function createVoting(
  createVotingRequest: CreateVotingRequest,
): Promise<CreateVotingResponse> {
  const response = await fetch(`${BASE_URL}/api/voting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ createVotingRequest }),
  });

  if (response.ok) {
    console.log('Successfully created voting');
  } else {
    console.error('Failed to create voting');
    throw new Error(await response.text());
  }
  return response.json();
}

export interface ResSession {
  R: string; // hex
  P: string; // hex
}

export async function initSessions(
  votingId: string,
  authToken?: string,
): Promise<[string, ResSession]> {
  console.log({ initSession: authToken });
  const response = await fetch(`${BASE_URL}/api/castVote/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: JSON.stringify({ votingId }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    const body = await response.json();
    throw new Error(body?.errors?.message);
  }
  console.log({ 'SESSION-TOKEN': response.headers.get('SESSION-TOKEN') });
  const sessionId = response.headers.get('SESSION-TOKEN') || response.headers.get('session-token');
  if (!sessionId) {
    console.error(`Didn't receive SESSION-TOKEN`);
    throw new Error(`Didn't receive SESSION-TOKEN`);
  }

  const responseJson: {
    R: Array<number>;
    P: Array<number>;
  } = await response.json();

  return [
    sessionId,
    {
      R: Buffer.from(responseJson.R).toString('hex'),
      P: Buffer.from(responseJson.P).toString('hex'),
    },
  ];
}

export async function getChallenges(
  sessionToken: string,
  blindedTransactionBatches: Array<{ id: number; blindedTransactionBatch: Array<BN> }>,
): Promise<number> {
  const response = await fetch(`${BASE_URL}/api/blindsig/getChallenges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SESSION-TOKEN': sessionToken,
    },
    body: JSON.stringify({ blindedTransactionBatches }),
  });

  if (response.ok) {
    console.log('Successfully received challenges');
  } else {
    console.error('Failed to receive challenges');
    throw new Error(await response.text());
  }
  const res: { luckyBatchTransaction: number } = await response.json();
  return res.luckyBatchTransaction;
}

export class TransactionInBatch {
  candidateCode: number;

  memo: Memo;

  transaction: Transaction;

  isMyOption: boolean;

  constructor(candidateCode: number, memo: Memo, transaction: Transaction, isMyOption: boolean) {
    this.candidateCode = candidateCode;
    this.memo = memo;
    this.transaction = transaction;
    this.isMyOption = isMyOption;
  }

  toJSON() {
    return {
      transaction: this.transaction.toXDR(),
    };
  }
}

export type TransactionsBatch = Array<TransactionInBatch>;

interface Proof {
  id: number;
  voterSession: { a: BN; b: BN };
  transactionsBatch: TransactionsBatch;
}

export async function proofChallenge(
  sessionToken: string,
  proofs: Proof[],
): Promise<{ id: number; sigs: Array<BN> }> {
  console.log({ proofs: JSON.stringify({ proofs }) });
  const response = await fetch(`${BASE_URL}/api/blindsig/proofChallenges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SESSION-TOKEN': sessionToken,
    },
    body: JSON.stringify({ proofs }),
  });

  if (response.ok) {
    console.log('Successfully proofed challenges');
  } else {
    console.error('Failed to proof challenges');
    throw new Error(await response.text());
  }
  const signedLuckyBatch: { id: number; sigs: Array<BN> } = await response.json();
  // TODO it is working, but is it really needed ? does the BN serialize it anyway ?
  signedLuckyBatch.sigs = signedLuckyBatch.sigs.map((sig) => new BN(sig, 16));
  return signedLuckyBatch;
}
