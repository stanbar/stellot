/* global $ */
/* global StellarSdk */
/* global fetch */
/* global d3 */
const sections = {
  manual: [
    'identify',
    'enterStellarAddress',
    'trustline',
    'issue',
    'vote',
    'results',
  ],
  simple: ['identify', 'vote', 'results'],
}
let mode
let currentSectionIndex = 0
const stellar = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const distributionAccountId =
  'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU'
const issuerAccountId =
  'GBCKKOTXWVHRHTWWSKN53HD3BMVXZCOFJAINKHL7YGGTXCFDVD7FMJSH'

const voteToken = new StellarSdk.Asset('Vote01122019', issuerAccountId)
let selectedParty

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
  console.log(`fetching balance for ${accountId}`)
  const userAccount = await stellar
    .accounts()
    .accountId(accountId)
    .call()

  const balance = userAccount.balances.find(
    aBalance =>
      aBalance.asset_code === voteToken.code &&
      aBalance.asset_issuer === voteToken.issuer,
  )

  console.log(`found balance ${balance.balance} on accountId ${accountId}`)

  if (balance) {
    return Math.round(balance.balance * 10 ** 7)
  }
  return undefined
}

async function fetchVoteTokensBalance() {
  const accountId = $('#account-id').val()
  const balance = await fetchAccountTokenBalance(accountId)

  if (balance) {
    $('#vote-tokens-balance').text(balance)
  } else {
    $('#vote-tokens-balance').text(
      "Cou don't have any votes left or you didn't create trustline to token issuer",
    )
  }
}

async function fetchDistributorTokensBalance() {
  const balance = await fetchAccountTokenBalance(distributionAccountId)
  $('#tokensRemaining').text(balance)
}

function showError(message) {
  $('#alert-text').text(message)
  $('.alert').addClass('show')
  $('.alert').alert()
}

async function loginWithPz() {
  console.log('login with pz')
  const login = $('#login').val()
  const password = $('#password').val()
  const request = { login, password }
  try {
    $('#loginSpinner').removeClass('d-none')
    $('#loginWithPz').prop('disabled', true)
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    const data = await response.json()
    console.log({ userId: data.userId })
    $('#userId').text(data.userId)
    $('#btnManualMode').prop('disabled', false)
    $('#btnSimpleVote').prop('disabled', false)
    if (response.ok) {
      console.log('Successfully logged in')
    } else {
      console.error('Failed to login')
      throw new Error(response.message)
    }
    $('#loginWithPzModal').modal('hide')
  } finally {
    $('#loginSpinner').addClass('d-none')
    $('#loginWithPz').prop('disabled', false)
  }
}

async function trustIssuer() {
  console.log('trustIssuer')
  const secret = $('#secret').val()
  const keypair = StellarSdk.Keypair.fromSecret(secret)
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
  if (!response.ok) {
    console.log('Successfully submited transaction to network')
  } else {
    console.error('Failed to submit transaction to network')
    throw new Error(response.message)
  }
  fetchVoteTokensBalance()
}

async function issueToken() {
  const accountId = $('#account-id').val()
  const userId = $('#userId').text()
  const request = { accountId, userId }
  try {
    $('#voteSpinnerSending').removeClass('d-none')
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
      throw new Error(response.message)
    }
  } finally {
    $('#voteSpinnerSending').addClass('d-none')
    $('#issueTokenButton').prop('disabled', false)
  }
}

async function signAndSendVote() {
  console.log(`vote on party ${selectedParty.name}`)
  const secret = $('#vote-secret').val()
  const keypair = StellarSdk.Keypair.fromSecret(secret)
  $('#signAndSendSpinner').removeClass('d-none')
  $('#signVoteButton').prop('disabled', true)
  const account = await stellar.loadAccount(keypair.publicKey())
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: selectedParty.accountId,
        asset: voteToken,
        amount: '0.0000001',
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(keypair)
  const response = await stellar.submitTransaction(transaction)
  $('#signAndSendSpinner').addClass('d-none')
  $('#signVoteButton').prop('disabled', false)
  $('#voteModal').modal('hide')
}

