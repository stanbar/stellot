import { eddsa } from 'elliptic';
import BN from 'bn.js';
import { ed25519 } from './index';
import { randomScalar } from '../utils'

export default class SignerSession {
  private readonly k: BN;

  private readonly P: eddsa.Point;

  private readonly x: BN;

  private readonly R: eddsa.Point;

  constructor(secretKey: Buffer, publicKey: Buffer) {
    this.x = ed25519.decodeInt(secretKey);
    this.P = ed25519.decodePoint(publicKey);
    this.k = randomScalar();
    this.R = ed25519.curve.g.mul(this.k)
  }

  publicKey() {
    return this.P
  }

  publicNonce() {
    return this.R
  }

  sign(challenge: BN) {
    return this.x
      .mul(challenge)
      .add(this.k)
      .umod(ed25519.curve.n)
  }
}
