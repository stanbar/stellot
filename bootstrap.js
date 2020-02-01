const StellarSdk = require('stellar-sdk')
const request = require('request')

// The source account is the account we will be signing and sending from.
const issuerSecretKey = process.env.ISSUE_SECRET_KEY
// 'GBCKKOTXWVHRHTWWSKN53HD3BMVXZCOFJAINKHL7YGGTXCFDVD7FMJSH'
const issuerKeypair = StellarSdk.Keypair.fromSecret(issuerSecretKey)

const distributionSecretKey = process.env.DISTRIBUTION_SECRET_KEY
// 'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU'
const distributionKeypair = StellarSdk.Keypair.fromSecret(distributionSecretKey)

const parties = [
  {
    name: 'Konfederacja',
    accountId: 'GCEWJNP7W42FNGWGSMU75QRLULFNZJTYF7OI4SFRB5DSZTNJZ4XIS4CD',
    secretKey: 'SCBIQX44X5XPV7BMYOS2QHAJM4LTLHPSLM7DDBQVCBWDATN3CJMX6667',
  },
  {
    name: 'PO',
    accountId: 'GCLV566GMF6RX6RHO363ZV7BFZVI4P3HCEN4A6UJT7YYNG5RHWNJ7HVH',
    secretKey: 'SAI7VAFEYLF6PC2CDXEETCNB3POXV7XPU3PIPOL4QLM3OKM5FGWZVFTD',
  },
  {
    name: 'PiS',
    accountId: 'GCELKO5BJZGTGRKXDI6TKKF7CCYEKHCGLQJMDAANGMNL23RBGLBWGV74',
    secretKey: 'SAYV5PNWIFHRQF4IFDU5SFAWB3CQ43NXSKDLLINUYVH6KFIZQJ2U5UZT',
  },
  {
    name: 'SLD',
    accountId: 'GAS4Z3SY4KDMDBWCWVYAGDSTG47WJA6SSQIHDYIMR32K5X4WIRRYNWY5',
    secretKey: 'SDAMDKHTJPFLZ72VPCNO2YS4SFIHADYDJZPXL3XTXUJV5JOZORACRUWB',
  },
]

// Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
// To use the live network, set the hostname to 'horizon.stellar.org'
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

const voteToken = new StellarSdk.Asset(
  process.env.ASSET_NAME,
  issuerKeypair.publicKey(),
)

async function bootstrap(eligibleVotersCount, homeDomain) {
  const distribution = await server.loadAccount(distributionKeypair.publicKey())
  const issuer = await server.loadAccount(issuerKeypair.publicKey())
  const transaction = new StellarSdk.TransactionBuilder(issuer, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        source: distribution.accountId(),
        asset: voteToken,
        limit: '0.0000100',
      }),
    )
    .addOperation(
      StellarSdk.Operation.payment({
        destination: distributionKeypair.publicKey(),
        asset: voteToken,
        amount: `${eligibleVotersCount / 10 ** 7}`,
      }),
    )
    .addOperation(StellarSdk.Operation.setOptions({ homeDomain }))
    .addOperation(
      StellarSdk.Operation.setOptions({
        masterWeight: 0,
        lowThreshold: 1,
        medThreshold: 1,
        highThreshold: 1,
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(issuerKeypair)
  transaction.sign(distribution)
  const response = await server.submitTransaction(transaction)
  console.log(response)
}

async function fundAccount(party) {
  return request.get({
    url: 'https://horizon-testnet.stellar.org/friendbot',
    qs: { addr: party.accountId },
    json: true,
  })
}

async function createPartiesAccounts() {
  parties.forEach(fundAccount)
}

async function performFlow() {
  try {
    await createPartiesAccounts()
    await bootstrap(100, 'voting.stasbar.com')
  } catch (e) {
    console.error(e)
  }
}

performFlow()
