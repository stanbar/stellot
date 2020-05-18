import test from 'ava'
import {
    createEncryptionKeypair,
    decodePublicKey,
    decodePrivateKey,
    ElGamal,
    DecryptionElGamal,
} from '../src'
import rand from 'randombytes'
import { toBuffer } from '../src/elGamal/utils'

test('should return base64 priv and public keys', (t) => {
    const { privateKey, publicKey } = createEncryptionKeypair()
    const privKeyAscii = privateKey.toString('hex')
    const privBase64 = privateKey.toString('base64')
    t.deepEqual(privKeyAscii, new Buffer(privBase64, 'base64').toString('hex'))

    const pubKeyAscii = publicKey.toString('hex')
    const pubBase64 = publicKey.toString('base64')
    t.deepEqual(pubKeyAscii, new Buffer(pubBase64, 'base64').toString('hex'))
})

test('should decode the same prime and generator key properties', (t) => {
    const { privateKey, publicKey } = createEncryptionKeypair()
    const derPriv = Buffer.from(privateKey).toString('base64')
    const pub = decodePublicKey(publicKey)
    const priv = decodePrivateKey(privateKey)
    t.deepEqual(pub.g, priv.g)
    t.deepEqual(pub.p, priv.p)
});

test('ElGamal.fromPrivateKey transtestivtesty', (t) => {
    const { privateKey } = createEncryptionKeypair()
    const priv = decodePrivateKey(privateKey)

    const eg = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
    t.is(priv.y.toString(), eg.y.toString())
    t.is(priv.x.toString(), eg.x.toString())
});

test('ElGamal.fromPublicKey transtestivtesty', (t) => {
    const { publicKey } = createEncryptionKeypair()
    const pub = decodePublicKey(publicKey)

    const eg = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
    t.is(pub.y.toString(), eg.y.toString())
});
test('ciphertext should be 2 times keysize', (t) => {
    Array.from({ length: 20 }, () => {
        const keySizeBytes = 16
        const { publicKey } = createEncryptionKeypair(keySizeBytes * 8)
        const pub = decodePublicKey(publicKey)

        const randomMemo: Buffer = Buffer.from(rand(keySizeBytes));
        randomMemo.writeUInt8(1, 0);

        const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        const cipher = encrypter.encrypt(randomMemo)

        t.true(cipher.a.bitLength() <= keySizeBytes * 8)
        t.true(cipher.b.bitLength() <= keySizeBytes * 8)
        t.true(toBuffer(cipher.a).length <= keySizeBytes)
        t.true(toBuffer(cipher.b).length <= keySizeBytes)
    })
});
test('should encrypt and decrypt random 16 byte memo wtesth elgamal', (t) => {
    Array.from({ length: 20 }, () => {
        const { privateKey, publicKey } = createEncryptionKeypair()
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)

        const randomMemo: Buffer = Buffer.from(rand(16));
        randomMemo.writeUInt8(1, 0);

        const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        const cipher = encrypter.encrypt(randomMemo)

        const decrypter: DecryptionElGamal = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
        const decrypted = decrypter.decrypt(cipher)
        t.is(randomMemo.toString(), toBuffer(decrypted).toString())
    })
});

test('should encrypt and decrypt random 16 byte memo wtesth 128btest elgamal', (t) => {
    Array.from({ length: 20 }, () => {
        const { privateKey, publicKey } = createEncryptionKeypair(128)
        const pub = decodePublicKey(publicKey)
        const priv = decodePrivateKey(privateKey)

        const randomMemo: Buffer = Buffer.from(rand(16));
        randomMemo.writeUInt8(1, 0);

        const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
        const cipher = encrypter.encrypt(randomMemo)

        const decrypter: DecryptionElGamal = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
        const decrypted = decrypter.decrypt(cipher)
        t.is(randomMemo.toString(), toBuffer(decrypted).toString())
    })
});
test('should encrypt and decrypt hello world 128btest elgamal', (t) => {
    const { privateKey, publicKey } = createEncryptionKeypair(128)
    const pub = decodePublicKey(publicKey)
    const priv = decodePrivateKey(privateKey)

    const helloWorld = 'Hello World!'
    const helloWorldBuffer: Buffer = Buffer.from(helloWorld);

    const encrypter = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
    const cipher = encrypter.encrypt(helloWorldBuffer)

    const decrypter: DecryptionElGamal = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
    const decrypted = decrypter.decrypt(cipher)
    t.deepEqual(helloWorldBuffer, toBuffer(decrypted))
    t.deepEqual(helloWorld, toBuffer(decrypted).toString())
});