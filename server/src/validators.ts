// import { Networks, Transaction } from 'stellar-sdk'
import { ChallengeSession, Proof } from './stellar';

if (!process.env.BALLOT_BOX_PUBLIC_KEY) {
  throw new Error('process.env.BALLOT_PUBLIC_KEY can not be undefined');
}

/*
const ballotAccountId = process.env.BALLOT_BOX_PUBLIC_KEY;

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


function validateSessions(currentSession, updatedSession) {
  if (updatedSession.blindedTransaction !== undefined) {
    throw new Error('blindedTransaction is undefined');
  }
  if (updatedSession.id !== currentSession.id) {
    throw new Error(`updatedSession.id: ${updatedSession.id} doesn't match
      currentSession.id: ${currentSession.id}`);
  }
  if (updatedSession.K !== currentSession.K) {
    throw new Error(`updatedSession.K: ${updatedSession.K} doesn't match
      currentSession.K: ${currentSession.K}`);
  }
}


function validateVoteTokenTransferOp(transaction) {
  const expectedIssueToken = transaction.operations[0]
  if (expectedIssueToken.type !== 'payment') {
    throw new Error(
      `operation[0] type is ${expectedIssueToken.type} but should be payment`,
    )
  }
  if (expectedIssueToken.asset.issuer !== voteToken.issuer) {
    throw new Error(
      `operation[0] issuer is ${expectedIssueToken.asset.issuer} but should be ${voteToken.issuer}`,
    )
  }
  if (expectedIssueToken.asset.code !== voteToken.code) {
    throw new Error(
      `operation[0] code is ${expectedIssueToken.asset.code} but should be ${voteToken.code}`,
    )
  }
  if (expectedIssueToken.amount !== '0.0000001') {
    throw new Error(
      `operation[0] amount is ${expectedIssueToken.amount} but should be 0.0000001`,
    )
  }
}

export function validateTransaction(txn: string) {
  const transaction = new Transaction(
    txn,
    Networks.TESTNET,
  );

  if (transaction.memo.type !== 'text') {
    throw new Error(
      `transaction.memo.type: ${transaction.memo.type} doesn't equal text`,
    )
  }
  if (String(transaction.memo.value) !== userId) {
    throw new Error(
      `transaction.memo: ${String(
        transaction.memo.value,
      )} doesn't equal userId: ${userId}`,
    )
  }
  if (transaction.operations.length !== 1) {
    throw new Error(
      `transaction.operations.length: ${transaction.operations.length} doesnt equal 1`,
    )
  }
  validateVoteTokenTransferOp(transaction)
}
 */

export function validateProof(challenge: ChallengeSession, proof: Proof): boolean {
  console.log(challenge, proof);
  return true
}
