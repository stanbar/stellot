const StellarSdk = require('stellar-sdk')

// The source account is the account we will be signing and sending from.
const issuerSecretKey =
  'SB3IU2OST7MSXTYYQNFZDLBI6ZLQQLOOZFEDQCQHBMALAEGEDGTTKK7B'
// 'GBCKKOTXWVHRHTWWSKN53HD3BMVXZCOFJAINKHL7YGGTXCFDVD7FMJSH'
const issuerKeypair = StellarSdk.Keypair.fromSecret(issuerSecretKey)

const distributionSecretKey =
  'SBQ5HMAGX4CIQMIZ3IXOLQHLAEL5NLOWXMU4T2LTKMDLG4WU4IYDTHJN'
// 'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU'
const distributionKeypair = StellarSdk.Keypair.fromSecret(distributionSecretKey)

// Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
// To use the live network, set the hostname to 'horizon.stellar.org'
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

const voteToken = new StellarSdk.Asset(
  'Vote01122019',
  issuerKeypair.publicKey(),
)

async function createTrustlineDistributionToIssuingAccount() {
  const receiver = await server.loadAccount(distributionKeypair.publicKey())
  const transaction = new StellarSdk.TransactionBuilder(receiver, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: voteToken }))
    .setTimeout(60) // seconds
    .build()

  transaction.sign(distributionKeypair)
  const response = await server.submitTransaction(transaction)
  console.log(response)
}

async function giveTheDistributionAccountTheTokens(eligibleVotersCount) {
  const issuer = await server.loadAccount(issuerKeypair.publicKey())
  const transaction = new StellarSdk.TransactionBuilder(issuer, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: distributionKeypair.publicKey(),
        asset: voteToken,
        amount: `${eligibleVotersCount / 10 ** 7}`,
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(issuerKeypair)
  const response = await server.submitTransaction(transaction)
  console.log(response)
}

async function setHomeDomain(homeDomain) {
  const issuer = await server.loadAccount(issuerKeypair.publicKey())
  const transaction = new StellarSdk.TransactionBuilder(issuer, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.setOptions({ homeDomain }))
    .setTimeout(60) // seconds
    .build()

  transaction.sign(issuerKeypair)
  const response = await server.submitTransaction(transaction)
  console.log(response)
}

async function performFlow() {
  try {
    await createTrustlineDistributionToIssuingAccount()
    await giveTheDistributionAccountTheTokens(100)
    await setHomeDomain('voting.stasbar.com')
  } catch (e) {
    console.error(e)
  }
}

performFlow()
