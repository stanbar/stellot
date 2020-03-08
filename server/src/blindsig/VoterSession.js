const elliptic = require('elliptic')
const { eddsa } = elliptic.eddsa
const { randomScalar } = require('../utils')

const ed25519 = new eddsa('ed25519')

export default class VoterSession {
  constructor(P, R, a, b) {
    this.a = a || randomScalar()
    this.b = b || randomScalar()
    this.P = P
    this.R = R.add(ed25519.g.mul(this.a).add(this.P.mul(this.b)))
  }

  // TODO rename to blindedTransaction
  challenge(message) {
    return ed25519
      .hashInt(
        ed25519.encodePoint(this.R),
        ed25519.encodePoint(this.P),
        message,
      )
      .add(this.b)
      .umod(ed25519.curve.n)
  }

  signature(s) {
    const S = s.add(this.a).umod(ed25519.curve.n)
    return ed25519.makeSignature({ R: this.R, S })
  }
}
