import { Keypair, Memo, Account, Networks, TransactionBuilder, Operation, Transaction } from 'stellar-sdk';
import { encodeMemo, decodeMemo, decodeTransactionMemo } from '@stellot/crypto';

function createTransaction(source: Account, memo: Memo) {
    const builder = new TransactionBuilder(source, {
        networkPassphrase: Networks.PUBLIC,
        fee: 1000,
    });
    builder.addOperation(Operation.bumpSequence({
        bumpTo: '0'
    }));
    builder.setTimeout(0);
    builder.addMemo(memo);
    const tx = builder.build();
    const xdr = tx.toXDR();

    return new Transaction(xdr, Networks.PUBLIC);
}
describe('secret-memo', () => {
    it('encrypt and decrypt using secret-memo', async () => {
        expect.assertions(1);
        const encryptionKeys = Keypair.random()

        const sender = Keypair.random()
        const senderAccount = new Account(sender.publicKey(), '0');

        const receiver = Keypair.random()

        const memo = Memo.id('1234566');
        const secret = await encodeMemo(senderAccount.sequenceNumber(), sender, encryptionKeys.publicKey(), memo);
        const decryptedMemoPromise = decodeMemo(senderAccount.sequenceNumber() + 1, encryptionKeys, sender.publicKey(), secret);
        expect(decryptedMemoPromise).resolves.toEqual(memo)
    })
})