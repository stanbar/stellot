import { createEncryptionKeypair, decodePublicKey, decodePrivateKey } from '../'
import ElGamal from '../elGamal/elGamal'
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

    it('ElGamal.fromPrivateKey transitivity', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const priv = decodePrivateKey(privateKey)

        const eg = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
        expect(priv.y.toString()).toEqual(eg.y.toString())
        expect(priv.x.toString()).toEqual(eg.x.toString())
    });

    it('ElGamal.fromPublicKey transitivity', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)

        const eg = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        expect(pub.y.toString()).toEqual(eg.y.toString())
    });

    it('should encrypt and decrypt random 32 byte memo with elgamal', async () => {
        const { privateKey, publicKey } = await createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)


        const randomMemo: Buffer = Buffer.from(rand(28));
        randomMemo.writeUInt8(1, 0);
        const randomMemoAscii = randomMemo.toString('ascii')

        const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        const cipher = await encrypter.encryptAsync(randomMemoAscii)

        const decrypter = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
        const decrypted = await decrypter.decryptAsync(cipher)
        expect(randomMemoAscii).toEqual(new Buffer(decrypted.bi.toByteArray()).toString('ascii'))
    });
})
