const StellarSdk = require('stellar-sdk')

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

server
  .payments()
  .cursor('now')
  .stream({
    onmessage: message => console.log(message),
  })

