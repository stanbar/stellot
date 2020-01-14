const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const StellarSdk = require('stellar-sdk')
const log = require('debug')('server:app')
const crypto = require('crypto')

const stellar = new StellarSdk.Server('https://horizon-testnet.stellar.org')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'docs')))

const distributionKeypair = StellarSdk.Keypair.fromSecret(
  process.env.DISTRIBUTION_SECRET_KEY,
)

const voteToken = new StellarSdk.Asset(
  process.env.ASSET_NAME,
  process.env.ISSUE_PUBLIC_KEY,
)

function validateVoteOp(transaction) {
  const expectedVote = transaction.operations[3]
  if (expectedVote.type !== 'payment') {
    throw new Error(
      `operation[3] type is ${expectedVote.type} but should be payment`,
    )
  }
  if (expectedVote.asset.code !== voteToken.code) {
    throw new Error(
      `operation[3] code is ${expectedVote.asset.code} but should be ${voteToken.code}`,
    )
  }
  if (expectedVote.asset.issuer !== voteToken.issuer) {
    throw new Error(
      `operation[3] issuer is ${expectedVote.asset.issuer} but should be ${voteToken.code}`,
    )
  }
  if (expectedVote.amount !== '0.0000001') {
    throw new Error(
      `operation[3] amount is ${expectedVote.amount} but should be 0.0000001`,
    )
  }
}

function validateIssueTokenOp(transaction) {
  const expectedIssueToken = transaction.operations[2]
  if (expectedIssueToken.type !== 'payment') {
    throw new Error(
      `operation[2] type is ${expectedIssueToken.type} but should be payment`,
    )
  }
  if (expectedIssueToken.asset.issuer !== voteToken.issuer) {
    throw new Error(
      `operation[1] issuer is ${expectedIssueToken.asset.issuer} but should be ${voteToken.issuer}`,
    )
  }
  if (expectedIssueToken.asset.code !== voteToken.code) {
    throw new Error(
      `operation[1] code is ${expectedIssueToken.asset.code} but should be ${voteToken.code}`,
    )
  }
  if (expectedIssueToken.amount !== '0.0000001') {
    throw new Error(
      `operation[2] amount is ${expectedIssueToken.amount} but should be 0.0000001`,
    )
  }
}
function validateChangeTrustOp(transaction) {
  const expectedChangeTrust = transaction.operations[1]
  if (expectedChangeTrust.type !== 'changeTrust') {
    throw new Error(
      `operation[1] type is ${expectedChangeTrust.type} but should be changeTrust`,
    )
  }
  if (expectedChangeTrust.line.issuer !== voteToken.issuer) {
    throw new Error(
      `operation[1] issuer is ${expectedChangeTrust.line.issuer} but should be ${voteToken.issuer}`,
    )
  }
  if (expectedChangeTrust.line.code !== voteToken.code) {
    throw new Error(
      `operation[1] line code is ${expectedChangeTrust.line.code} but should be ${voteToken.code}`,
    )
  }
}
function validateCreateAccountOp(transaction) {
  const expectedCreateAccount = transaction.operations[0]
  if (expectedCreateAccount.type !== 'createAccount') {
    throw new Error(
      `operation[0] type is ${expectedCreateAccount.type} but should be createAccount`,
    )
  }
  if (expectedCreateAccount.startingBalance !== '1.5000200') {
    // 1 XML for minimum acocunt balance
    // 0.5 for trustline and
    // 200 for two transactions fee
    throw new Error(
      `operation[0] startingBalance is ${expectedCreateAccount.startingBalance} but should be  1.5000200`,
    )
  }
}
function validateTransaction(txn, userId) {
  const transaction = new StellarSdk.Transaction(
    txn,
    StellarSdk.Networks.TESTNET,
  )

  if (transaction.memo.type !== 'text') {
    throw new Error(
      `transaction.memo.type: ${transaction.memo.type} doesn't equal text`,
    )
  }
  if (String(transaction.memo.value) !== userId) {
    throw new Error(
      `transaction.memo: ${String(
        transaction.memo.value,
      )} doesn't equal userId: ${userId}`,
    )
  }
  if (transaction.operations.length !== 4) {
    throw new Error(
      `transaction.operations.length: ${transaction.operations.length} doesnt equal 4`,
    )
  }
  validateCreateAccountOp(transaction)
  validateChangeTrustOp(transaction)
  validateIssueTokenOp(transaction)
  validateVoteOp(transaction)
}

function signTransaction(txn) {
  const transaction = new StellarSdk.Transaction(
    txn,
    StellarSdk.Networks.TESTNET,
  )
  transaction.sign(distributionKeypair)
  return transaction
}

async function isAlreadyIssuedToUserId(userId) {
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

async function sendTokenFromDistributionToAddress(accountId, userId) {
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

app.post('/issueToken', async (req, res) => {
  const { accountId, userId } = req.body
  log(`accountId: ${accountId} userId: ${userId}`)
  if (!accountId || !userId) {
    return res.sendStatus(400).end()
  }
  const isAlreadyIssued = await isAlreadyIssuedToUserId(userId)
  if (isAlreadyIssued) {
    return res.status(405).send('Token already issued')
  }
  try {
    const result = await sendTokenFromDistributionToAddress(accountId, userId)
    log({ hash: result.hash })
    return res.sendStatus(200).end()
  } catch (e) {
    log(e)
    return res.sendStatus(500).end()
  }
})

app.post('/signTx', async (req, res) => {
  const { txn, userId } = req.body
  if (!txn) {
    log('txn must be provided')
    return res.status(400).send('txn must be provided')
  }
  if (!userId) {
    log('userId must be provided')
    return res.status(400).send('userId must be provided')
  }
  try {
    validateTransaction(txn, userId)
  } catch (e) {
    log(e)
    return res.status(400).send(e.message)
  }
  const isAlreadyIssued = await isAlreadyIssuedToUserId(userId)
  if (isAlreadyIssued) {
    log('isAlreadyIssued')
    return res.status(405).send('Token already issued')
  }
  try {
    const transaction = signTransaction(txn)
    const result = await stellar.submitTransaction(transaction)
    log({ hash: result.hash })
    return res.status(200).send(transaction.toXDR())
  } catch (e) {
    log(e)
    log(e.response.data)
    log({ result_codes: e.response.data.extras.result_codes })
    return res.sendStatus(500).end()
  }
})

// Mock of Authorization Provider
app.post('/login', (req, res) => {
  const { login, password } = req.body
  if (!login || !password) {
    return res.sendStatus(400).end()
  }
  return res
    .json({
      userId: crypto
        .createHmac('sha256', process.env.ISSUE_SECRET_KEY)
        .update(login)
        .digest('hex')
        .substring(0, 16),
    })
    .end()
})

module.exports = app
