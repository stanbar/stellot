
import { BigInteger as BigInt } from 'jsbn';

import EncryptedValue from './encryptedValue';
import * as Errors from './errors';
import { parseBigInt } from './utils';
import EncryptionElGamal from './encryption';
import * as Utils from "./utils";

export default class DecryptionElGamal extends EncryptionElGamal {
  /**
   * Private key.
   */
  x: BigInt;

  /**
   * Creates a new ElGamal instance.
   * @param p Safe prime number.
   * @param g Generator.
   * @param y Public key.
   * @param x Private key.
   */
  constructor(p: BigInt | string | number, g: BigInt | string | number, y: BigInt | string | number, x: BigInt | string | number) {
    super(p, g, y);
    this.x = parseBigInt(x);
  }

  /**
   * Decrypts a message.
   * @param {EncryptedValue} m Piece of data to be decrypted.
   * @throws {MissingPrivateKeyError}
   * @returns {DecryptedValue}
   */
  decrypt(m: EncryptedValue): BigInt {
    // TODO: Use a custom error object
    if (!this.x) throw new Errors.MissingPrivateKeyError();

    const p = this.p;
    const r = Utils.getRandomBigInt(
      Utils.BIG_TWO,
      this.p.subtract(BigInt.ONE)
    );

    const aBlind = this.g.modPow(r, p).multiply(m.a).remainder(p);
    const ax = aBlind.modPow(this.x, p);

    const plaintextBlind = ax.modInverse(p).multiply(m.b).remainder(p);
    return this.y.modPow(r, p).multiply(plaintextBlind).remainder(p)
  }
}
