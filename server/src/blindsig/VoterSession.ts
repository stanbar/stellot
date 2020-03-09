import { eddsa } from 'elliptic';
import BN from 'bn.js';
import { ed25519 } from './index';
import { randomScalar } from '../utils'

export default class VoterSession {
  private readonly a: BN;

  private readonly b: BN;

  private readonly P: eddsa.Point;

  private readonly R: eddsa.Point;

  constructor(publicKeyBuffer: Buffer, R: Buffer, a?: BN, b?: BN) {
    this.a = a || randomScalar();
    this.b = b || randomScalar();
    this.P = ed25519.decodePoint(publicKeyBuffer);
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

  signature(s: BN) {
    const S = s.add(this.a).umod(ed25519.curve.n);
    // @ts-ignore
    return ed25519.makeSignature({ R: this.R, S })
  }
}
