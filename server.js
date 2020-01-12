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
  'Vote01122019',
  process.env.ISSUE_PUBLIC_KEY,
)

async function isAlreadyIssuedToUserId(userId) {
  log(`checking against userId: ${userId}`)
  const transactions = await stellar
    .transactions()
    .limit(200) // TODO error-prone should not be hardcoded
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  const relevantTransactions = transactions.records.filter(
    transaction => transaction.memo_type === 'text',
  )
  const isAlreadyIssued = relevantTransactions.some(txn => txn.memo === userId)
  log(`isAlreadyIssued to userId: ${isAlreadyIssued}`)
  return isAlreadyIssued
}

async function isAlreadyIssuedToAccountId(address) {
  log(`checking against accountId: ${address}`)
  const payments = await stellar
    .payments()
    .limit(200) // TODO error-prone should not be hardcoded
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  const relevantPayments = payments.records.filter(
    payment =>
      payment.type === 'payment' &&
      payment.asset_code === process.env.ASSET_NAME,
  )
  const isAlreadyIssued = relevantPayments.some(
    payment => payment.to === address,
  )
  log(`isAlreadyIssued to accountId: ${isAlreadyIssued}`)
  return isAlreadyIssued
}

async function isNotIssued(address, userId) {
  const issuedToAddress = await isAlreadyIssuedToAccountId(address)
  const issuedToUserId = await isAlreadyIssuedToUserId(userId)
  log(`DEBUG isNotIssued ${!issuedToAddress && !issuedToUserId}`)
  return !issuedToAddress && !issuedToUserId
}

async function createAccount(address, userId) {
  log({ createAccount: { address, userId } })
  const account = await stellar.loadAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: StellarSdk.Memo.text(userId),
  })
    .addOperation(
      StellarSdk.Operation.createAccount({
        destination: address,
        startingBalance: '1.5000200', // 1 XML for minimum acocunt balance 0.5 for trustline and 200 for two transactions fee: changeTrust and token payment
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(distributionKeypair)
  return stellar.submitTransaction(transaction)
}

async function sendTokenFromDistributionToAddress(address, userId) {
  log({ sendTokenFromDistributionToAddress: { address, userId } })
  const account = await stellar.loadAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: StellarSdk.Memo.text(userId),
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: address,
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
  const { address, userId } = req.body
  log(`address: ${address} userId: ${userId}`)
  if (!address || !userId) {
    return res.sendStatus(400).end()
  }
  const isEligableForVote = await isNotIssued(address, userId)
  // TODO Distinquish checking for issue token from create account
  if (!isEligableForVote) {
    return res.sendStatus(405)
  }
  try {
    const result = await sendTokenFromDistributionToAddress(address, userId)
    log({ hash: result.hash })
    res.sendStatus(200).end()
  } catch (e) {
    log(e)
    res.sendStatus(500).end()
  }
})

app.post('/createAccount', async (req, res) => {
  const { address, userId } = req.body
  log(`address: ${address} userId: ${userId}`)
  if (!address || !userId) {
    return res.sendStatus(400).end()
  }
  const isEligableForVote = await isNotIssued(address, userId)
  // TODO Distinquish checking for issue token from create account
  if (!isEligableForVote) {
    return res.sendStatus(405)
  }
  try {
    const result = await createAccount(address, userId)
    log({ hash: result.hash })
    return res.sendStatus(200).end()
  } catch (e) {
    log(e)
    log(e.response.data)
    console.error({ result_codes: e.response.data.extras.result_codes })
    return res.sendStatus(500).end()
  }
})

app.post('/login', (req, res) => {
  const { login, password } = req.body
  if (!login || !password) {
    return res.sendStatus(400).end()
  }
  return res
    .json({
      userId: crypto
        .createHash('sha256')
        .update(login + password)
        .digest('hex')
        .substring(0, 16),
    })
    .end()
})

module.exports = app
