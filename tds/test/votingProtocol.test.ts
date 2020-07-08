import test, { ExecutionContext } from 'ava';
import {
  Keypair,
  TransactionBuilder,
  Server,
  Networks,
  Operation,
  BASE_FEE,
  Asset,
  Memo,
  Transaction,
  MemoType,
} from 'stellar-sdk';
import {
  createIssuerAccount,
  createVoteToken,
  createDistributionAndBallotAccount,
  createChannelAccounts,
} from '../src/stellar';
import { randomBytes } from 'crypto';
import { encodeMemo } from '../src/utils';
import { ed25519, VoterSession, SignerSession, encodeMemo as encryptMemo } from '@stellot/crypto';
import jwt from 'jsonwebtoken';
import BN from 'bn.js';

const masterKeypair = Keypair.fromSecret(
  'SAC34ZEECSNNHLWKG66VTU3YKTGCHEVW5423NBNP5PXH6XFTVBQNJBQ6',
);
const server = new Server('https://horizon-testnet.stellar.org');
const OPTIONS = { fee: BASE_FEE, networkPassphrase: Networks.TESTNET };
const VOTING_ID = 'dean election pg 2021';
const USER_ID = 'asdfzxvccvbndfghrtyu123456';
const AS_KEY = 'it should be asymetric es256 keys';

function AS() {
  const obtainAuthenticationToken = () =>
    jwt.sign({ userId: USER_ID, votingId: VOTING_ID }, AS_KEY, {
      audience: 'Stellot',
      issuer: 'Stellot',
    });
  return { obtainAuthenticationToken };
}

function Voter(t: ExecutionContext, tdsBlindSigPublicKey: Buffer, nonce: Buffer) {
  const voterSession = new VoterSession(tdsBlindSigPublicKey, nonce);
  const keypair = Keypair.random();

  console.log(tdsBlindSigPublicKey);
  const generateMessage = () =>
    Buffer.concat([
      Buffer.from(tdsBlindSigPublicKey),
      Buffer.from(VOTING_ID), // user-generated id, it will be used by TDS to identify the user
    ]);
  const getChallenge = (message: Buffer) => voterSession.challenge(message);
  const signature = (blindedSignature: BN) => voterSession.signature(blindedSignature);
  const publicKey = () => keypair.publicKey();
  const publishAccountTransaction = (tx: Transaction) => {
    tx.sign(keypair);
    return server.submitTransaction(tx);
  };
  const createEncodedMemo = (voteOption: number): Memo<MemoType.Hash> =>
    Memo.hash(encodeMemo(voteOption).toString('hex'));
  const publishVoteTransaction = async (
    memo: Memo<MemoType.Hash>,
    voteToken: Asset,
    mergePublicKey: string,
    ballotBoxPublicKey: string,
    encryptionKey: string,
  ) => {
    const account = await server.loadAccount(keypair.publicKey());
    const encryptedMemo = await encryptMemo(account.sequenceNumber(), keypair, encryptionKey, memo);
    t.deepEqual(
      encryptedMemo,
      await encryptMemo(account.sequenceNumber(), keypair, encryptionKey, memo),
    );

    const tx = new TransactionBuilder(account, { ...OPTIONS, memo: encryptedMemo })
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
          destination: mergePublicKey,
        }),
      )
      .setTimeout(30)
      .build();
    tx.sign(keypair);
    return server.submitTransaction(tx);
  };

  return {
    generateMessage,
    getChallenge,
    signature,
    publishVoteTransaction,
    createEncodedMemo,
    publishAccountTransaction,
    publicKey,
  };
}

