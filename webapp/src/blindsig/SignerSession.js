const elliptic = require('elliptic')
const eddsa = elliptic.eddsa
const rand = elliptic.rand
const BN = require('bn.js')
const { randomScalar } = require('../utils')

const ed25519 = new eddsa('ed25519')

export default class SignerSession {
  constructor(keypair) {
    this.x = keypair.priv()
    this.P = keypair.pub()
    this.k = randomScalar()
    this.R = ed25519.g.mul(this.k)
  }

  publicKey() {
    return this.P
  }

  publicNonce() {
    return this.R
  }

  sign(challenge) {
    return this.x
      .mul(challenge)
      .add(this.k)
      .umod(ed25519.curve.n)
  }
}
