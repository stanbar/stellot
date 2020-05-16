// Based on Kristóf Poduszló implementation https://github.com/kripod/elgamal.js

import { BigInteger as BigInt } from 'jsbn';
import * as Utils from './utils';

import DecryptedValue from './decryptedvalue';
import EncryptedValue from './encryptedValue';
import * as Errors from './errors';
import { parseBigInt } from './utils';

export class EncryptionElGamal {
  /**
   * Safe prime number.
   */
  p: BigInt;

  /**
   * Generator.
   */
  g: BigInt;

  /**
   * Public key.
   */
  y: BigInt;

  /**
   * Creates a new ElGamal instance.
   * @param {BigInt|string|number} p Safe prime number.
   * @param {BigInt|string|number} g Generator.
   * @param {BigInt|string|number} y Public key.
   */
  constructor(p: BigInt | string | number, g: BigInt | string | number, y: BigInt | string | number) {
    this.p = parseBigInt(p);
    this.g = parseBigInt(g);
    this.y = parseBigInt(y);
  }

  /**
   * Encrypts a message.
   * @param  m Piece of data to be encrypted, which must
   * be numerically smaller than `p`.
   * @param  [k] A secret number, chosen randomly in the
   * closed range `[1, p-2]`.
   * @returns {EncryptedValue}
   */
  encrypt(m: Buffer, k?: BigInt | string | number) {
    const tmpKey = k ? Utils.parseBigInt(k) : Utils.getRandomBigInt(
      BigInt.ONE,
      this.p.subtract(BigInt.ONE)
    );

    const mBi = new DecryptedValue(m).bi;
    const p = this.p;

    const a = this.g.modPow(tmpKey, p);
    const b = this.y.modPow(tmpKey, p).multiply(mBi).remainder(p);

    return new EncryptedValue(a, b);
  }

}

export class DecryptionElGamal extends EncryptionElGamal {
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


export default class ElGamal {
  static generate(primeBits = 2048) {
    let q;
    let p;
    do {
      q = Utils.getBigPrime(primeBits - 1);
      p = q.shiftLeft(1).add(BigInt.ONE);
      // @ts-ignore
    } while (!p.isProbablePrime()); // Ensure that p is a prime

    let g;
    do {
      // Avoid g=2 because of Bleichenbacher's attack
      g = Utils.getRandomBigInt(new BigInt('3'), p);
    } while (
      g.modPowInt(2, p).equals(BigInt.ONE) ||
      g.modPow(q, p).equals(BigInt.ONE) ||
      // g|p-1
      p.subtract(BigInt.ONE).remainder(g).equals(BigInt.ZERO) ||
      // g^(-1)|p-1 (evades Khadir's attack)
      p.subtract(BigInt.ONE).remainder(g.modInverse(p)).equals(BigInt.ZERO)
    );

    // Generate private key
    const x = Utils.getRandomBigInt(
      Utils.BIG_TWO,
      p.subtract(BigInt.ONE)
    );

    // Generate public key
    const y = g.modPow(x, p);

    return { p, g, y, x };
  }

  /**
   * Creates a new decryption ElGamal instance.
   * @param p Safe prime number.
   * @param g Generator.
   * @param y Public key.
   * @param x Private key.
   */
  static fromPrivateKey(p: BigInt | string | number, g: BigInt | string | number, y: BigInt | string | number, x: BigInt | string | number)
    : DecryptionElGamal {
    return new DecryptionElGamal(p, g, y, x)
  }

  /**
   * Creates a new encryption ElGamal instance.
   * @param p Safe prime number.
   * @param g Generator.
   * @param y Public key.
   */
  static fromPublicKey(p: BigInt | string | number, g: BigInt | string | number, y: BigInt | string | number)
    : EncryptionElGamal {
    return new EncryptionElGamal(p, g, y)
  }
}