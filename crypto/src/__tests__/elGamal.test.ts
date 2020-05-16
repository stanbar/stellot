import { createEncryptionKeypair, decodePublicKey, decodePrivateKey, ElGamal, DecryptionElGamal, EncryptionElGamal } from '../'
import { rand } from 'elliptic'
import { toBuffer } from '../elGamal/utils'

describe('elGamal', () => {
    it('should return base64 priv and public keys', () => {
        const { privateKey, publicKey } = createEncryptionKeypair()
        const privKeyAscii = privateKey.toString('ascii')
        const privBase64 = privateKey.toString('base64')
        expect(privKeyAscii).toStrictEqual(new Buffer(privBase64, 'base64').toString('ascii'))

        const pubKeyAscii = publicKey.toString('ascii')
        const pubBase64 = publicKey.toString('base64')
        expect(pubKeyAscii).toStrictEqual(new Buffer(pubBase64, 'base64').toString('ascii'))
    })

    it('should decode the same prime and generator key properties', () => {
        const { privateKey, publicKey } = createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)
        expect(pub.g).toEqual(priv.g)
        expect(pub.p).toEqual(priv.p)
    });

    it('ElGamal.fromPrivateKey transitivity', () => {
        const { privateKey, publicKey } = createEncryptionKeypair()
        const priv = decodePrivateKey(privateKey)

        const eg = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
        expect(priv.y.toString()).toEqual(eg.y.toString())
        expect(priv.x.toString()).toEqual(eg.x.toString())
    });

    it('ElGamal.fromPublicKey transitivity', () => {
        const { privateKey, publicKey } = createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)

        const eg = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        expect(pub.y.toString()).toEqual(eg.y.toString())
    });
    it('ciphertext should be 2 times keysize', () => {
        Array.from({ length: 20 }, () => {
            const keySizeBytes = 16
            const { privateKey, publicKey } = createEncryptionKeypair(keySizeBytes * 8)
            const pub = decodePublicKey(publicKey)
            const priv = decodePrivateKey(privateKey)

            const randomMemo: Buffer = Buffer.from(rand(keySizeBytes));
            randomMemo.writeUInt8(1, 0);
            const randomMemoAscii = randomMemo.toString('ascii')

            const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
            const cipher = encrypter.encrypt(randomMemoAscii)

            expect(cipher.a.bitLength()).toBeLessThanOrEqual(keySizeBytes * 8)
            expect(cipher.b.bitLength()).toBeLessThanOrEqual(keySizeBytes * 8)
            expect(toBuffer(cipher.a).length).toBeLessThanOrEqual(keySizeBytes)
            expect(toBuffer(cipher.b).length).toBeLessThanOrEqual(keySizeBytes)
        })
    });
    it('should encrypt and decrypt random 16 byte memo with elgamal', () => {
        Array.from({ length: 20 }, () => {
            const { privateKey, publicKey } = createEncryptionKeypair()
            const pub = decodePublicKey(publicKey)
            const priv = decodePrivateKey(privateKey)

            const randomMemo: Buffer = Buffer.from(rand(16));
            randomMemo.writeUInt8(1, 0);
            const randomMemoAscii = randomMemo.toString('ascii')

            const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
            const cipher = encrypter.encrypt(randomMemoAscii)

            const decrypter: DecryptionElGamal = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
            const decrypted = decrypter.decrypt(cipher)
            expect(randomMemoAscii).toBe(toBuffer(decrypted).toString('ascii'))
        })
    });

    it('should encrypt and decrypt random 16 byte memo with 128bit elgamal', () => {
        Array.from({ length: 20 }, () => {
            const { privateKey, publicKey } = createEncryptionKeypair(128)
            const pub = decodePublicKey(publicKey)
            const priv = decodePrivateKey(privateKey)

            const randomMemo: Buffer = Buffer.from(rand(16));
            randomMemo.writeUInt8(1, 0);
            const randomMemoAscii = randomMemo.toString('ascii')

            const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
            const cipher = encrypter.encrypt(randomMemoAscii)

            const decrypter: DecryptionElGamal = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
            const decrypted = decrypter.decrypt(cipher)
            expect(randomMemoAscii).toEqual(toBuffer(decrypted).toString('ascii'))
        })
    });
    it('should encrypt and decrypt hello world 128bit elgamal', () => {
        const { privateKey, publicKey } = createEncryptionKeypair(128)
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)

        const helloWorld = 'Hello World!'
        const helloWorldBuffer: Buffer = Buffer.from(helloWorld);
        const helloWroldAscii = helloWorldBuffer.toString('ascii')

        const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        const cipher = encrypter.encrypt(helloWroldAscii)

        const decrypter: DecryptionElGamal = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
        const decrypted = decrypter.decrypt(cipher)
        expect(helloWorldBuffer).toEqual(toBuffer(decrypted))
        expect(helloWorld).toEqual(toBuffer(decrypted).toString())
    });
})
