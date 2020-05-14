//@ts-ignore
import asn from 'asn1.js'
import elgamal from 'elgamal'
import { BigInteger as BigInt } from 'jsbn';
import BN from 'bn.js'

export async function createEncryptionKeypair(): Promise<{ publicKey: Buffer, privateKey: Buffer }> {
    const eg = await elgamal.generateAsync()
    const privateKey = encodePrivateKey(eg.p, eg.g, eg.x)
    const publicKey = encodePublicKey(eg.p, eg.g, eg.y)
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
        p: Buffer.from(prime.toByteArray()),
        g: Buffer.from(generator.toByteArray()),
        y: Buffer.from(publicKey.toByteArray()),
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
        this.key('x').int(), // PrivateKey
    );
});

export function encodePrivateKey(prime: BigInt, generator: BigInt, privateKey: BigInt): Buffer {
    return ElGamalPrivateKey.encode({
        p: Buffer.from(prime.toByteArray()),
        g: Buffer.from(generator.toByteArray()),
        x: Buffer.from(privateKey.toByteArray()),
    }, 'der');
}

export function decodePrivateKey(der: Buffer):  { p: BN, g: BN, x: BN } {
    return ElGamalPrivateKey.decode(der, 'der');
}
