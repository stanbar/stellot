import {
  Transaction,
  Memo,
  Keypair,
  Network,
  Server,
  Asset,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
} from 'stellar-sdk';
import BN from 'bn.js';
import { encodeMemo, encryptMemo } from './utils';
import { VoterSession } from './blindsig';

Network.useTestNetwork();

const server = new Server('https://horizon-testnet.stellar.org');
const distributionAccountId = 'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU';

if (!process.env.BALLOT_PUBLIC_KEY) {
  throw new Error('process.env.BALLOT_PUBLIC_KEY can not be undefined');
}
const ballotAccountId = process.env.BALLOT_PUBLIC_KEY;

export const distributionKeypair = Keypair.fromPublicKey(distributionAccountId);

if (!process.env.ASSET_NAME) {
  throw new Error('process.env.ASSET_NAME can not be undefined');
}
if (!process.env.ISSUE_PUBLIC_KEY) {
  throw new Error('process.env.ISSUE_PUBLIC_KEY can not be undefined');
}

export const voteToken =
  new Asset(process.env.ASSET_NAME!, process.env.ISSUE_PUBLIC_KEY);

export interface Candidate {
  name: string;
  code: number;
}

const candidates: Candidate[] = [
  {
    name: 'PiS',
    code: 0,
  },
  {
    name: 'PO',
    code: 1,
  },
  {
    name: 'SLD',
    code: 2,
  },
  {
    name: 'Konfederacja',
    code: 3,
  },
];

interface Session {
  id: number;
  voterSession: VoterSession;
  transactionsBatch: TransactionsBatch,
  blindedTransactionsBatch: Array<BN>
}

let sessions: Array<Session>;

interface ResSession {
  id: number;
  R: Buffer;
}


async function initSessions(tokenId: string): Promise<Array<ResSession>> {
  const response = await fetch('/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tokenId }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    throw new Error(await response.text());
  }
  return response.json(); // TODO not sure if should not use await response.json()
}

export async function voteOnCandidate(tokenId: string, candidate: Candidate): Promise<Transaction> {
  // 1. Initialize interactive session
  const resSessions = await initSessions(tokenId);
  // 2. Signer has generated X number of sessions (associated id with R),
  // will use them now to blind transaction

  // 3. Let's fill all session with batch of transactions on each candidate
  sessions = await Promise.all(resSessions.map(async ({ id, R }) => {
    // 2.1 Generate batch of
    const transactionsBatch = await createRandomBatchOfTransaction(candidate);
    const voterSession = new VoterSession(distributionKeypair.rawPublicKey(), R);
    const session: Session = {
      id,
      voterSession,
      transactionsBatch,
      blindedTransactionsBatch: transactionsBatch.map(tx => {
        const txBuffer = Buffer.from(tx.transaction.toXDR());
        return voterSession.challenge(txBuffer)
      }),
    };
    return session;
  }));

  const luckyBatchIndex = await getChallenges(
    tokenId, sessions.map(session =>
      ({ id: session.id, blindedTransactionBatch: session.blindedTransactionsBatch })),
  );

  const proofs = sessions.filter((_, index) => index !== luckyBatchIndex);
  const signedLuckyBatch: { id: number, sigs: Array<BN> } = await respondChallenge(tokenId, proofs);
  const luckySession = sessions.find(session => session.id === signedLuckyBatch.id);
  if (!luckySession) {
    throw new Error('Could not find corresponding id session')
  }
  const { voterSession, transactionsBatch, id } = luckySession;
  const myCandidateTxIndex = transactionsBatch.findIndex(tx => tx.isMyOption);
  if (!myCandidateTxIndex) {
    throw new Error(`Could not find my option transaction in session id: ${id}`)
  }
  const signature = voterSession.signature(signedLuckyBatch.sigs[myCandidateTxIndex]);
  const tx = transactionsBatch[myCandidateTxIndex].transaction;
  tx.addSignature(distributionKeypair.publicKey(), signature.toHex());
  return tx
}

interface TransactionInBatch {
  candidateCode: number,
  memo: Memo,
  transaction: Transaction,
  isMyOption: boolean
}

type TransactionsBatch = Array<TransactionInBatch>;

async function createRandomBatchOfTransaction(myCandidate: Candidate): Promise<TransactionsBatch> {
  const seqNumber = (await server.loadAccount(distributionAccountId)).sequenceNumber();
  const account = new Account(distributionAccountId, seqNumber);
  const shuffledCandidates: Candidate[] = candidates
    .map(candidate => ({ sort: Math.random(), value: candidate }))
    .sort((a: any, b: any) => a.sort - b.sort)
    .map(a => a.value);

  return shuffledCandidates.map(candidate => {
    const memo = Memo.hash(encryptMemo(encodeMemo(candidate.code), distributionKeypair.rawPublicKey()).toString('utf-8'));
    return {
      transaction: createTransaction(account, memo),
      memo,
      candidateCode: candidate.code,
      isMyOption: myCandidate.code === candidate.code,
    } as TransactionInBatch;
  });
}

function createTransaction(account: Account, memo: Memo)
  : Transaction {
  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
    memo,
  })
    .addOperation(
      Operation.payment({
        destination: ballotAccountId,
        asset: voteToken,
        amount: `${1 / (10 ** 7)}`,
      }),
    )
    .setTimeout(30)
    .build();
}

async function getChallenges(
  tokenId: string,
  blindedTransactionBatches: Array<{ id: number, blindedTransactionBatch: Array<BN> }>)
  : Promise<number> {
  const response = await fetch('/getChallenges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tokenId, blindedTransactionBatches }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    throw new Error(await response.text());
  }
  const resText: string = await response.text();
  return Number(resText);
}

async function respondChallenge(tokenId: string, proofs: Session[])
  : Promise<{ id: number, sigs: Array<BN> }> {
  const response = await fetch('/proofChallenge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tokenId, proofs }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    throw new Error(await response.text());
  }
  return response.json();
}
