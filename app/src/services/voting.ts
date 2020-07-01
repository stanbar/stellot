import { Account, Memo, Keypair, MemoType, Asset, Horizon } from 'stellar-sdk';
import { encodeMemo } from '@/crypto/utils';
import { initSession, getSignedToken, requestAccountCreation } from '@/services/castVote';
import {
  publishAccountCreationTx,
  createCastVoteTransaction,
  loadAccount,
  parseTransactiion,
} from '@/services/stellar';
import { Voting } from '@stellot/types';
import { VoteStatus } from '@/types/voteStatus';
import _ from 'lodash';
import { encodeMemo as encryptMemo } from '@stellot/crypto';
import { VoterSession } from '@stellot/crypto';
import * as storage from '@/storage';

export async function* performCastVoteTransaction(
  voting: Voting,
  optionCode: number,
  authToken?: string,
): AsyncGenerator<string> {
  // 1. Initialize interactive session
  yield VoteStatus.INITIALIZING;
  const [sessionId, resSession] = await initSession(voting.id, authToken);
  // 2. Signer has generated nonce and publicKey
  // will use them now to create blind authorization token

  const voterSession = new VoterSession(resSession.publicKey, resSession.nonce);
  // 3. Let's fill all session with batch of transactions on each candidate
  yield VoteStatus.CREATING_BLINDED_TOKEN;
  const authTokenMessage = createAuthorizationTokenMessage(voting.id, resSession.publicKey);
  const blindSig = await getSignedToken(sessionId, voterSession.challenge(authTokenMessage));
  const signature = voterSession.signature(blindSig);
  let keypair = Keypair.random();
  yield VoteStatus.PREPARING_VOTING_ACCOUNT;
  const accountCreationTx = await requestAccountCreation(keypair.publicKey(), voting.id, {
    message: authTokenMessage,
    signature,
  });

  yield VoteStatus.PUBLISH_ACCOUNT_CREATION_TRANSACTION;
  const tx = parseTransactiion(accountCreationTx);
  tx.sign(keypair);
  await publishAccountCreationTx(tx);

  yield VoteStatus.WAITING_RANDOM_PEROID;
  await waitRandomTime(1000, 10000);

  yield VoteStatus.CASTING_VOTE;
  const voterAccount = await loadAccount(keypair.publicKey());
  const [memo, res] = await castVoteTransaction(keypair, voting, voterAccount, optionCode);

  yield VoteStatus.SAVING_CASTED_TRANSACTION;
  storage.setMyTransaction(
    voting.id,
    res.hash,
    memo.value,
    // seq is incremented after the transaction is processed,
    // here we could loadAccount, but manually incremeneting the counter is much faster
    `${Number(voterAccount.sequenceNumber()) + 1}`,
    keypair.publicKey(),
  );
  storage.setAlreadyVotedIn(voting.id);
  yield VoteStatus.DONE;

  // Overwrite keypair in memory
  keypair = Keypair.random();
}

function createAuthorizationTokenMessage(votingId: string, tdsPublicKey: string) {
  return Buffer.concat([Buffer.from(tdsPublicKey, 'hex'), Buffer.from(votingId)]);
}

function waitRandomTime(min: number, max: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.round(min + Math.random() * (max - min))),
  );
}

const createEncodedMemo = (voteOption: number): Memo<MemoType.Hash> =>
  Memo.hash(encodeMemo(voteOption).toString('hex'));

async function castVoteTransaction(
  voterKeyPair: Keypair,
  voting: Voting,
  voterAccount: Account,
  optionCode: number,
): Promise<[Memo<MemoType.Hash>, Horizon.SubmitTransactionResponse]> {
  if (voting.encryption && !voting.encryption.encryptionKey) {
    throw new Error('encryption was specified but encryption-key is undefined');
  }

  const encodedMemo = createEncodedMemo(optionCode);
  const encryptedMemo = voting.encryption
    ? ((await encryptMemo(
        voterAccount.sequenceNumber(),
        voterKeyPair,
        voting.encryption.encryptionKey,
        encodedMemo,
      )) as Memo<MemoType.Hash>)
    : encodedMemo;

  const voteToken = new Asset(voting.assetCode, voting.issueAccountId);
  const res = await createCastVoteTransaction(
    voterKeyPair,
    voteToken,
    voting.ballotBoxAccountId,
    encryptedMemo,
    voting.distributionAccountId,
  );
  return [encryptedMemo, res];
}
