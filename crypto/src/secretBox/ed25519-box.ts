import { eddsa as Eddsa } from 'elliptic';
import { sha256 } from 'js-sha256';
import { sha512 } from 'js-sha512';
import {
    encrypt as _encrypt,
    decrypt as _decrypt
} from '@stellot/secret-box'

/**
 *
 * @param privKey -
 * @param pubKey -
 * @param input -
 * @param nonce -
 * @param authenticate -
 */
export function encrypt(
    privKey: Buffer,
    pubKey: Buffer,
    input: any,
    nonce: Uint8Array | null,
    authenticate: Boolean = true
): Promise<Uint8Array> {
    const key = deriveKey(privKey, pubKey);
    return _encrypt(input, key, nonce, authenticate);
}

/**
 *
 * @param privKey -
 * @param pubKey -
 * @param input -
 * @param nonce -
 * @param authenticate -
 */
export function decrypt(
    privKey: Buffer,
    pubKey: Buffer,
    input: any,
    nonce: Uint8Array | null,
    authenticate: Boolean = true
): Promise<Uint8Array> {
    const key = deriveKey(privKey, pubKey);
    return _decrypt(input, key, nonce, authenticate);
}

/**
 * @internal
 */
const ec = new Eddsa('ed25519');

/**
 * @internal
 * @param privKey -
 * @param pubKey -
 */
export function deriveKey(
    privKey: Buffer,
    pubKey: Buffer
) {
    const scalar = ec.decodeInt(getScalar(privKey));
    const point  = ec.decodePoint(pubKey.toString('hex'));
    const secret = ec.encodePoint(point.mul(scalar));
    return Buffer.from(sha256.arrayBuffer(secret));
}

/**
 * @internal
 * @param seed -
 */
function getScalar(seed: string | number[] | ArrayBuffer | Uint8Array) {
    const hash = sha512.array(seed);
    hash[0]  &= 0xf8;
    hash[31] &= 0x3f;
    hash[31] |= 0x40;
    return hash.slice(0, 32);
}
