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
import { setKeychain, setVoting } from './database/database';

const server = new Server('https://horizon-testnet.stellar.org');
if (!process.env.MASTER_SECRET_KEY) {
  throw new Error('MASTER_SECRET_KEY must be provided in env variable')
}
const masterSecretKey = process.env.MASTER_SECRET_KEY;
const masterKeypair = Keypair.fromSecret(masterSecretKey);

export async function createVoting(createVotingRequest: CreateVotingRequest)
  : Promise<CreateVotingResponse> {
  const masterAccount = await server.loadAccount(masterKeypair.publicKey());
  const issuerKeypair = Keypair.random();
  await createIssuerAccount(masterAccount, issuerKeypair);
  const voteToken = createVoteToken(issuerKeypair, createVotingRequest);
  const [distributionKeypair, ballotBoxKeypair] =
    await createDistributionAndBallotAccount(
      issuerKeypair,
      createVotingRequest,
      voteToken);
  const voting: Omit<Voting, 'id'> = {
    slug: '',
    title: createVotingRequest.title,
    polls: createVotingRequest.polls,
    issueAccountId: issuerKeypair.publicKey(),
    assetCode: voteToken.code,
    distributionAccountId: distributionKeypair.publicKey(),
    ballotBoxAccountId: ballotBoxKeypair.publicKey(),
    authorization: createVotingRequest.authorization,
    visibility: createVotingRequest.visibility,
    votesCap: createVotingRequest.votesCap,
    encrypted: createVotingRequest.encrypted,
    startDate: createVotingRequest.startDate,
    endDate: createVotingRequest.endDate,
  };
  const savedVoting = await setVoting(voting);
  await setKeychain(savedVoting.id, issuerKeypair, distributionKeypair, ballotBoxKeypair);
  return { ...savedVoting };
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
    createVotingRequest.title.replace(' ', '').substr(0, 12),
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
