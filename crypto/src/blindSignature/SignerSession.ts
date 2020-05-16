import { eddsa } from 'elliptic';
import BN from 'bn.js';
import { ed25519 } from './index';
import { randomScalar } from './utils'

export default class SignerSession {
  private readonly k: BN;

  private readonly P: eddsa.Point;

  private readonly x: BN;

  private readonly R: eddsa.Point;

  constructor(secretKey: Buffer) {
    const keypair = ed25519.keyFromSecret(secretKey);
    // @ts-ignore
    this.x = keypair.priv();
    // @ts-ignore
    this.P = keypair.pub();
    this.k = randomScalar();
    this.R = ed25519.curve.g.mul(this.k)
  }

  publicKey(): eddsa.Point {
    return this.P
  }

  publicNonce(): eddsa.Point {
    return this.R
  }

  sign(challenge: BN) {
    return this.x
      .mul(challenge)
      .add(this.k)
      .umod(ed25519.curve.n)
  }
}
