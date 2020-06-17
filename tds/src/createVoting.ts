import { Keypair, } from 'stellar-sdk';
import { Voting, Authorization, KeybaseAuthOptions, CreateVotingRequest, CreateVotingResponse } from '@stellot/types';
import * as database from './database/voting';
import { saveKeychain } from './database/keychain';
import * as keybase from './authorizationServers/keybase';
import { saveAuthorizationOptions } from './database/authorizationOptions';
import * as ipfs from './ipfs'
import { createEncryptionKeypair } from '@stellot/crypto';
import { createIssuerAccount, createVoteToken, createDistributionAndBallotAccount } from './stellar';

const debug = require('debug')('creatingVoting');

if (!process.env.MASTER_SECRET_KEY) {
  throw new Error('MASTER_SECRET_KEY must be provided in env variable')
}
const masterSecretKey = process.env.MASTER_SECRET_KEY;
const masterKeypair = Keypair.fromSecret(masterSecretKey);

export async function createVoting(createVotingRequest: CreateVotingRequest)
  : Promise<Omit<CreateVotingResponse, 'ipfsCid'>> {
  debug('loaded master account');
  const issuerKeypair = Keypair.random();
  await createIssuerAccount(masterKeypair, issuerKeypair);
  debug('created issuer account');
  const voteToken = createVoteToken(issuerKeypair, createVotingRequest.title);
  debug('created vote token');
  const [distributionKeypair, ballotBoxKeypair] =
    await createDistributionAndBallotAccount(
      issuerKeypair,
      createVotingRequest.votesCap,
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
