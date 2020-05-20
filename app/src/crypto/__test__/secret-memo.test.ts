import { Keypair, Memo, Account, Networks, TransactionBuilder, Operation, Transaction } from 'stellar-sdk';
import { encodeMemo, decodeMemo, createEncryptionKeypair, decodePublicKey, decodePrivateKey, ElGamal } from '@stellot/crypto';
import { encodeMemo as encodeMemoElGamal, decodeMemo as decodeMemoElGamal, encryptMemo, decryptMemo } from '../utils'

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
describe('using secret-memo', () => {
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
    it('encrypt and decrypt using elgamal', () => {
        const { privateKey, publicKey } = createEncryptionKeypair(128)
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)
        const encryptor = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        const decryptor = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())

        const myOption = 1
        const encoded = encodeMemoElGamal(myOption)

        const cipherText = encryptMemo(encoded, encryptor)

        const memo = Memo.hash(cipherText.toString('hex'));
        // send to stellar network

        const receivedMemo = memo.value.toString('base64')

        const receivedBuffer = new Buffer(receivedMemo, 'base64')
        console.log({receivedMemo})
        expect(receivedBuffer).toEqual(cipherText)

        const decryptedMemo = decryptMemo(receivedBuffer, decryptor)
        const decodedOption = decodeMemoElGamal(decryptedMemo, 1)[0]


        expect(decodedOption).toEqual(myOption)
    })
})