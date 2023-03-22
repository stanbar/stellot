import { Asset, Keypair, Operation, Server, TransactionBuilder } from 'stellar-sdk';
import { chunk } from 'lodash';
import fetch from 'node-fetch';

const { HORIZON_SERVER_URL, NODE_ENV, NETWORK_PASSPHRASE } = process.env;

if (!HORIZON_SERVER_URL) {
  throw new Error("HORIZON_SERVER_URL must be defined")
} else {
  console.log(`using HORIZON_SERVER_URL=${HORIZON_SERVER_URL}`)
}
if (!NETWORK_PASSPHRASE) {
  throw new Error("NETWORK_PASSPHRASE must be defined")
} else {
  console.log(`using NETWORK_PASSPHRASE=${NETWORK_PASSPHRASE}`)
}


const server = new Server(HORIZON_SERVER_URL);

async function defaultOptions(): Promise<TransactionBuilder.TransactionBuilderOptions> {
  return {
    networkPassphrase: NETWORK_PASSPHRASE,
    fee: `${(await server.fetchBaseFee()) * 3}`,
    timebounds: { minTime: 0, maxTime: 0 }
  };
}
export async function createIssuerAccount(
  masterKeypair: Keypair,
  issuerKeypair: Keypair,
  issuerStartingBalance: number,
) {
  if (NODE_ENV === 'production') {
    console.log("Creating issuer account via master account")
    const masterAccount = await server.loadAccount(masterKeypair.publicKey());
    console.log("Loaded master account")
    const tx = new TransactionBuilder(masterAccount, await defaultOptions())
      .addOperation(
        Operation.createAccount({
          destination: issuerKeypair.publicKey(),
          startingBalance: `${10 + issuerStartingBalance}`,
        }),
      )
      .build();
    tx.sign(masterKeypair);
    return server.submitTransaction(tx);
  } else {
    console.log("Creating issuer account via friendly bot")
    return fundWithFriendlyBot(issuerKeypair.publicKey());
  }
}

export async function fundWithFriendlyBot(issuerPublicKey: string) {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(issuerPublicKey)}`,
  );
  const responseJSON = await response.json();
  console.log('SUCCESS Funding account with friendbot! \n', responseJSON);
}

export function createVoteToken(issuerPublicKey: string, title: string): Asset {
  return new Asset(title.replace(/[^0-9a-z]/gi, '').substr(0, 11), issuerPublicKey);
}

export async function createDistributionAndBallotAccount(
  issuerKeypair: Keypair,
  votesCap: number,
  voteToken: Asset,
  tdsStartingBalance: number,
): Promise<[Keypair, Keypair]> {
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
  const distributionKeypair = Keypair.random();
  const ballotBoxKeypair = Keypair.random();

  const tx = new TransactionBuilder(issuerAccount, await defaultOptions())
    // Create distribution account
    .addOperation(
      Operation.createAccount({
        destination: distributionKeypair.publicKey(),
        startingBalance: `${tdsStartingBalance}`, // TODO calculate exactly
      }),
    )
    // Create ballot box
    .addOperation(
      Operation.createAccount({
        destination: ballotBoxKeypair.publicKey(),
        startingBalance: '2', // TODO calculate exactly
      }),
    )
    .addOperation(
      Operation.changeTrust({
        source: distributionKeypair.publicKey(),
        asset: voteToken,
        limit: `${votesCap / 10 ** 7}`,
      }),
    )
    // Send all vote tokens to distribution account
    .addOperation(
      Operation.payment({
        destination: distributionKeypair.publicKey(),
        asset: voteToken,
        amount: `${votesCap / 10 ** 7}`,
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
        limit: `${votesCap / 10 ** 7}`,
      }),
    )
    .build();

  tx.sign(issuerKeypair, ballotBoxKeypair, distributionKeypair);
  await server.submitTransaction(tx);
  return [distributionKeypair, ballotBoxKeypair];
}

export async function createChannelAccounts(
  channelCount: number,
  issuerKeypair: Keypair,
): Promise<Keypair[]> {
  console.log(`creating ${channelCount} channel accounts using issuer ${issuerKeypair.publicKey()}`)
  const channels = Array.from(Array(channelCount).keys()).map(() => Keypair.random());

  for (const chunkedChannels of chunk(channels, 50)) {
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    console.log("loaded issuer account", issuerAccount)

    // Stellar allows up to 100 ops per transaction
    const builder = new TransactionBuilder(issuerAccount, await defaultOptions());
    chunkedChannels.forEach(channel => {
      builder.addOperation(
        Operation.createAccount({
          destination: channel.publicKey(),
          // Minimum Balance = (2 + # of entries) * base reserve (0.5)
          // Fee for 3 operations (payment, marge)
          startingBalance: '2',
        }),
      );
    });
    const tx = builder.build();

    tx.sign(issuerKeypair);
    const response = await server.submitTransaction(tx);
    console.log('submited channel tx', response);
  }
  return channels;
}

export async function createBallotIssuingTransaction(
  channelSecret: string,
  distributionKeypair: Keypair,
  voterPublicKey: string,
  votingToken: Asset,
  votesCap: number,
) {
  const channelKeypair = Keypair.fromSecret(channelSecret);
  const channelAccount = await server.loadAccount(channelKeypair.publicKey());
  console.log("loaded channel account", channelKeypair.publicKey());

  // For better scalability it should go through channel account
  const tx = new TransactionBuilder(channelAccount, await defaultOptions())
    .addOperation(
      Operation.createAccount({
        source: distributionKeypair.publicKey(),
        destination: voterPublicKey,
        // Minimum Balance = (2 + # of entries (1 for the voteToken)) * base reserve (0.5)
        // Fee for 3 operations (payment, marge)
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
    .build();

  tx.sign(channelKeypair, distributionKeypair);
  return tx;
}
