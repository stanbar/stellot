const StellarSdk = require('stellar-sdk')

// The source account is the account we will be signing and sending from.
const sourceSecretKey =
  'SDWSOQKFAMXWDP77Q23X6TWEQ6WLXCMUIM2UNVJNJ3BVJYBUHFZUXPGH'

// Derive Keypair object and public key (that starts with a G) from the secret
const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey)
// GANAAL35HXVN5L76CGRPNVUXINVEUSKYKIYYWBEQJTK6HVJFKRRGNQ2L
const sourcePublicKey = sourceKeypair.publicKey()
console.log(`sourcePublicKey: ${sourcePublicKey}`)

const receiverPrivateKey =
  'SC3RMKIAKBG5CZGWN4X3YVJJLCMNML6GTEW5VEFOVGH6FJKFLPWHSYZC'
const receiverKeypair = StellarSdk.Keypair.fromSecret(receiverPrivateKey)
// GCSH7X57NVIYS4UX2MQKHZNS67523ACG7BBUPGQPWRRGNERACBYNTJLA

// Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
// To use the live network, set the hostname to 'horizon.stellar.org'
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

const astroDolar = new StellarSdk.Asset('AstroDolar', sourcePublicKey)

async function trustTheAsset() {
  try {
    const receiver = await server.loadAccount(receiverKeypair.publicKey())
    const transaction = new StellarSdk.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: astroDolar }))
      .setTimeout(100)
      .build()

    transaction.sign(receiverKeypair)
    const response = await server.submitTransaction(transaction)
    console.log(response)
  } catch (e) {
    console.error(e)
  }
}

async function sendAssets() {
  try {
    const issuer = server.loadAccount(sourceKeypair)
    const transaction = new StellarSdk.TransactionBuilder(issuer, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: receiverKeypair.publicKey(),
          asset: astroDolar,
          amount: '0.0000001',
        }),
      )
      .setTimeout(100)
      .build()

    transaction.sign(sourceKeypair)
    await server.submitTransaction(transaction)
  } catch (e) {
    console.error(e)
  }
}

async function performFlow() {
  await trustTheAsset()
  await sendAssets()
}

performFlow()
