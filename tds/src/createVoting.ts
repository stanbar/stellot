import {
  AccountResponse,
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';
import { Voting, Authorization, KeybaseAuthOptions, CreateVotingRequest, CreateVotingResponse } from '@stellot/types';
import * as database from './database/voting';
import { saveKeychain } from './database/keychain';
import * as keybase from './authorizationServers/keybase';
import { saveAuthorizationOptions } from './database/authorizationOptions';
import * as ipfs from './ipfs'
import { createEncryptionKeypair } from '@stellot/crypto';

const debug = require('debug')('creatingVoting');

const server = new Server('https://horizon-testnet.stellar.org');
if (!process.env.MASTER_SECRET_KEY) {
  throw new Error('MASTER_SECRET_KEY must be provided in env variable')
}
const masterSecretKey = process.env.MASTER_SECRET_KEY;
const masterKeypair = Keypair.fromSecret(masterSecretKey);

export async function createVoting(createVotingRequest: CreateVotingRequest)
  : Promise<Omit<CreateVotingResponse, 'ipfsCid'>> {
  const masterAccount = await server.loadAccount(masterKeypair.publicKey());
  debug('loaded master account');
  const issuerKeypair = Keypair.random();
  await createIssuerAccount(masterAccount, issuerKeypair);
  debug('created issuer account');
  const voteToken = createVoteToken(issuerKeypair, createVotingRequest);
  debug('created vote token');
  const [distributionKeypair, ballotBoxKeypair] =
    await createDistributionAndBallotAccount(
      issuerKeypair,
      createVotingRequest,
      voteToken);
  debug('created distribution and ballot account');

  let encryptionKey
  let decryptionKey
  if (createVotingRequest.encrypted) {
    const encryptionKeys = await createEncryptionKeypair(128)
    encryptionKey = encryptionKeys.publicKey.toString('base64')
    decryptionKey = encryptionKeys.privateKey.toString('base64')

    debug('generated encryption keypair');
  }

  const voting: Omit<Omit<Omit<Omit<Voting, 'id'>, 'slug'>, 'authorizationOptions'>, 'ipfsCid'> = {
    title: createVotingRequest.title,
    polls: createVotingRequest.polls,
    issueAccountId: issuerKeypair.publicKey(),
    assetCode: voteToken.code,
    distributionAccountId: distributionKeypair.publicKey(),
    ballotBoxAccountId: ballotBoxKeypair.publicKey(),
    authorization: createVotingRequest.authorization,
    visibility: createVotingRequest.visibility,
    votesCap: createVotingRequest.votesCap,
    encryption: encryptionKey === undefined ? undefined : {
      encryptionKey,
      encryptedUntil: createVotingRequest.encryptedUntil ?? createVotingRequest.endDate
    },
    startDate: createVotingRequest.startDate,
    endDate: createVotingRequest.endDate,
  };

  const savedVoting = await database.saveVoting(voting)
    .then(savedVoting => {
      debug('saved voting');
      if (voting.authorization === Authorization.KEYBASE) {
        if (createVotingRequest.authorizationOptions as KeybaseAuthOptions | undefined) {
          const { team } = createVotingRequest.authorizationOptions as KeybaseAuthOptions;
          keybase.joinTeam(team);
          debug('send join team request');
          return { ...savedVoting, authorizationOptions: { team } }
        }
      }
      return { ...savedVoting, authorizationOptions: undefined }
    })
    .then(async (savedVoting) => {
      const cid = await ipfs.putVoting(savedVoting)
      debug(`uploaded voting to ipfs with cid ${cid}`);
      return { savedVoting, cid };
    }).then(({ savedVoting, cid }) => {
      return database.updateIpfsCid(savedVoting, cid)
    })

  await saveAuthorizationOptions(savedVoting, createVotingRequest.authorizationOptions);
  debug('saved authorizationOptions');
  await saveKeychain(savedVoting.id, issuerKeypair, distributionKeypair, ballotBoxKeypair, decryptionKey);
  debug('saved keychain');

  // TODO reverse changes if someone throws error
  return savedVoting
}

async function createIssuerAccount(masterAccount: AccountResponse, issuerKeypair: Keypair) {
  const tx = new TransactionBuilder(masterAccount, {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
  }).addOperation(Operation.createAccount({
    destination: issuerKeypair.publicKey(),
    startingBalance: '10',
  }))
    .setTimeout(30)
    .build();
  tx.sign(masterKeypair);
  await server.submitTransaction(tx);
}

function createVoteToken(issuer: Keypair, createVotingRequest: CreateVotingRequest): Asset {
  return new Asset(
    createVotingRequest.title.replace(/[^0-9a-z]/gi, '').substr(0, 11),
    issuer.publicKey())
}

async function createDistributionAndBallotAccount(
  issuerKeypair: Keypair,
  createVotingRequest: CreateVotingRequest,
  voteToken: Asset): Promise<[Keypair, Keypair]> {
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
  const distributionKeypair = Keypair.random();
  const ballotBoxKeypair = Keypair.random();

  const tx = new TransactionBuilder(issuerAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    // Create distribution account
    .addOperation(Operation.createAccount({
      destination: distributionKeypair.publicKey(),
      startingBalance: '2', // TODO calculate exactly
    }))
    // Create ballot box
    .addOperation(Operation.createAccount({
      destination: ballotBoxKeypair.publicKey(),
      startingBalance: '2', // TODO calculate exactly
    }))
    .addOperation(
      Operation.changeTrust({
        source: distributionKeypair.publicKey(),
        asset: voteToken,
        limit: `${createVotingRequest.votesCap / (10 ** 7)}`,
      }),
    )
    // Send all vote tokens to distribution account
    .addOperation(
      Operation.payment({
        destination: distributionKeypair.publicKey(),
        asset: voteToken,
        amount: `${createVotingRequest.votesCap / (10 ** 7)}`,
      }),
    )
    // Lock out issuer
    .addOperation(
      Operation.setOptions({
        masterWeight: 0,
        lowThreshold: 1,
        medThreshold: 1,
        highThreshold: 1,
      }),
    )
    .addOperation(
      Operation.changeTrust({
        source: ballotBoxKeypair.publicKey(),
        asset: voteToken,
        limit: `${createVotingRequest.votesCap / (10 ** 7)}`,
      }),
    )
    .setTimeout(30)
    .build();

  tx.sign(issuerKeypair, ballotBoxKeypair, distributionKeypair);
  await server.submitTransaction(tx);
  return [distributionKeypair, ballotBoxKeypair];
}