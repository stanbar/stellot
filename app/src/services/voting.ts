import {
  Account,
  Memo,
  Transaction,
} from 'stellar-sdk';
import BN from 'bn.js'
import { encodeMemo, encryptMemo, bytesToBase64, padMemoWithNonce } from '@/crypto/utils';
import {
  getChallenges,
  initSessions,
  proofChallenge,
  TransactionInBatch,
  TransactionsBatch,
  ResSession
} from "@/services/tds";
import { createTransaction, getAccountSequenceNumber } from "@/services/stellar";
import { Voting, Option } from "@stellot/types";
import { VoteStatus } from "@/types/voteStatus";
import _ from 'lodash';
import { ElGamal, decodePublicKey, EncryptionElGamal } from '@stellot/crypto'

import { encodeMemo as encryptAndEncodeMemo, decodeMemo, decodeTransactionMemo, VoterSession } from '@stellot/crypto';

interface Session {
  id: number;
  voterSession: VoterSession;
  transactionsBatch: TransactionsBatch,
  blindedTransactionsBatch: Array<BN>
}

let sessions: Array<Session>;

async function createTransactions(resSessions: Array<ResSession>, voting: Voting, optionCode: number) {
  const seqNumber = await getAccountSequenceNumber(voting.distributionAccountId);
  sessions = await Promise.all(resSessions.map(async ({ id, R, P }) => {
    // 3.1 Generate batch of
    const transactionsBatch = await createRandomBatchOfTransaction(seqNumber, voting, optionCode);
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
}

function createProofs(luckyBatchIndex: number) {
  return sessions
    .filter((_, index) => index !== luckyBatchIndex)
    .map(session => ({
      id: session.id,
      voterSession: session.voterSession.proof(),
      transactionsBatch: session.transactionsBatch,
    }));
}

function createBlindTransactions() {
  return sessions.map(session =>
    ({ id: session.id, blindedTransactionBatch: session.blindedTransactionsBatch }));
}

export async function* performSignedTransaction(voting: Voting, optionCode: number, authToken?: string)
  : AsyncGenerator<[Transaction | undefined, string | undefined]> {
  // 1. Initialize interactive session
  yield [undefined, VoteStatus.INITIALIZING];
  const [sessionId, resSessions] = await initSessions(voting.id, authToken);
  // 2. Signer has generated X number of sessions (associated id with R),
  // will use them now to blind transaction

  // 3. Let's fill all session with batch of transactions on each candidate
  yield [undefined, VoteStatus.CREATING_BLINDED_TRANSACTIONS];
  await createTransactions(resSessions, voting, optionCode);

  // 4. Request challenges given blindedTransactions
  yield [undefined, VoteStatus.REQUESTED_CHALLENGE];
  const blindTransactions = createBlindTransactions();
  const luckyBatchIndex = await getChallenges(sessionId, blindTransactions);
  // 5. Proof my honesty, and receive signed blind transacion in result
  yield [undefined, VoteStatus.PROVING_CHALLENGE];
  const proofs = createProofs(luckyBatchIndex);
  const signedLuckyBatch: { id: number, sigs: Array<BN> } = await proofChallenge(sessionId, proofs);
  // 6. Extract signed batch of signatures
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
  // 7. Calculate signature
  yield [undefined, VoteStatus.CALCULATING_SIGNATURE];
  const signature = voterSession.signature(signedLuckyBatch.sigs[myCandidateTxIndex]);
  const tx = transactionsBatch[myCandidateTxIndex].transaction;
  tx.addSignature(voting.distributionAccountId, bytesToBase64(signature));
  yield [tx, undefined];
}


async function createRandomBatchOfTransaction(
  seqNumber: string,
  voting: Voting, optionCode: number)
  : Promise<TransactionsBatch> {
  const shuffledCandidates: Option[] = _.shuffle(voting.polls[0].options)

  if (voting.encryption && !voting.encryption.encryptionKey) {
    throw new Error('encryption was specified but encryption-key is undefined')
  }
  let encryptor: EncryptionElGamal | undefined = undefined

  if (voting.encryption) {
    const encryptionKeyBuffer = new Buffer(voting.encryption.encryptionKey, 'base64')
    const publicKey = decodePublicKey(encryptionKeyBuffer)
    encryptor = ElGamal.fromPublicKey(publicKey.p.toString(), publicKey.g.toString(), publicKey.y.toString())
  }

  return shuffledCandidates.map(candidate => {
    const encodedMemo = encodeMemo(candidate.code)
    const textMemo = encryptor ? encryptMemo(encodedMemo, encryptor) : padMemoWithNonce(encodedMemo);
    const memo = Memo.hash(textMemo.toString('hex'));
    const account = new Account(voting.distributionAccountId, seqNumber);
    return new TransactionInBatch(
      candidate.code,
      memo,
      createTransaction(account, memo, voting),
      optionCode === candidate.code,
    )
  });
}
