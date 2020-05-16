//@ts-ignore
import asn from 'asn1.js'
import ElGamal, { DecryptionElGamal, EncryptionElGamal } from './elGamal'
import { BigInteger as BigInt } from 'jsbn';
import EncryptedValue from './encryptedValue'
import DecryptedValue from './decryptedValue'
import BN from 'bn.js'

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
