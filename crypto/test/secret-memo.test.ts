import test from 'ava'

import { Keypair, Memo, Account } from 'stellar-sdk';
import { encodeMemo, decodeMemo } from '@futuretense/secret-memo';

test('encrypt and decrypt using secret-memo', async (t) => {
    const encryptionKeys = Keypair.random()

    const sender = Keypair.random()
    const senderAccount = new Account(sender.publicKey(), '0');

    const memo = Memo.id('1234566');
    const secret = await encodeMemo(senderAccount.sequenceNumber(), sender, encryptionKeys.publicKey(), memo);
    const decryptedMemoPromise = await decodeMemo(senderAccount.sequenceNumber() + 1, encryptionKeys, sender.publicKey(), secret);
    t.deepEqual(decryptedMemoPromise, memo)
})