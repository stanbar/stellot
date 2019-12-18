/* global $ */
/* global StellarSdk */
/* global fetch */
const sections = ['identify', 'trustline', 'issue', 'vote', 'results']
let currentSectionIndex = 0
const stellar = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const distributionAccountId =
  'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU'
const issuerAccountId =
  'GBCKKOTXWVHRHTWWSKN53HD3BMVXZCOFJAINKHL7YGGTXCFDVD7FMJSH'

const voteToken = new StellarSdk.Asset('Vote01122019', issuerAccountId)

const parties = [
  {
    name: 'Konfederacja',
    accountId: 'GCEWJNP7W42FNGWGSMU75QRLULFNZJTYF7OI4SFRB5DSZTNJZ4XIS4CD',
    secretKey: 'SCBIQX44X5XPV7BMYOS2QHAJM4LTLHPSLM7DDBQVCBWDATN3CJMX6667',
  },
  {
    name: 'PO',
    accountId: 'GCLV566GMF6RX6RHO363ZV7BFZVI4P3HCEN4A6UJT7YYNG5RHWNJ7HVH',
    secretKey: 'SAI7VAFEYLF6PC2CDXEETCNB3POXV7XPU3PIPOL4QLM3OKM5FGWZVFTD',
  },
  {
    name: 'PiS',
    accountId: 'GCELKO5BJZGTGRKXDI6TKKF7CCYEKHCGLQJMDAANGMNL23RBGLBWGV74',
    secretKey: 'SAYV5PNWIFHRQF4IFDU5SFAWB3CQ43NXSKDLLINUYVH6KFIZQJ2U5UZT',
  },
  {
    name: 'SLD',
    accountId: 'GAS4Z3SY4KDMDBWCWVYAGDSTG47WJA6SSQIHDYIMR32K5X4WIRRYNWY5',
    secretKey: 'SDAMDKHTJPFLZ72VPCNO2YS4SFIHADYDJZPXL3XTXUJV5JOZORACRUWB',
  },
]

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

async function fetchAccountTokenBalance(accountId) {
  const userAccount = await stellar
    .accounts()
    .accountId(accountId)
    .call()

  const balance = userAccount.balances.find(
    aBalance =>
      aBalance.asset_code === voteToken.code &&
      aBalance.asset_issuer === voteToken.issuer,
    // distribution account issued this token from issuer account so the
    // asset_issuer differ
  )

  return balance
}

async function fetchVoteTokensBalance() {
  const accountId = $('#account-id').val()
  const balance = fetchAccountTokenBalance(accountId)

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
  const balance = fetchAccountTokenBalance(distributionAccountId)

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

let selectedParty = undefined

async function createPartiesList() {
  const partiesWithVotes = await Promise.all(
    parties.map(async party => {
      return {
        ...party,
        votes: await fetchAccountTokenBalance(party.accountId),
      }
    }),
  )

  const list = $('#party-list')
  partiesWithVotes.map(party => {
    const li = $('<li/>')
      .addClass(
        'list-group-item list-group-item-action d-flex justify-content-between align-items-center',
      )
      .text(party.name)
      .click(() => {
        selectedParty = party
        $('#party-list > li').removeClass('active')
        li.addClass('active')
      })
      .appendTo(list)

    $('<span/>')
      .addClass('badge badge-primary badge-pill')
      .text(party.votes || 0)
      .appendTo(li)

    return li
  })
}

async function voteOnParty() {
  console.log(`vote on party ${selectedParty.name}`)
  // TODO create transaction and allow user to sign and send it
}

function render() {
  $(`#${sections[currentSectionIndex]}`).show()

  sections
    .filter((_value, index) => index !== currentSectionIndex)
    .forEach(value => $(`#${value}`).hide())
}

render()
fetchDistributorTokensBalance()
createPartiesList()

$('.next').click(() => {
  currentSectionIndex = (currentSectionIndex + 1) % sections.length
  render()
})

$('.back').click(() => {
  currentSectionIndex =
    currentSectionIndex - 1 >= 0 ? currentSectionIndex - 1 : 0
  render()
})

$('#issueTokenButton').click(() => {
  issueToken()
})

$('#voteOnParty').click(() => {
  voteOnParty()
})

$('#trustIssuerButton').click(() => {
  trustIssuer()
})

$('#issuerAccountId').text(issuerAccountId)

$('#nextIdentify').click(() => {
  fetchTrustlineInformation()
  fetchVoteTokensBalance()
})
