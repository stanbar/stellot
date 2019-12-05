const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const StellarSdk = require('stellar-sdk')
const log = require('debug')('server:app')

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

async function isAlreadyIssuedToPesel(pesel) {
  log(`checking against pesel: ${pesel}`)
  const transactions = await stellar
    .transactions()
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()
  const relevantTransactions = transactions.records.filter(
    transaction => transaction.memo_type === 'text',
  )
  relevantTransactions.forEach(transaction => {
    log({ pesel: transaction.memo })
  })
  const isAlreadyIssued = relevantTransactions.some(txn => txn.memo === pesel)
  log(`isAlreadyIssued to pesel: ${isAlreadyIssued}`)
  return isAlreadyIssued
}

async function isAlreadyIssuedToAddress(address) {
  log(`checking against address: ${address}`)
  const payments = await stellar
    .payments()
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  const relevantPayments = payments.records.filter(
    payment =>
      payment.type === 'payment' &&
      payment.asset_code === process.env.ASSET_NAME,
  )
  relevantPayments.forEach(payment => {
    log({
      id: payment.id,
      to: payment.to,
      from: payment.from,
      amount: payment.amount,
    })
  })
  const isAlreadyIssued = relevantPayments.some(
    payment => payment.to === address,
  )
  log(`isAlreadyIssued to account: ${isAlreadyIssued}`)
  return isAlreadyIssued
}

async function isNotIssued(address, pesel) {
  const issuedToAddress = await isAlreadyIssuedToAddress(address)
  const issuedToPesel = await isAlreadyIssuedToPesel(pesel)
  log(`DEBUG isNotIssued ${!issuedToAddress && !issuedToPesel}`)
  return true //TODO For debug purposes only !!!
}

async function sendTokenFromDistributionToAddress(address, pesel) {
  log(`sending token to ${address} pesel: ${pesel}`)
  const account = await stellar.loadAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: new StellarSdk.Memo(StellarSdk.MemoText, pesel),
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
  const { address, pesel } = req.body
  log(`address: ${address} pesel: ${pesel}`)
  if (!address || !pesel) {
    return res.sendStatus(400).end()
  }
  const isEligableForVote = await isNotIssued(address, pesel)
  if (!isEligableForVote) {
    res.sendStatus(405)
  } else {
    try {
      await sendTokenFromDistributionToAddress(address, pesel)
      res.sendStatus(200).end()
    } catch (e) {
      log(e)
      res.sendStatus(500).end()
    }
  }
})

module.exports = app
