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
  const payments = await stellar
    .payments()
    .limit(200) // TODO error-prone should not be hardcoded
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  const relevantPayments = payments.records.filter(
    payment => payment.type === 'payment',
  )

  for (let i = 0; i < relevantPayments.length; i += 1) {
    const transaction = await relevantPayments[i].transaction()
    if (transaction.memo === userId) {
      return true
    }
  }

  return false
}

async function isAlreadyCreatedAccount(accountId, userId) {
  log(`checking against accountId: ${accountId}`)
  const payments = await stellar
    .payments()
    .limit(200) // TODO error-prone should not be hardcoded
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  const relevantPayments = payments.records.filter(
    payment => payment.type === 'create_account',
  )

  for (let i = 0; i < relevantPayments.length; i += 1) {
    const transaction = await relevantPayments[i].transaction()
    if (transaction.memo === userId) {
      return true
    }
  }

  return false
}

async function createAccount(accountId, userId) {
  log({ createAccount: { accountId, userId } })
  const account = await stellar.loadAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: StellarSdk.Memo.text(userId),
  })
    .addOperation(
      StellarSdk.Operation.createAccount({
        destination: accountId,
        startingBalance: '1.5000200', // 1 XML for minimum acocunt balance 0.5 for trustline and 200 for two transactions fee: changeTrust and token payment
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(distributionKeypair)
  return stellar.submitTransaction(transaction)
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

async function signTransaction(userId, txn) {
  const transaction = new StellarSdk.Transaction(
    txn,
    StellarSdk.Networks.TESTNET,
  )
  transaction.sign(distributionKeypair)
  return transaction
}

app.post('/issueToken', async (req, res) => {
  const { accountId, userId } = req.body
  log(`accountId: ${accountId} userId: ${userId}`)
  if (!accountId || !userId) {
    return res.sendStatus(400).end()
  }
  const isAlreadyIssued = await isAlreadyIssuedToUserId(userId)
  if (isAlreadyIssued) {
    return res.sendStatus(405)
  }
  try {
    const result = await sendTokenFromDistributionToAddress(accountId, userId)
    log({ hash: result.hash })
    res.sendStatus(200).end()
  } catch (e) {
    log(e)
    res.sendStatus(500).end()
  }
})

app.post('/createAccount', async (req, res) => {
  const { accountId, userId } = req.body
  log(`accountId: ${accountId} userId: ${userId}`)
  if (!accountId || !userId) {
    return res.sendStatus(400).end()
  }
  const isAlreadyCreatedAccountForUser = await isAlreadyCreatedAccount(
    accountId,
    userId,
  )
  if (isAlreadyCreatedAccountForUser) {
    return res.sendStatus(405)
  }
  try {
    const result = await createAccount(accountId, userId)
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

app.post('/signTx', async (req, res) => {
  const { userId, txn } = req.body
  if (!userId || !txn) {
    return res.sendStatus(400).end()
  }
  try {
    const result = await signTransaction(userId, txn)
    log({ hash: result.hash })
    log({ XDR: result.toXDR() })
    return res.status(200).send(result.toXDR())
  } catch (e) {
    log(e)
    log(e.response.data)
    console.error({ result_codes: e.response.data.extras.result_codes })
    return res.sendStatus(500).end()
  }
})

module.exports = app
