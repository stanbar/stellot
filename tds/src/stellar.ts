import {
  Asset,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Server,
  TransactionBuilder,
} from 'stellar-sdk';

const server = new Server('https://horizon-testnet.stellar.org');

export async function createIssuerAccount(masterKeypair: Keypair, issuerKeypair: Keypair, tdsStartingBalance: number) {
  const masterAccount = await server.loadAccount(masterKeypair.publicKey());
  const tx = new TransactionBuilder(masterAccount, {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
  }).addOperation(Operation.createAccount({
    destination: issuerKeypair.publicKey(),
    startingBalance: `${10 + tdsStartingBalance}`,
  }))
    .setTimeout(30)
    .build();
  tx.sign(masterKeypair);
  await server.submitTransaction(tx);
}

export function createVoteToken(issuerPublicKey: string, title: string): Asset {
  return new Asset(
    title.replace(/[^0-9a-z]/gi, '').substr(0, 11),
    issuerPublicKey)
}

export async function createDistributionAndBallotAccount(
  issuerKeypair: Keypair,
  votesCap: number,
  voteToken: Asset,
  tdsStartingBalance: number): Promise<[Keypair, Keypair]> {
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
      startingBalance: `${tdsStartingBalance}`, // TODO calculate exactly
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
        limit: `${votesCap / (10 ** 7)}`,
      }),
    )
    // Send all vote tokens to distribution account
    .addOperation(
      Operation.payment({
        destination: distributionKeypair.publicKey(),
        asset: voteToken,
        amount: `${votesCap / (10 ** 7)}`,
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
        limit: `${votesCap / (10 ** 7)}`,
      }),
    )
    .setTimeout(30)
    .build();

  tx.sign(issuerKeypair, ballotBoxKeypair, distributionKeypair);
  await server.submitTransaction(tx);
  return [distributionKeypair, ballotBoxKeypair];
}