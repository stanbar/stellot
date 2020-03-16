import { uuid } from 'uuidv4';
import {
  Server,
  Keypair,
  AccountResponse,
  BASE_FEE,
  Networks,
  TransactionBuilder,
  Operation,
  Asset,
} from 'stellar-sdk';
import CreateVotingRequest from './types/createVotingRequest';
import CreateVotingResponse from './types/createVotingResponse';
import Voting from './types/voting';
import { setKeychain, setVoting } from './database';

const server = new Server('https://horizon-testnet.stellar.org');
if (!process.env.ISSUE_SECRET_KEY) {
  throw new Error('ISSUE_SECRET_KEY must be provided in env variable')
}
const issuerSecretKey = process.env.ISSUE_SECRET_KEY;
const issuerKeypair = Keypair.fromSecret(issuerSecretKey);

export async function getAccountSequenceNumber(accountId: string) {
  return (await server.loadAccount(accountId)).sequenceNumber();
}

export async function createVoting(createVotingRequest: CreateVotingRequest):
  Promise<CreateVotingResponse> {
  const id = uuid();
  const issuer = await server.loadAccount(issuerKeypair.publicKey());
  const voteToken = createVoteToken(issuer, createVotingRequest);
  const [distributionKeypair, ballotboxKeypair] =
    await createDistributionAndBallotAccount(issuer, createVotingRequest, voteToken);

  const voting: Voting = {
    id,
    title: createVotingRequest.title,
    description: createVotingRequest.description,
    options: createVotingRequest.options,
    issueAccountId: issuerKeypair.publicKey(),
    assetCode: voteToken.code,
    distributionAccountId: distributionKeypair.publicKey(),
    ballotBoxAccountId: ballotboxKeypair.publicKey(),
    authorization: createVotingRequest.authorization,
    visibility: createVotingRequest.visibility,
    votesCap: createVotingRequest.votesCap,
    encrypted: createVotingRequest.encrypted,
    startDate: createVotingRequest.startDate,
    endDate: createVotingRequest.endDate,
  };
  setVoting(voting);
  setKeychain(id, issuerKeypair, distributionKeypair, ballotboxKeypair);
  return { ...voting };
}

function createVoteToken(issuer: AccountResponse, createVotingRequest: CreateVotingRequest): Asset {
  // TODO make sure of uniqueness
  return new Asset(createVotingRequest.title.replace(' ', '').substr(0, 12))
}

async function createDistributionAndBallotAccount(
  issuer: AccountResponse,
  createVotingRequest: CreateVotingRequest,
  voteToken: Asset): Promise<[Keypair, Keypair]> {
  const distributionKeypair = Keypair.random();
  const ballotBoxKeypair = Keypair.random();
  const tx = new TransactionBuilder(issuer, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    // Create distribution account
    .addOperation(Operation.createAccount({
      destination: distributionKeypair.publicKey(),
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
    // Create ballot box
    .addOperation(Operation.createAccount({
      destination: ballotBoxKeypair.publicKey(),
      startingBalance: '2', // TODO calculate exactly
    }))
    .addOperation(
      Operation.changeTrust({
        source: ballotBoxKeypair.publicKey(),
        asset: voteToken,
        limit: `${createVotingRequest.votesCap / (10 ** 7)}`,
      }),
    )
    .setTimeout(30)
    .build();

  tx.sign(issuerKeypair);
  await server.submitTransaction(tx);
  return [distributionKeypair, ballotBoxKeypair];
}
