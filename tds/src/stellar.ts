import {
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';
import { chunk } from 'lodash';

const server = new Server('https://horizon-testnet.stellar.org');
const DEFAULT_OPTIONS = { fee: "200", networkPassphrase: Networks.TESTNET };

export async function createIssuerAccount(
  masterKeypair: Keypair,
  issuerKeypair: Keypair,
  tdsStartingBalance: number,
) {
  const masterAccount = await server.loadAccount(masterKeypair.publicKey());
  const tx = new TransactionBuilder(masterAccount, DEFAULT_OPTIONS)
    .addOperation(
      Operation.createAccount({
        destination: issuerKeypair.publicKey(),
        startingBalance: `${10 + tdsStartingBalance}`,
      }),
    )
    .setTimeout(30)
    .build();
  tx.sign(masterKeypair);
  await server.submitTransaction(tx);
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

  const tx = new TransactionBuilder(issuerAccount, DEFAULT_OPTIONS)
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
    .setTimeout(30)
    .build();

  tx.sign(issuerKeypair, ballotBoxKeypair, distributionKeypair);
  await server.submitTransaction(tx);
  return [distributionKeypair, ballotBoxKeypair];
}

export async function createChannelAccounts(
  channelCount: number,
  issuerKeypair: Keypair,
): Promise<Keypair[]> {
  const channels = Array.from(Array(channelCount).keys()).map(() => Keypair.random());

  for (const chunkedChannels of chunk(channels, 50)) {
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

    // Stellar allows up to 100 ops per transaction
    const builder = new TransactionBuilder(issuerAccount, DEFAULT_OPTIONS);
    chunkedChannels.forEach(channel => {
      builder.addOperation(
        Operation.createAccount({
          destination: channel.publicKey(),
          startingBalance: '2',
        }),
      );
    });
    builder.setTimeout(20);
    const tx = builder.build();

    tx.sign(issuerKeypair);
    console.log({ chunkedChannels });
    await server.submitTransaction(tx);
    console.log("submited channel tx")
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

  // For better scalability it should go through channel account
  const tx = new TransactionBuilder(channelAccount, DEFAULT_OPTIONS)
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

  tx.sign(channelKeypair, distributionKeypair);
  return tx;
}
