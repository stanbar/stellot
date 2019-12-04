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
  try {
    const { address, pesel } = req.body
    log(`address: ${address} pesel: ${pesel}`)
    if (!address || !pesel) {
      res.sendStatus(400).end()
    } else {
      ensureEligableForVote(address, pesel)
      await sendTokenFromDistributionToAddress(address, pesel)
      res.sendStatus(200).end()
    }
  } catch (e) {
    log(e)
    res.sendStatus(500).end()
  }
})

const database = {
  admin: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
}

let lastKey

app.get('/generateKey', async (req, res) => {
  const buf = crypto.randomBytes(32)
  const key = buf.toString('hex')
  log(`generated key: ${key}`)
  lastKey = key
  res.send({ key })
})

app.post('/login', async (req, res) => {
  const { login, password } = req.body

  const calculatedHash = crypto
    .createHash('sha256')
    .update(database[login] + lastKey)
    .digest('hex')

  log(`calculated hash: ${calculatedHash}`)

  if (calculatedHash === password) {
    res.sendStatus(200)
  } else {
    res.sendStatus(401)
  }
})

module.exports = app
