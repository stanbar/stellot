import {
  Account,
  Asset,
  BASE_FEE,
  Memo,
  MemoText,
  Networks,
  Operation,
  Server,
  Transaction,
  TransactionBuilder,
  MemoHash
} from "stellar-sdk";
import { decodeMemo, decryptMemo } from "@/crypto/utils";
import { Option, Voting } from "@stellot/types";
import Result from "@/types/result";
import _ from 'lodash';
import { decodePrivateKey, ElGamal, DecryptionElGamal } from '@stellot/crypto';

const server = new Server('https://horizon-testnet.stellar.org');

export async function getAccountSequenceNumber(accountId: string) {
  return (await server.loadAccount(accountId)).sequenceNumber();
}

export function createTransaction(account: Account, memo: Memo, voting: Voting)
  : Transaction {
  const voteToken = new Asset(voting.assetCode, voting.issueAccountId);
  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
    memo,
    // TODO timebounds: endoftheelections
  })
    .addOperation(
      Operation.payment({
        destination: voting.ballotBoxAccountId,
        asset: voteToken,
        amount: `${1 / (10 ** 7)}`,
      }),
    )
    .setTimeout(30)
    .build();
}


export async function fetchResults(voting: Voting): Promise<Result[]> {
  const payments = await server
    .payments()
    .limit(200) // TODO Must not be hardcoded
    .join('transactions')
    .forAccount(voting.ballotBoxAccountId)
    .call();

  const transactions = await Promise.all(payments.records.filter(
    tx =>
      tx.asset_code === voting.assetCode &&
      tx.asset_issuer === voting.issueAccountId,
  ).map(payment => payment.transaction()));

  const results = voting.polls[0].options.map((option: Option) => ({
    option,
    votes: 0,
  }));

  let decryptor: DecryptionElGamal | undefined = undefined

  if (voting.encryption && voting.encryption.decryptionKey) {
    const privateKey = decodePrivateKey(Buffer.from(voting.encryption.decryptionKey, 'base64'))
    decryptor = ElGamal.fromPrivateKey(privateKey.p.toString(), privateKey.g.toString(), privateKey.y.toString(), privateKey.x.toString())
  }

  console.log({ numberOfTxs: transactions.length })
  transactions
    .filter(tx => tx.memo_type === MemoHash && tx.memo)
    .forEach(tx => {
      const memoBuffer = new Buffer(tx.memo!, 'base64')
      const candidateCode: Array<number> = decodeMemo(decryptor ? decryptMemo(memoBuffer, decryptor) : memoBuffer, 1); // TODO dont hardcore one answer
      const result = results.find(it => it.option.code === candidateCode[0]);
      if (result === undefined) {
        console.log(`Detected invalid vote on candidateCode: ${candidateCode}`)
      } else {
        result.votes += 1;
        console.log(`Detected valid vote on candidateCode: ${candidateCode}`)
      }
    });
  return _.shuffle(results.map(result => ({ name: result.option.name, votes: result.votes })));
}

export function getMyCandidate(voting: Voting, myTxMemo: string | Buffer): Option | undefined {
  return voting.polls[0].options.find(option => option.code === decodeMemo(myTxMemo, 1)[0])
}

export function castVote(tx: Transaction) {
  console.log('Submitting transaction');
  return server.submitTransaction(tx);
}

