import { Voting, CreateVotingRequest, CreateVotingResponse } from '@stellot/types';
import BN from "bn.js";
import { Memo, Transaction } from "stellar-sdk";

export async function fetchVotes(): Promise<Voting[]> {
  const res = await fetch('/api/voting');
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

export async function fetchVoting(votingSlug: string): Promise<Voting> {
  console.log({ fetchVoting: votingSlug });
  const res = await fetch(`/api/voting/${votingSlug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}

export async function createVoting(createVotingRequest: CreateVotingRequest)
  : Promise<CreateVotingResponse> {
  const response = await fetch('/api/voting', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  id: number;
  R: string; // hex
  P: string; // hex
}

export async function initSessions(tokenId: string, votingId: string): Promise<[string, ResSession[]]> {
  const response = await fetch('/api/blindsig/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tokenId, votingId }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    throw new Error(await response.text());
  }

  const sessionId = response.headers.get('SESSION-ID');
  if (!sessionId) {
    console.error(`Didn't receive SESSION-ID`);
    throw new Error(`Didn't receive SESSION-ID`);
  }

  const responseJson: Array<{
    id: number,
    R: Array<number>,
    P: Array<number>
  }> = await response.json();

  return [sessionId, responseJson.map(res => ({
    id: res.id,
    R: Buffer.from(res.R).toString('hex'),
    P: Buffer.from(res.P).toString('hex'),
  }))]
}

export async function getChallenges(
  tokenId: string,
  sessionId: string,
  blindedTransactionBatches: Array<{ id: number, blindedTransactionBatch: Array<BN> }>)
  : Promise<number> {
  const response = await fetch('/api/blindsig/getChallenges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SESSION-ID': sessionId,
    },
    body: JSON.stringify({ tokenId, blindedTransactionBatches }),
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
    }
  }
}

export type TransactionsBatch = Array<TransactionInBatch>;

interface Proof {
  id: number;
  voterSession: { a: BN, b: BN };
  transactionsBatch: TransactionsBatch;
}

export async function proofChallenge(tokenId: string, sessionId: string, proofs: Proof[])
  : Promise<{ id: number, sigs: Array<BN> }> {
  console.log({ proofs: JSON.stringify({ tokenId, proofs }) });
  const response = await fetch('/api/blindsig/proofChallenges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'SESSION-ID': sessionId,
    },
    body: JSON.stringify({ tokenId, proofs }),
  });

  if (response.ok) {
    console.log('Successfully proofed challenges');
  } else {
    console.error('Failed to proof challenges');
    throw new Error(await response.text());
  }
  const signedLuckyBatch: { id: number, sigs: Array<BN> } = await response.json();
  // TODO it is working, but is it really needed ? does the BN serialize it anyway ?
  signedLuckyBatch.sigs = signedLuckyBatch.sigs.map(sig => new BN(sig, 16));
  return signedLuckyBatch
}

