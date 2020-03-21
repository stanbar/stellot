const StellarSdk = require('stellar-sdk')

// The source account is the account we will be signing and sending from.
const sourceSecretKey =
  'SDWSOQKFAMXWDP77Q23X6TWEQ6WLXCMUIM2UNVJNJ3BVJYBUHFZUXPGH'

// Derive Keypair object and public key (that starts with a G) from the secret
const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey)
// GANAAL35HXVN5L76CGRPNVUXINVEUSKYKIYYWBEQJTK6HVJFKRRGNQ2L
const sourcePublicKey = sourceKeypair.publicKey()
console.log(`sourcePublicKey: ${sourcePublicKey}`)

const receiverPublicKey =
  'GCSH7X57NVIYS4UX2MQKHZNS67523ACG7BBUPGQPWRRGNERACBYNTJLA'
const reveiverPrivateKey =
  'SC3RMKIAKBG5CZGWN4X3YVJJLCMNML6GTEW5VEFOVGH6FJKFLPWHSYZC'

// Configure StellarSdk to talk to the horizon instance hosted by Stellar.org
// To use the live network, set the hostname to 'horizon.stellar.org'
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

async function sendTransaction() {
  // Transactions require a valid sequence number that is specific to this account.
  // We can fetch the current sequence number for the source account from Horizon.
  const account = await server.loadAccount(sourcePublicKey)

  // Right now, there's one function that fetches the base fee.
  // In the future, we'll have functions that are smarter about suggesting fees,
  // e.g.: `fetchCheapFee`, `fetchAverageFee`, `fetchPriorityFee`, etc.
  const fee = await server.fetchBaseFee()
  console.log(`fee ${fee}`)

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee,
    // Uncomment the following line to build transactions for the live network. Be
    // sure to also change the horizon hostname.
    // networkPassphrase: StellarSdk.Networks.OPEN,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    // Add a payment operation to the transaction
    .addOperation(
      StellarSdk.Operation.payment({
        destination: receiverPublicKey,
        // The term native asset refers to lumens
        asset: StellarSdk.Asset.native(),
        // Specify 350.1234567 lumens. Lumens are divisible to seven digits past
        // the decimal. They are represented in JS Stellar SDK in string format
        // A
        // to avoid errors from the use of the JavaScript Number data structure.
        amount: '22',
      }),
    )
    // Make this transaction valid for the next 30 seconds only
    .setTimeout(30)
    // Uncomment to add a memo (https://www.stellar.org/developers/learn/concepts/transactions.html)
    .addMemo(StellarSdk.Memo.text('Hello world!'))
    .build()

  // Sign this transaction with the secret key
  // NOTE: signing is transaction is network specific. Test network transactions
  // won't work in the public network. To switch networks, use the Network object
  // as explained above (look for StellarSdk.Network).
  transaction.sign(sourceKeypair)

  // Let's see the XDR (encoded in base64) of the transaction we just built
  console.log(transaction.toEnvelope().toXDR('base64'))

  // Submit the transaction to the Horizon server. The Horizon server will then
  // submit the transaction into the network for us.
  try {
    const transactionResult = await server.submitTransaction(transaction)
    console.log(JSON.stringify(transactionResult, null, 2))
    console.log('\nSuccess! View the transaction at: ')
    console.log(transactionResult._links.transaction.href)
  } catch (e) {
    console.log('An error has occured:')
    console.log(e.message)
  }
}

async function listTransactions() {
  try {
    const page = await server
      .transactions()
      .forAccount(sourcePublicKey)
      .call()
    console.log('\nSuccess!')
    console.log(page.records)
  } catch (e) {
    console.error('An error has occured:')
    console.error(e.message)
  }
}

sendTransaction()
