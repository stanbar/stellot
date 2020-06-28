
import { encrypt, decrypt } from './stellarBox';
import Long from 'long';

import {
    Keypair,
    Memo,
    Transaction,
    MemoID,
    MemoHash,
    MemoReturn,
    MemoText,
} from 'stellar-sdk';

/**
 * @internal
 */
type codecFunction = typeof encrypt;

/**
 * @internal
 */
const padding = Buffer.alloc(8);

/**
 * @internal
 * @param fn
 * @param sequenceNumber
 * @param keys
 * @param to
 * @param memo
 */
async function work(
    fn: codecFunction,
    sequenceNumber: string,
    keys: Keypair,
    to: string,
    memo: Memo
): Promise<Memo> {

    if (!memo.value) {
        throw new Error('Invalid memo value');
    }

    //
    //  A full 256-bit hash is two EAS-blocks, so in the worst case the
    //  counter increments twice. To make sure we don't get any counter overlap
    //  if we were to add a memo for the same recipient right after this
    //  transaction, we multiply the sequence number by two first.
    //
    //  Since initial sequence numbers for accounts depend on what ledger
    //  they were created in, getting the same sequence number for a memo
    //  in a transaction that goes in the opposite direction is very unlikely.
    //

    const seqNum = Long.fromString(sequenceNumber);
    const nonce = Buffer.concat([
        padding,
        Buffer.from(seqNum.mul(2).toBytesBE())
    ]);

    if (memo.type === MemoText) {
        const data = Buffer.from(memo.value);
        const res = await fn(keys, to, data, nonce, false);
        const value = Buffer.from(res)
        return new Memo(memo.type, value);
    }

    else if (memo.type === MemoID) {
        const data = Buffer.from(Long.fromString(<string>memo.value, true).toBytesBE());
        const res = await fn(keys, to, data, nonce, false);
        // @ts-ignore
        const value = Long.fromBytesBE(res, true).toString();
        return new Memo(memo.type, value);
    }

    else if ((memo.type === MemoHash) || (memo.type === MemoReturn)) {
        const data = <Buffer>memo.value;
        const res = await fn(keys, to, data, nonce, false);
        const value = Buffer.from(res);
        return new Memo(memo.type, value);
    }

    else {
        throw new Error('Invalid memo type');
    }
}

/**
 *
 * @param sequenceNumber - the nonce
 * @param keys - the private keys of the sender
 * @param to - the public key of the recipient
 * @param memo - the memo to encrypt
 * @returns a memo with an encrypted value
 */
export function encodeMemo(
    sequenceNumber: string,
    keys: Keypair,
    to: string,
    memo: Memo
): Promise<Memo> {
    const sequence = Long.fromString(sequenceNumber).add(1).toString();
    return work(encrypt, sequence, keys, to, memo);
}

/**
 *
 * @param sequenceNumber - the nonce
 * @param keys - the private keys of the recipient
 * @param from - the publid key of the sender
 * @param memo - the memo to decode
 * @returns a memo with a decrypted value
 */
export function decodeMemo(
    sequenceNumber: string,
    keys: Keypair,
    from: string,
    memo: Memo
): Promise<Memo> {
    return work(decrypt, sequenceNumber, keys, from, memo);
}

/**
 *
 * @param tx - the transaction that contains the encrypted memo
 * @param keys - the private keys of the recipient
 * @returns a memo with a decrypted value
 */
export function decodeTransactionMemo(
    tx: Transaction,
    keys: Keypair
): Promise<Memo> {
    return work(decrypt, tx.sequence, keys, tx.source, tx.memo);
}