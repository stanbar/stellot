import { Keypair } from 'stellar-sdk';
import {
  Voting,
  Authorization,
  KeybaseAuthOptions,
  CreateVotingRequest,
  CreateVotingResponse,
} from '@stellot/types';
import * as database from './database/voting';
import { saveKeychain } from './database/keychain';
import * as keybase from './authorizationServers/keybase';
import { saveAuthorizationOptions } from './database/authorizationOptions';
import * as ipfs from './ipfs';
import {
  createIssuerAccount,
  createVoteToken,
  createDistributionAndBallotAccount,
  createChannelAccounts,
} from './stellar';
import { saveChannels } from './database/channels';

const debug = require('debug')('castVote');

// const debug = require('debug')('creatingVoting');

if (!process.env.MASTER_SECRET_KEY) {
  throw new Error('MASTER_SECRET_KEY must be provided in env variable');
}
const masterSecretKey = process.env.MASTER_SECRET_KEY;
const masterKeypair = Keypair.fromSecret(masterSecretKey);

export async function createVoting({
  title,
  polls,
  authorization,
  authorizationOptions,
  visibility,
  votesCap,
  encrypted,
  encryptedUntil,
  startDate,
  endDate,
}: CreateVotingRequest): Promise<Omit<CreateVotingResponse, 'ipfsCid'>> {
  const { issuerStartingBalance, tdsStartingBalance } = calculateStartingBalances(votesCap);

  const issuerKeypair = Keypair.random();
  await createIssuerAccount(masterKeypair, issuerKeypair, issuerStartingBalance);
  debug('created issuer account');

  const channels = await createChannelAccounts(votesCap, issuerKeypair);
  debug('created channel accounts');

  const voteToken = createVoteToken(issuerKeypair.publicKey(), title);
  debug('created vote token');

  const [distributionKeypair, ballotBoxKeypair] = await createDistributionAndBallotAccount(
    issuerKeypair,
    votesCap,
    voteToken,
    tdsStartingBalance,
  );
  debug('created distribution and ballot account');

  let encryptionKey;
  let decryptionKey;
  if (encrypted) {
    const encryptionKeys = Keypair.random();
    encryptionKey = encryptionKeys.publicKey();
    decryptionKey = encryptionKeys.secret();
    console.log('generated encryption keypair');
  }

  const voting: Omit<Omit<Omit<Omit<Voting, 'id'>, 'slug'>, 'authorizationOptions'>, 'ipfsCid'> = {
    title: title,
    polls: polls,
    issueAccountId: issuerKeypair.publicKey(),
    assetCode: voteToken.code,
    distributionAccountId: distributionKeypair.publicKey(),
    ballotBoxAccountId: ballotBoxKeypair.publicKey(),
    authorization: authorization,
    visibility: visibility,
    votesCap: votesCap,
    encryption:
      encryptionKey === undefined
        ? undefined
        : {
            encryptionKey,
            encryptedUntil: encryptedUntil ?? endDate,
          },
    startDate: startDate,
    endDate: endDate,
  };

  const partialVoting = await database.saveVoting(voting);
  console.log('saved partial voting');
  let savedVoting;
  if (
    voting.authorization === Authorization.KEYBASE &&
    (authorizationOptions as KeybaseAuthOptions | undefined)
  ) {
    const { team } = authorizationOptions as KeybaseAuthOptions;
    keybase.joinTeam(team);
    console.log('send join team request');
    savedVoting = { ...partialVoting, authorizationOptions: { team } };
  } else {
    savedVoting = { ...partialVoting, authorizationOptions: undefined };
  }
  await saveAuthorizationOptions(partialVoting, authorizationOptions);
  console.log('saved authorizationOptions');

  saveChannels(savedVoting.id, channels);
  console.log('saved channels');

  await saveKeychain(
    savedVoting.id,
    issuerKeypair,
    distributionKeypair,
    ballotBoxKeypair,
    decryptionKey,
  );
  console.log('saved keychain');

  try {
    const cid = await ipfs.putVoting(savedVoting);
    console.log(`uploaded voting to ipfs with cid ${cid}`);
    return database.updateIpfsCid(savedVoting, cid);
  } catch (error) {
    // TODO reverse changes if someone throws error
    return savedVoting;
  }
}

function calculateStartingBalances(votesCap: number) {
  const tdsStartingBalance = votesCap * 2;
  const channelsFunding = votesCap * 2;
  const issuerStartingBalance = tdsStartingBalance + channelsFunding;
  return { issuerStartingBalance, tdsStartingBalance };
}
