import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Memo,
  Networks,
  Operation,
  Server,
  Transaction,
  TransactionBuilder,
  MemoText,
} from 'stellar-sdk';
import BN from 'bn.js'
import $ from 'jquery';
import { decodeAnswersFromMemo, encodeMemo, encryptMemo } from './utils';
import { VoterSession } from './blindsig';

const server = new Server('https://horizon-testnet.stellar.org');
if (!process.env.DISTRIBUTION_PUBLIC_KEY) {
  throw new Error('process.env.DISTRIBUTION_PUBLIC_KEY can not be undefined');
}
const distributionAccountId = process.env.DISTRIBUTION_PUBLIC_KEY;

if (!process.env.BALLOT_BOX_PUBLIC_KEY) {
  throw new Error('process.env.BALLOT_PUBLIC_KEY can not be undefined');
}
const ballotAccountId = process.env.BALLOT_BOX_PUBLIC_KEY;

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

const ANSWERS = 1;
const CANDIDATES: Candidate[] = [
  {
    name: 'PiS',
    code: 1,
  },
  {
    name: 'PO',
    code: 2,
  },
  {
    name: 'SLD',
    code: 3,
  },
  {
    name: 'Konfederacja',
    code: 4,
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
  R: string; // hex
  P: string; // hex
}

export async function voteOnCandidate(tokenId: string, candidate: Candidate) {
  // 1. Initialize interactive session
  $('#btnVote').html('Initializing');
  const resSessions = await initSessions(tokenId);
  console.log({ resSessions });
  // 2. Signer has generated X number of sessions (associated id with R),
  // will use them now to blind transaction

  // 3. Let's fill all session with batch of transactions on each candidate
  $('#btnVote').html('Fetching sequence number from stellar network');
  const seqNumber = (await server.loadAccount(distributionAccountId)).sequenceNumber();
  $('#btnVote').html('Creating blind transactions');
  sessions = await Promise.all(resSessions.map(async ({ id, R, P }) => {
    // 3.1 Generate batch of
    const transactionsBatch = await createRandomBatchOfTransaction(seqNumber, candidate);
    const voterSession = new VoterSession(P, R);
    const session: Session = {
      id,
      voterSession,
      transactionsBatch,
      blindedTransactionsBatch: transactionsBatch.map(tx =>
        voterSession.challenge(tx.transaction.hash())),
    };
    return session;
  }));

  // 4. Request challenges given blindedTransactions
  $('#btnVote').html('Requested challenge');
  const luckyBatchIndex = await getChallenges(
    tokenId, sessions.map(session =>
      ({ id: session.id, blindedTransactionBatch: session.blindedTransactionsBatch })),
  );

  const proofs = sessions.filter((_, index) => index !== luckyBatchIndex);
  // 5. Proof my honesty, and receive signed blind transacion in result
  $('#btnVote').html('Proofing challenge');
  const signedLuckyBatch: { id: number, sigs: Array<BN> } = await proofChallenge(tokenId, proofs);
  const luckySession = sessions.find(session => session.id === signedLuckyBatch.id);
  if (!luckySession) {
    console.error({ sessions });
    throw new Error('Could not find corresponding id session')
  }
  const { voterSession, transactionsBatch, id } = luckySession;
  const myCandidateTxIndex = transactionsBatch.findIndex(tx => tx.isMyOption);
  if (myCandidateTxIndex === -1) {
    console.error(transactionsBatch);
    throw new Error(`Could not find my option transaction in session id: ${id}`)
  }
  $('#btnVote').html('Calculating signature');
  const signature = voterSession.signature(signedLuckyBatch.sigs[myCandidateTxIndex]);
  const tx = transactionsBatch[myCandidateTxIndex].transaction;
  tx.addSignature(distributionKeypair.publicKey(), signature);

  console.log('Submiting transaction');
  // 6. Send transaction to stellar network
  $('#btnVote').html('Casting vote');
  await server.submitTransaction(tx);
  $('#btnVote').html('Done!');
  console.log('Successfully submitted transaction to stellar network');
}

async function initSessions(tokenId: string): Promise<Array<ResSession>> {
  const response = await fetch('/api/init', {
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
  const responseJson: Array<{
    id: number,
    R: Array<number>,
    P: Array<number>
  }> = await response.json();

  const mapped = responseJson.map(res => ({
    id: res.id,
    R: Buffer.from(res.R).toString('hex'),
    P: Buffer.from(res.P).toString('hex'),
  }));
  console.log({ mapped });
  return mapped
}

class TransactionInBatch {
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

type TransactionsBatch = Array<TransactionInBatch>;

async function createRandomBatchOfTransaction(
  seqNumber: string,
  myCandidate: Candidate)
  : Promise<TransactionsBatch> {
  const shuffledCandidates: Candidate[] = CANDIDATES
    .map(candidate => ({ sort: Math.random(), value: candidate }))
    .sort((a: any, b: any) => a.sort - b.sort)
    .map(a => a.value);

  return shuffledCandidates.map(candidate => {
    const memo = Memo.text(encryptMemo(encodeMemo(candidate.code), distributionKeypair.rawPublicKey()).toString('ascii'));
    console.log({ memo });
    const account = new Account(distributionAccountId, seqNumber);
    return new TransactionInBatch(
      candidate.code,
      memo,
      createTransaction(account, memo),
      myCandidate.code === candidate.code,
    )
  });
}

function createTransaction(account: Account, memo: Memo)
  : Transaction {
  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
    memo,
    // TODO timebounds: endoftheelections
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
  const response = await fetch('/api/getChallenges', {
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
  const res: { luckyBatchTransaction: number } = await response.json();
  return res.luckyBatchTransaction;
}

async function proofChallenge(tokenId: string, proofs: Session[])
  : Promise<{ id: number, sigs: Array<BN> }> {
  const response = await fetch('/api/proofChallenges', {
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
  const signedLuckyBatch: { id: number, sigs: Array<BN> } = await response.json();
  signedLuckyBatch.sigs = signedLuckyBatch.sigs.map(sig => new BN(sig, 16));
  return signedLuckyBatch
}

export interface Result {
  candidate: Candidate;
  votes: number
}

export async function fetchResults(): Promise<Result[]> {
  const payments = await server
    .payments()
    .limit(200) // TODO Must not be hardcoded
    .join('transactions')
    .forAccount(ballotAccountId)
    .call();

  const transactions = await Promise.all(payments.records.filter(
    tx =>
      tx.asset_code === voteToken.code &&
      tx.asset_issuer === voteToken.issuer,
  ).map(payment => payment.transaction()));

  const results = CANDIDATES.map(candidate => ({
    candidate,
    votes: 0,
  }));

  transactions
    .filter(tx => tx.memo_type === MemoText && tx.memo)
    .forEach(tx => {
      const candidateCode: Array<number> = decodeAnswersFromMemo(tx.memo!, ANSWERS);
      const result = results.find(it => it.candidate.code === candidateCode[0]);
      if (result === undefined) {
        console.log(`Detected invalid vote on candidateCode: ${candidateCode}`)
      } else {
        result.votes += 1;
        console.log(`Detected valid vote on candidateCode: ${candidateCode}`)
      }
    });
  return results;
}
