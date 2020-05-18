import { eddsa } from 'elliptic';
import BN from 'bn.js'
import { ed25519 } from './index';
import { randomScalar } from './utils'

export default class VoterSession {
  private readonly a: BN;

  private readonly b: BN;

  private readonly P: eddsa.Point;

  private readonly R: eddsa.Point;

  constructor(P: Buffer | string, R: Buffer | string, a?: BN, b?: BN) {
    this.a = a || randomScalar();
    this.b = b || randomScalar();
    this.P = ed25519.decodePoint(P);
    this.R = ed25519.decodePoint(R)
      .add(ed25519.curve.g.mul(this.a).add(this.P.mul(this.b)))
  }

  // TODO rename to blindedTransaction
  challenge(message: Buffer) {
    return ed25519
      .hashInt(
        // @ts-ignore
        ed25519.encodePoint(this.R),
        ed25519.encodePoint(this.P),
        message,
      )
      .add(this.b)
      .umod(ed25519.curve.n)
  }

  proof(): { a: BN, b: BN } {
    return { a: this.a, b: this.b }
  }

  signature(s: BN): Buffer {
    const S = s.add(this.a).umod(ed25519.curve.n);
    // @ts-ignore
    const signature = ed25519.encodePoint(this.R).concat(ed25519.encodeInt(S));
    return signature
  }

  toJSON() {
    return {
      a: this.a,
      b: this.b,
      P: ed25519.encodePoint(this.P),
      R: ed25519.encodePoint(this.R),
    }
  }
}