async function TDS(t: ExecutionContext, votesCap: number) {
  const tdsBlindingSessionKeypair = ed25519.keyFromSecret(randomBytes(32));
  const encryptionKeypair = Keypair.random();
  // This value must be constant to every voter and available to every voter
  const signerSession = new SignerSession(tdsBlindingSessionKeypair.getSecret());
  const {
    issuerKeypair,
    distributionKeypair,
    ballotBoxKeypair,
    votingToken,
    channels,
  } = await createVoting();
  const usedChannels = [];

  async function createVoting() {
    const issuerKeypair = Keypair.random();
    const tdsStartingBalance = votesCap * 2;
    const channelsFunding = votesCap * 2;
    const issuerStartingBalance = tdsStartingBalance + channelsFunding;

    await createIssuerAccount(masterKeypair, issuerKeypair, issuerStartingBalance);
    const channels = await createChannelAccounts(votesCap, issuerKeypair);

    const votingToken = createVoteToken(issuerKeypair.publicKey(), randomBytes(20).toString('hex'));
    console.log('created vote token', votingToken);

    const [distributionKeypair, ballotBoxKeypair] = await createDistributionAndBallotAccount(
      issuerKeypair,
      votesCap,
      votingToken,
      tdsStartingBalance,
    );

    console.log('created tds, ballotbox and vote token');
    return { issuerKeypair, distributionKeypair, ballotBoxKeypair, votingToken, channels };
  }

  const initBlindToken = (authenticationToken: string) => {
    // @ts-ignore
    const { userId, votingId } = jwt.verify(authenticationToken, AS_KEY, {
      audience: 'Stellot',
      issuer: 'Stellot',
    });

    t.true(USER_ID === userId);
    t.true(VOTING_ID === votingId);

    // TDS check if the voter did not issued token yet
    // TDS allow user to create blindedTransaction by generating him the blinding factor
    return {
      nonce: ed25519.encodePoint(signerSession.publicNonce()),
      publicKey: ed25519.encodePoint(signerSession.publicKey()),
    };
  };
  const publicNonce = () => signerSession.publicNonce();
  const publicKey = () => signerSession.publicKey();
  const signBlindly = (challenge: BN) => signerSession.sign(challenge);
  const tdsPublicKey = () => distributionKeypair.publicKey();
  const issuerPublicKey = () => issuerKeypair.publicKey();
  const encryptionKey = () => encryptionKeypair.publicKey();
  const decryptionKey = () => encryptionKeypair.secret();
  const ballotBoxPublicKey = () => ballotBoxKeypair.publicKey();

  const requestAccountCreation = async (
    voterPublicKey: string,
    authorizationToken: { message: Buffer; signature: Buffer },
  ) => {
    if (
      !ed25519.verify(
        authorizationToken.message,
        authorizationToken.signature,
        tdsBlindingSessionKeypair.getPublic(),
      )
    ) {
      throw new Error('Verification failed');
    }

    const publicKeyPoint = authorizationToken.message.slice(
      0,
      ed25519.encodePoint(signerSession.publicKey()).length,
    );
    t.deepEqual(publicKeyPoint, Buffer.from(tdsBlindingSessionKeypair.getPublic()));
    const votingId = authorizationToken.message
      .slice(Buffer.from(tdsBlindingSessionKeypair.getPublic()).length)
      .toString();
    console.log('extraction votingId', votingId);
    t.deepEqual(votingId, VOTING_ID);
    // check if userId is already contained in the issuedUsers db
    const channel = channels.pop();
    if (!channel) {
      throw new Error('Could not allocate new channel');
    }
    usedChannels.push(channel);

    const channelAccount = await server.loadAccount(channel.publicKey());

    // For better scalability it should go through channel account
    const tx = new TransactionBuilder(channelAccount, OPTIONS)
      .addOperation(
        Operation.createAccount({
          source: distributionKeypair.publicKey(),
          destination: voterPublicKey,
          startingBalance: '2',
        }),
      )
      .addOperation(
        Operation.changeTrust({
          source: voterPublicKey,
          asset: votingToken,
          limit: `${votesCap / 10 ** 7}`,
        }),
      )
      .addOperation(
        Operation.payment({
          source: distributionKeypair.publicKey(),
          destination: voterPublicKey,
          asset: votingToken,
          amount: `${1 / 10 ** 7}`,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(channel, distributionKeypair);
    return tx;
  };

  return {
    initBlindToken,
    publicNonce,
    publicKey,
    signBlindly,
    tdsPublicKey,
    issuerPublicKey,
    requestAccountCreation,
    encryptionKey,
    decryptionKey,
    ballotBoxPublicKey,
    votingToken,
  };
}

test.only('complete voting protocol', async (t: ExecutionContext) => {
  const VOTES_CAP = 20;
  try {
    const tds = await TDS(t, VOTES_CAP);
    const as = AS();
    await Promise.all(
      [1, 2, 3].map(async index => {
        console.log(`starting ${index} voter`);
        // Voter authenticate in AS with his ID
        // ...
        // AS issue JWT authenticationToken
        const authenticationToken = as.obtainAuthenticationToken();
        console.log(authenticationToken);

        // Voter present the authenticationToken to TDS
        // TDS verify the token
        const { publicKey, nonce } = tds.initBlindToken(authenticationToken);

        // Voter prepare the blinding token using the blinding factor
        const voter = Voter(t, publicKey, nonce);
        const message = voter.generateMessage();
        const challenge = voter.getChallenge(message);
        const blindedSignature = tds.signBlindly(challenge);
        const signature = voter.signature(blindedSignature);

        const authorizationToken = { signature, message };

        // Voter waits some random time peroid 1-10s
        // and shows up as anonymous voter with blindly singed token
        // and request account creation transaction

        const accountCreationTx = await tds.requestAccountCreation(
          voter.publicKey(),
          authorizationToken,
        );
        const createAccRes = await voter.publishAccountTransaction(accountCreationTx);
        console.log(createAccRes.hash);

        const encodedMemo = voter.createEncodedMemo(1);
        const castVoteRes = await voter.publishVoteTransaction(
          encodedMemo,
          tds.votingToken,
          tds.tdsPublicKey(),
          tds.ballotBoxPublicKey(),
          tds.encryptionKey(),
        );
        console.log(castVoteRes.hash);
      }),
    );
  } catch (e) {
    if (e.response?.data?.extras) {
      console.log({
        extras: e.response.data.extras,
        operations: e.response.data.extras.result_codes.operations,
      });
      t.fail();
    } else {
      throw e;
    }
  }
});
