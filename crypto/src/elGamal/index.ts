// Based on Kristóf Poduszló implementation https://github.com/kripod/elgamal.js
//@ts-ignore
import asn from 'asn1.js'
import DecryptionElGamal from './decryption'
import EncryptionElGamal from './encryption'
import { BigInteger as BigInt } from 'jsbn';
import EncryptedValue from './encryptedValue'
import DecryptedValue from './decryptedValue'
import BN from 'bn.js'
import * as Utils from './utils';

export { ElGamal, EncryptionElGamal, DecryptionElGamal, DecryptedValue, EncryptedValue }

export function createEncryptionKeypair(primeBits = 2048): { publicKey: Buffer, privateKey: Buffer } {
    const { p, g, y, x } = ElGamal.generate(primeBits)
    const privateKey = encodePrivateKey(p, g, y, x)
    const publicKey = encodePublicKey(p, g, y)
    return { privateKey, publicKey }
}

const ElGamalPublicKey = asn.define('DHPublicKeyForElGamalEncryption', function () {
    //@ts-ignore
    this.seq().obj(
        //@ts-ignore
        this.key('p').int(),
        //@ts-ignore
        this.key('g').int(),
        //@ts-ignore
        this.key('y').int(),
    );
});

export function encodePublicKey(prime: BigInt, generator: BigInt, publicKey: BigInt): Buffer {
    return ElGamalPublicKey.encode({
        p: new Buffer(prime.toByteArray()),
        g: new Buffer(generator.toByteArray()),
        y: new Buffer(publicKey.toByteArray()),
    }, 'der');
}

export function decodePublicKey(der: Buffer): { p: BN, g: BN, y: BN } {
    return ElGamalPublicKey.decode(der, 'der');
}

const ElGamalPrivateKey = asn.define('DHPrivateKeyForElGamalEncryption', function () {
    //@ts-ignore
    this.seq().obj(
        //@ts-ignore
        this.key('p').int(), // Prime
        //@ts-ignore
        this.key('g').int(), // Generator
        //@ts-ignore
        this.key('y').int(), // PrivateKey
        //@ts-ignore
        this.key('x').int(), // PrivateKey
    );
});

export function encodePrivateKey(prime: BigInt, generator: BigInt, y: BigInt, x: BigInt): Buffer {
    return ElGamalPrivateKey.encode({
        p: new Buffer(prime.toByteArray()),
        g: new Buffer(generator.toByteArray()),
        y: new Buffer(y.toByteArray()),
        x: new Buffer(x.toByteArray()),
    }, 'der');
}

export function decodePrivateKey(der: Buffer): { p: BN, g: BN, y: BN, x: BN } {
    return ElGamalPrivateKey.decode(der, 'der');
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