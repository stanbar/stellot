import {
  Account,
  Asset,
  BASE_FEE,
  Memo,
  Operation,
  Server,
  Transaction,
  TransactionBuilder,
  MemoHash,
  Keypair,
  Horizon,
  MemoType,
  ServerApi,
} from 'stellar-sdk';
import { decodeMemo } from '@/crypto/utils';
import { Option, Voting } from '@stellot/types';
import Result from '@/types/result';
import _ from 'lodash';
import { decodeMemo as decryptMemo } from '@stellot/crypto';

const publicHorizons = [
  'https://horizon-testnet.stellar.org',
  'https://horizon.stellar.lobstr.co/',
  'https://stellar-horizon.satoshipay.io/',
  'https://horizon.stellar.coinqvest.com/',
];
const server = new Server(HORIZON_SERVER_URL);
const OPTIONS = {
  fee: BASE_FEE,
  networkPassphrase: NETWORK_PASSPHRASE,
};

export async function getAccountSequenceNumber(accountId: string) {
  return (await server.loadAccount(accountId)).sequenceNumber();
}

export function createTransaction(account: Account, memo: Memo, voting: Voting): Transaction {
  const voteToken = new Asset(voting.assetCode, voting.issueAccountId);
  return new TransactionBuilder(account, {
    ...OPTIONS,
    memo,
  })
    .addOperation(
      Operation.payment({
        destination: voting.ballotBoxAccountId,
        asset: voteToken,
        amount: `${1 / 10 ** 7}`,
      }),
    )
    .setTimeout(30)
    .build();
}

export function parseTransactiion(transactionXdr: string) {
  return new Transaction(transactionXdr, OPTIONS.networkPassphrase);
}

export function publishAccountCreationTx(tx: Transaction) {
  return server.submitTransaction(tx);
}

export async function loadAccount(publicKey: string) {
  return await server.loadAccount(publicKey);
}

export async function createCastVoteTransaction(
  voterKeypair: Keypair,
  voteToken: Asset,
  ballotBoxPublicKey: string,
  encryptedMemo: Memo,
  mergeAccountId: string,
): Promise<Horizon.SubmitTransactionResponse> {
  const voterAccount = await server.loadAccount(voterKeypair.publicKey());
  const tx = new TransactionBuilder(voterAccount, {
    ...OPTIONS,
    memo: encryptedMemo,
    // TODO timebounds: endoftheelections
  })
    .addOperation(
      Operation.payment({
        destination: ballotBoxPublicKey,
        asset: voteToken,
        amount: `${1 / 10 ** 7}`,
      }),
    )
    .addOperation(
      Operation.changeTrust({
        asset: voteToken,
        limit: '0',
      }),
    )
    .addOperation(
      Operation.accountMerge({
        destination: mergeAccountId,
      }),
    )
    .setTimeout(30)
    .build();
  tx.sign(voterKeypair);
  return server.submitTransaction(tx);
}

export async function fetchResults(voting: Voting): Promise<Result[]> {
  const payments = await server
    .payments()
    .limit(200) // TODO Must not be hardcoded
    .join('transactions')
    .forAccount(voting.ballotBoxAccountId)
    .call();

  const transactions = await Promise.all(
    payments.records
      .filter(
        (tx) => tx.asset_code === voting.assetCode && tx.asset_issuer === voting.issueAccountId,
      )
      .map((payment) => payment.transaction()),
  );

  const results = voting.polls[0].options.map((option: Option) => ({
    option,
    votes: 0,
  }));

  const decryptedMemo = async (
    tx: ServerApi.TransactionRecord,
    memoBuffer: Buffer,
  ): Promise<Memo<MemoType.Hash>> =>
    decryptMemo(
      tx.source_account_sequence,
      Keypair.fromSecret(voting.encryption!.decryptionKey!),
      tx.source_account,
      Memo.hash(memoBuffer.toString('hex')),
    ) as Promise<Memo<MemoType.Hash>>;

  console.log({ numberOfTxs: transactions.length });
  await Promise.all(
    transactions
      .filter((tx) => tx.memo_type === MemoHash && tx.memo)
      .map(async (tx) => {
        const memoBuffer = Buffer.from(tx.memo!, 'base64');

        const candidateCode: Array<number> = decodeMemo(
          voting.encryption?.decryptionKey
            ? (await decryptedMemo(tx, memoBuffer)).value
            : memoBuffer,
          1,
        ); // TODO dont hardcore one answer
        const result = results.find((it) => it.option.code === candidateCode[0]);
        if (result === undefined) {
          console.log(`Detected invalid vote on candidateCode: ${candidateCode}`);
        } else {
          result.votes += 1;
          console.log(`Detected valid vote on candidateCode: ${candidateCode}`);
        }
      }),
  );
  return _.shuffle(results.map((result) => ({ name: result.option.name, votes: result.votes })));
}

export async function getMyCandidate(
  voting: Voting,
  memoBuffer: Buffer,
  seqNumber: string,
  voterPublicKey: string,
): Promise<Option | undefined> {
  console.log({ memoBuffer, seqNumber, voterPublicKey });
  const decryptedMemo = async (memoBuffer: Buffer): Promise<Memo<MemoType.Hash>> =>
    decryptMemo(
      seqNumber,
      Keypair.fromSecret(voting.encryption!.decryptionKey!),
      voterPublicKey,
      Memo.hash(memoBuffer.toString('hex')),
    ) as Promise<Memo<MemoType.Hash>>;
  const candidateCode: Array<number> = decodeMemo(
    voting.encryption ? (await decryptedMemo(memoBuffer)).value : memoBuffer,
    1,
  ); // TODO dont hardcore one answer

  return voting.polls[0].options.find((option) => option.code === candidateCode[0]);
}

export function castVote(tx: Transaction) {
  return server.submitTransaction(tx);
}
