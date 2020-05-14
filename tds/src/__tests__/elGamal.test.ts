import { createEncryptionKeypair, decodePublicKey, decodePrivateKey } from '../crypto/elGamal'
import ElGamal from 'elgamal'
import { rand } from 'elliptic'

describe('elGamal', () => {
    it('should return base64 priv and public keys', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const privKeyAscii = privateKey.toString('ascii')
        const privBase64 = privateKey.toString('base64')
        expect(privKeyAscii).toStrictEqual(new Buffer(privBase64, 'base64').toString('ascii'))

        const pubKeyAscii = publicKey.toString('ascii')
        const pubBase64 = publicKey.toString('base64')
        expect(pubKeyAscii).toStrictEqual(new Buffer(pubBase64, 'base64').toString('ascii'))
    })

    it('should decode the same prime and generator key properties', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)
        expect(pub.g).toEqual(priv.g)
        expect(pub.p).toEqual(priv.p)
    });

    it('ElGamal should use the same properties as ASN.1', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)

        const eg = new ElGamal(pub.p.toString(), pub.g.toString(), pub.y.toString(), priv.x.toString())
        expect(pub.y.toString()).toEqual(eg.y.toString())
        expect(priv.x.toString()).toEqual(eg.x.toString())
    });

    it('should encrypt and decrypt random 32 byte memo with elgamal', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)
        const eg = new ElGamal(pub.p.toString(), pub.g.toString(), pub.y.toString(), priv.x.toString())

        const randomMemo: Buffer = Buffer.from(rand(28));
        randomMemo.writeUInt8(1, 0);
        const randomMemoAscii = randomMemo.toString('ascii')

        const cipher = await eg.encryptAsync(randomMemoAscii)
        const decrypted = await eg.decryptAsync(cipher)
        expect(randomMemoAscii).toEqual(Buffer.from(decrypted.bi.toByteArray()).toString('ascii'))
    });
})
