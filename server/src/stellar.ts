import StellarSdk from 'stellar-sdk'

const stellar = new StellarSdk.Server('https://horizon-testnet.stellar.org')

export const distributionKeypair = StellarSdk.Keypair.fromSecret(
  process.env.DISTRIBUTION_SECRET_KEY,
)

export const voteToken = new StellarSdk.Asset(
  process.env.ASSET_NAME,
  process.env.ISSUE_PUBLIC_KEY,
)

export function signTransaction(txn) {
  const transaction = new StellarSdk.Transaction(
    txn,
    StellarSdk.Networks.TESTNET,
  )
  transaction.sign(distributionKeypair)
  return transaction
}

export async function isAlreadyIssuedToUserId(userId) {
  const transactions = await stellar
    .transactions()
    .limit(200) // TODO should not be hardcoded
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  const relevantTransactions = transactions.records.filter(
    txn =>
      txn.memo_type === 'text' &&
      txn.source_account === process.env.DISTRIBUTION_PUBLIC_KEY,
  )
  return relevantTransactions.some(txn => txn.memo === userId)
}

export async function sendTokenFromDistributionToAddress(accountId, userId) {
  log({ sendTokenFromDistributionToAddress: { accountId, userId } })
  const account = await stellar.loadAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: StellarSdk.Memo.text(userId),
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: accountId,
        asset: voteToken,
        amount: `${1 / 10 ** 7}`,
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(distributionKeypair)
  return stellar.submitTransaction(transaction)
}


