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
  distributionKeypair.publicKey(),
)

async function ensureNotIssued(address, pesel) {
  const payments = await stellar
    .payments()
    .forAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
    .call()

  payments.records.forEach(payment => {
    log({
      id: payment.id,
    })
  })
}

async function ensureEligableForVote(address, pesel) {
  ensureNotIssued(address, pesel)
}

async function sendTokenFromDistributionToAddress(address, pesel) {
  const account = await stellar.loadAccount(process.env.DISTRIBUTION_PUBLIC_KEY)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: pesel,
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
    res.sendStatus(400).end()
  } else {
    ensureEligableForVote(address, pesel)
    await sendTokenFromDistributionToAddress(address, pesel)
    res.sendStatus(200).end()
  }
})

module.exports = app
