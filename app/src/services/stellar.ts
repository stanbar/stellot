import {
  Account,
  BASE_FEE,
  Memo,
  MemoText,
  Networks,
  Operation,
  Server,
  Transaction,
  TransactionBuilder,
  Asset
} from "stellar-sdk";
import { decodeAnswersFromMemo } from "@/crypto/utils";
import Voting from "@/types/voting";
import Option from "@/types/option";
import Result from "@/types/result";

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

  transactions
    .filter(tx => tx.memo_type === MemoText && tx.memo)
    .forEach(tx => {
      const candidateCode: Array<number> = decodeAnswersFromMemo(tx.memo!, 1); // TODO dont hardcore one answer
      const result = results.find(it => it.option.code === candidateCode[0]);
      if (result === undefined) {
        console.log(`Detected invalid vote on candidateCode: ${candidateCode}`)
      } else {
        result.votes += 1;
        console.log(`Detected valid vote on candidateCode: ${candidateCode}`)
      }
    });
  return results.map(result => ({ name: result.option.name, votes: result.votes }));
}

export function castVote(tx: Transaction) {
  console.log('Submitting transaction');
  return server.submitTransaction(tx);
}