async function voteOnParty() {
  const keypair = StellarSdk.Keypair.random()
  console.log({ pub: keypair.publicKey(), sec: keypair.secret() })
  $('#secret').val(keypair.secret())
  $('#vote-secret').val(keypair.secret())
  $('#account-id').val(keypair.publicKey())
  const accountId = $('#account-id').val()
  const userId = $('#userId').text()

  const account = await stellar.loadAccount(distributionAccountId)
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: 100,
    networkPassphrase: StellarSdk.Networks.TESTNET,
    memo: StellarSdk.Memo.text(userId),
  })
    .addOperation(
      StellarSdk.Operation.createAccount({
        source: distributionAccountId,
        destination: accountId,
        startingBalance: '1.5000000',
        // 1 XML for minimum acocunt balance
        // 0.5 for trustline
        // 400 for four transactions fee
      }),
    )
    .addOperation(
      StellarSdk.Operation.changeTrust({
        source: keypair.publicKey(),
        asset: voteToken,
        limit: '0.0000100',
      }),
    )
    .addOperation(
      StellarSdk.Operation.payment({
        source: distributionAccountId,
        destination: accountId,
        asset: voteToken,
        amount: '0.0000001',
      }),
    )
    .addOperation(
      StellarSdk.Operation.payment({
        source: keypair.publicKey(),
        destination: selectedParty.accountId,
        asset: voteToken,
        amount: '0.0000001',
      }),
    )
    .addOperation(
      StellarSdk.Operation.changeTrust({
        source: keypair.publicKey(),
        asset: voteToken,
        limit: '0',
      }),
    )
    .addOperation(
      StellarSdk.Operation.payment({
        source: keypair.publicKey(),
        destination: distributionAccountId,
        asset: StellarSdk.Asset.native(),
        amount: '0.5',
      }),
    )
    .setTimeout(60) // seconds
    .build()

  transaction.sign(keypair)
  const txn = transaction.toXDR()
  const request = { txn, userId }

  $('#simpleVoteSpinner').removeClass('d-none')
  $('#btnVote').prop('disabled', true)
  const response = await fetch('/signTx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  $('#simpleVoteSpinner').addClass('d-none')
  $('#btnVote').prop('disabled', false)

  if (response.ok) {
    console.log('Successfully funded account')
  } else {
    console.error('Failed to fund account')
    throw new Error(await response.text())
  }

  const signedTxn = await response.text()
  console.log({ receivedTxn: signedTxn })
  const signedTransaction = new StellarSdk.Transaction(
    signedTxn,
    StellarSdk.Networks.TESTNET,
  )

  try {
    const res = await stellar.submitTransaction(signedTransaction)
    console.log(res.hash)
  } catch (e) {
    console.error(e)
    throw new Error(e.message)
  }
}

async function fetchResults() {
  return Promise.all(
    parties.map(async party => {
      console.log(
        `fetching balance for party ${party.name} for accoundId ${party.accountId}`,
      )
      const votesCount = await fetchAccountTokenBalance(party.accountId)
      return {
        ...party,
        votes: votesCount,
      }
    }),
  )
}

async function createPartiesList() {
  const partiesWithVotes = await fetchResults()
  const list = $('#party-list')
  partiesWithVotes.forEach(party => {
    console.log({ party })
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

async function createResultsPlot() {
  const partiesWithVotes = await fetchResults()
  // set the dimensions and margins of the graph
  const margin = { top: 30, right: 30, bottom: 70, left: 60 }
  const width = 460 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom
  // append the svg object to the body of the page
  d3.select('svg').remove()
  const svg = d3
    .select('#resultsPlot')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  // X axis
  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(partiesWithVotes.map(party => party.name))
    .padding(0.2)
  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end')

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      partiesWithVotes.reduce(
        (prev, current) => prev + (current.votes || 0),
        0,
      ),
    ])
    .range([height, 0])
  svg.append('g').call(d3.axisLeft(y))

  // Bars
  svg
    .selectAll('mybar')
    .data(partiesWithVotes)
    .enter()
    .append('rect')
    .attr('x', party => x(party.name))
    .attr('y', party => y(party.votes || 0))
    .attr('width', x.bandwidth())
    .attr('height', party => height - y(party.votes || 0))
    .attr('fill', '#69b3a2')
}

const onStart = {
  identify: () => {
    const login = $('#login').val()
    if (!login) {
      $('#btnManualMode').prop('disabled', true)
      $('#btnSimpleVote').prop('disabled', true)
    }
  },
  enterStellarAddress: () => {},
  trustline: () => {
    fetchDistributorTokensBalance()
    fetchTrustlineInformation()
  },
  issue: () => {
    fetchVoteTokensBalance()
  },
  vote: () => {},
  results: () => {
    createResultsPlot()
  },
}

function render() {
  sections.simple
    .concat(sections.manual)
    .filter((_value, index) => index !== currentSectionIndex)
    .forEach(value => $(`#${value}`).hide())

  if (!mode) {
    $(`#identify`).show()
    onStart.identify()
  } else {
    $(`#${sections[mode][currentSectionIndex]}`).show()
    onStart[sections[mode][currentSectionIndex]]()
  }
}

render()
createPartiesList()

function showNextPage() {
  currentSectionIndex = (currentSectionIndex + 1) % sections[mode].length
  render()
}

function showPreviousPage() {
  currentSectionIndex =
    currentSectionIndex - 1 >= 0 ? currentSectionIndex - 1 : 0
  render()
}

$('.next').click(() => {
  showNextPage()
})

$('.back').click(() => {
  showPreviousPage()
})

$('#issueTokenButton').click(() => {
  issueToken()
})

$('#trustIssuerButton').click(() => {
  trustIssuer()
})

$('#signVoteButton').click(() => {
  signAndSendVote()
})

$('#loginWithPz').click(() => {
  loginWithPz()
})

$('#btnSimpleVote').click(async () => {
  mode = 'simple'
  showNextPage()
})

$('#btnManualMode').click(() => {
  mode = 'manual'
  showNextPage()
})

$('#btnVote').click(async e => {
  if (mode === 'simple') {
    e.stopPropagation()
    // await signAndSendVote()
    try {
      await voteOnParty()
      showNextPage()
    } catch (error) {
      console.error(error)
      showError(error.message)
    }
  }
})

$('#issuerAccountId').text(issuerAccountId)
