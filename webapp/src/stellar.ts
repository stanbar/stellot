import StellarSdk from 'stellar-sdk';
import { randomBytes, getRandomInt, createMemo, decodeCandidateCodeFromMemo } from './utils';

StellarSdk.Network.useTestNetwork();

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const distributionAccountId = 'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU';

const ballotAccountId = process.env.BALLOT_PUBLIC_KEY;

export const distributionKeypair = StellarSdk.Keypair.fromPublicKey(distributionAccountId);

export const voteToken = new StellarSdk.Asset(process.env.ASSET_NAME, process.env.ISSUE_PUBLIC_KEY);

interface Candidate {
  name: string;
  code: int;
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
  sesson: VoterSession;
  transactionXdr: string[]; // TO MUST BE IN RANDOM ORDER
  candidateCode: number[]; // TO MUST BE IN RANDOM ORDER
  memo: Buffer[]; // TO MUST BE IN RANDOM ORDER
}

let sessions: Array<{ id: number; transactionXdr: string; sesson: VoterSession }>;

interface ResSession {
  id: number;
  R: Buffer;
}

async function voteOnCandidate(tokenId: string, candidate: Candidate) {
  const keyPair = ed25519.keyFromPublic(distributionKeypair.rawPublicKey());
  const resSessions = await initSessions(tokenId);

  sessions = resSessions.map(
    (resSession: ResSession) => {
      const {candidateCode, memo, transactions[]} = createRandomBatchOfTransaction()
      const session: Session = {
        id: resSession.id,
        candidateCode,
        memo,
        session: new VoterSessions(keyPair.public(), resSession.R),
        transactionXdr: transaction.toXDR(),
      }
    }
    ),
  );

  const { sessionId, luckyBatchTransactionSignatures, luckyTransactionIndex } = await getChallenges(tokenId);
    const session = sessions[sessionId][luckyTransactionIndex]
  const myLuckyTransaction = luckyBatchTransactionSignatures.find(sig => {
    return session.transactionXdr.find(txXdr => {
      const tx = new StellarSdk.Transaction(txXdr)
      return decodeCandidateCodeFromMemo(tx.memo) === decodeCandidateCodeFromMemo(transaction.memo)

    })
  }

  )
  sessions[sessionId].session.singature(myLuckyTransaction)
  if(sessions[luckyTransaction].candidateCode === candidate.code){
    // TODO proceed
  } else {
    // TODO redo, so maybe just //initSessions(tokenId) again until it success
  }
}

async function initSessions(tokenId: string): Array<ResSession> {
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
  return await response.json();
}

export async function createRandomBatchOfTransaction(candidate: Candidate): string[] {
  const account = await server.loadAccount(distributionAccountId);
  const fee = await server.fetchBaseFee();

   const shuffledCandidates = candidates.shuffle()
   const batchOfTransactions = shuffledCandidates.map((candidate => {

     const candidateCode = getRandomInt(candidates.length - 1)
     const memo = Memo.hash(createMemo(candidateCode));
     const transaction = new StellarSdk.TransactionBuilder(account, { fee, memo })
     .addOperation(
       StellarSdk.Operation.payment({
         destination: ballotAccountId,
         asset: voteToken,
         amount: `${1 / 10 ** 7}`,
       }),
     )
     .setTimeout(30)
     .build();

    return { candidateCode, memo, transaction, isMyOption: candidateCode === candidate.code}
   }))

   return batchOfTransactions;
}


async function getChallenges(tokenId: string): number {
  const blindedTransactions = sessions.map((session: Session) => ({
    id: session.id,
    challenge: session.session.challenge(session.transactionXdr)

  }));
  const response = await fetch('/getChallenges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tokenId, blindedTransactions }),
  });

  if (response.ok) {
    console.log('Successfully inited session');
  } else {
    console.error('Failed to init session');
    throw new Error(await response.text());
  }
  const resText: string = await response.text();
  return number(resText)
}

export async function fetchAccountTokenBalance(accountId) {
  const account = await server
    .accounts()
    .accountId(accountId)
    .call();

  const balance = userAccount.balances.find(
    aBalance =>
      aBalance.asset_code === voteToken.code && aBalance.asset_issuer === voteToken.issuer,
  );

  if (balance) {
    return Math.round(balance.balance * 10 ** 7);
  }
  return undefined;
}
