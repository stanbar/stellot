import { Keypair, StrKey } from 'stellar-sdk';
import {
    encrypt as _encrypt,
    decrypt as _decrypt
} from './ed25519-box';

export function encrypt(
    keys: Keypair,
    to: string,
    input: Uint8Array,
    nonce: Uint8Array | null,
    authenticate: Boolean = true
): Promise<Uint8Array> {
    const privKey = keys.rawSecretKey();
    const pubKey = StrKey.decodeEd25519PublicKey(to);
    return _encrypt(privKey, pubKey, input, nonce, authenticate);
}

export function decrypt(
    keys: Keypair,
    from: string,
    input: Uint8Array,
    nonce: Uint8Array | null,
    authenticate: Boolean = true
): Promise<Uint8Array> {
    const privKey = keys.rawSecretKey();
    const pubKey = StrKey.decodeEd25519PublicKey(from);
    return _decrypt(privKey, pubKey, input, nonce, authenticate);
}