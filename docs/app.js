const sections = ['identify', 'trustline', 'issue', 'vote', 'results']
let currentSectionIndex = 0
const stellar = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const distributionAccountId =
  'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU'
const issuerAccountId =
  'GBCKKOTXWVHRHTWWSKN53HD3BMVXZCOFJAINKHL7YGGTXCFDVD7FMJSH'

const voteToken = new StellarSdk.Asset('Vote01122019', issuerAccountId)

async function fetchTrustlineInformation() {
  const accountId = $('#account-id').val()
  const userAccount = await stellar
    .accounts()
    .accountId(accountId)
    .call()

  const alreadyTrust =
    userAccount.balances.filter(
      balance =>
        balance.asset_code === voteToken.code &&
        balance.asset_issuer === voteToken.issuer,
    ).length > 0

  if (alreadyTrust) {
    $('#trust-status-trusted').removeClass('d-none')
    $('#trust-status-not-trusted').addClass('d-none')
  } else {
    $('#trust-status-trusted').addClass('d-none')
    $('#trust-status-not-trusted').removeClass('d-none')
  }
}

async function fetchVoteTokensBalance() {
  const accountId = $('#account-id').val()
  const userAccount = await stellar
    .accounts()
    .accountId(accountId)
    .call()

  const balance = userAccount.balances.find(
    balance =>
      balance.asset_code === voteToken.code &&
      balance.asset_issuer === voteToken.issuer,
  )

  if (balance) {
    const tokensRemaining = Math.round(balance.balance * 10 ** 7)
    $('#vote-tokens-balance').text(tokensRemaining)
  } else {
    $('#vote-tokens-balance').text(
      "You didn't created trustline to token issuer",
    )
  }
}

async function fetchDistributorTokensBalance() {
  const userAccount = await stellar
    .accounts()
    .accountId(distributionAccountId)
    .call()

  const balance = userAccount.balances.find(
    aBalance =>
      aBalance.asset_code === voteToken.code &&
      aBalance.asset_issuer === voteToken.issuer,
    // distribution account issued this token from issuer account so the
    // asset_issuer differ
  )

  if (balance) {
    const tokensRemaining = Math.round(balance.balance * 10 ** 7)
    $('#tokensRemaining').text(tokensRemaining)
  }
}

async function trustIssuer() {
  const secret = $('#secret').val()
  const keypair = StellarSdk.Keypair.fromSecret(secret)
  $('secret').text(null)
  const account = await stellar.loadAccount(keypair.publicKey())
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: voteToken,
        limit: '0.0000100',
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(keypair)
  $('#spinnerSending').removeClass('d-none')
  const response = await stellar.submitTransaction(transaction)
  $('#trustlineModal').modal('hide')
  $('#spinnerSending').addClass('d-none')
  fetchVoteTokensBalance()
}

async function issueToken() {
  const address = $('#account-id').val()
  const pesel = $('#pesel').val()
  const request = { address, pesel }
  try {
    $('#issueTokenSpinner').removeClass('d-none')
    $('#issueTokenButton').prop('disabled', true)
    const response = await fetch('/issueToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    fetchVoteTokensBalance()
    if (response.ok) {
      console.log('Successfully assigned vote token')
    } else {
      console.error('Failed to assign vote token')
    }
  } catch (e) {
    console.error(e)
  } finally {
    $('#issueTokenSpinner').addClass('d-none')
    $('#issueTokenButton').prop('disabled', false)
  }
}

function render() {
  $(`#${sections[currentSectionIndex]}`).show()

  sections
    .filter((_value, index) => index !== currentSectionIndex)
    .forEach(value => $(`#${value}`).hide())
}

$('.next').click(() => {
  currentSectionIndex = (currentSectionIndex + 1) % sections.length
  render()
})

$('.back').click(() => {
  currentSectionIndex =
    currentSectionIndex - 1 >= 0 ? currentSectionIndex - 1 : 0
  render()
})

render()

fetchDistributorTokensBalance()

$('#issueTokenButton').click(() => {
  issueToken()
})

$('#trustIssuerButton').click(() => {
  trustIssuer()
})

$('#issuerAccountId').text(issuerAccountId)

$('#nextIdentify').click(() => {
  fetchTrustlineInformation()
  fetchVoteTokensBalance()
})
