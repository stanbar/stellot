import { getRandomInt, encodeMemo, encryptMemo, decryptMemo } from '../utils'
import { ElGamal, createEncryptionKeypair, decodePrivateKey, decodePublicKey, DecryptionElGamal, toBuffer, EncryptedValue } from '@stellot/crypto'
import rand from 'randombytes'
import BN from 'bn.js'
import { BigInteger as BigInt } from 'jsbn';


describe('test utils', () => {
    it('test rng', () => {
        expect(getRandomInt(10000) !== getRandomInt(10000)).toBeTruthy()
    })
    it('test encoding memo', () => {
        expect(encodeMemo(1).readUInt8(0)).toEqual(1)
        expect(encodeMemo(2).readUInt8(0)).toEqual(2)
        expect(encodeMemo(100).readUInt8(0)).toEqual(100)
        expect(encodeMemo(254).readUInt8(0)).toEqual(254)
        expect(encodeMemo(255).readUInt8(0)).toEqual(255)
    })
    it('toBuffer on browser', () => {
        const bigInt = new BigInt('123456789')
        const buffer = toBuffer(bigInt)
        expect(buffer).not.toBeNull()
    })
    it('test encrypt', () => {
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
            expect(randomMemo).toEqual(toBuffer(decrypted))
        })
    })
    it('jsbn and bn.js string transitivity', () => {
        const bigInt = new BigInt('123456789')
        const bn = new BN('123456789')
        expect(bigInt.toString()).toEqual(bn.toString())
        expect(bigInt.toString()).toEqual(new BN(bigInt.toString()).toString())
    })
    it('jsbn and bn.js bytes transitivity', () => {
        const randomBytes = rand(16)
        const bigInt = new BigInt(randomBytes)
        const bn = new BN(randomBytes)
        const bigIntBuffer = new Buffer(bigInt.toByteArray());
        const bnBuffer = bn.toBuffer()
        expect(bigIntBuffer).toEqual(bnBuffer)
        expect(bigIntBuffer).toEqual(bnBuffer)

    })
    it('test encryptmemo rewrite', () => {

        Array.from({ length: 50 }, () => {
            const a = rand(16)
            const b = rand(16)
            const aBigInt = new BigInt(a)
            const bBigInt = new BigInt(b)
            const aBuffer = new Buffer(16).fill(toBuffer(aBigInt))
            const bBuffer = new Buffer(16).fill(toBuffer(bBigInt))

            const cipherText = Buffer.alloc(32)
            // Write part a to the [0-15] offset bytes
            for (let i = 0; i < 16; i += 1) {
                cipherText.writeUInt8(aBuffer.readUInt8(i), i)
            }
            // Write part b to the [16-31] offset bytes
            for (let i = 16; i < 32; i += 1) {
                cipherText.writeUInt8(bBuffer.readUInt8(i - 16), i)
            }
            expect(cipherText.slice(0, 16)).toEqual(aBuffer)
            expect(cipherText.slice(16, 32)).toEqual(bBuffer)
            expect(cipherText.length).toEqual(aBuffer.length + bBuffer.length)
        })
    })
    it('test encryptmemo unique ciphertext', () => {
        Array.from({ length: 50 }, () => {
            // Mock memo
            const memo: Buffer = rand(16);

            const { privateKey, publicKey } = createEncryptionKeypair(128)

            const pub = decodePublicKey(publicKey)
            const priv = decodePrivateKey(privateKey)

            const encryptor = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())

            const cipher = encryptor.encrypt(memo)
            const cipher2 = encryptor.encrypt(memo)
            expect(cipher.a).not.toBe(cipher2.a)
            expect(cipher.a).not.toEqual(cipher2.a)

            const cipherText = encryptMemo(memo, encryptor)

            expect(cipherText.slice(0, 16)).not.toEqual(toBuffer(cipher.a))
            expect(cipherText.slice(16, 32)).not.toEqual(toBuffer(cipher.b))
        })
    })
    it('test encrypt -> decrypt memo', () => {
        Array.from({ length: 50 }, () => {
            // Mock memo
            const memo: Buffer = new Buffer(rand(16));

            const { privateKey, publicKey } = createEncryptionKeypair(128)

            const pub = decodePublicKey(publicKey)
            const priv = decodePrivateKey(privateKey)

            const encryptor = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
            const cipherText = encryptMemo(memo, encryptor)

            const aBuffer = new BN(cipherText.slice(0, 16))
            const bBuffer = new BN(cipherText.slice(16, 32))

            const encryptedValue = new EncryptedValue(aBuffer.toString('hex'), bBuffer.toString('hex'))
            expect(aBuffer.toString('hex')).toEqual(encryptedValue.a.toString(16))
            expect(bBuffer.toString('hex')).toEqual(encryptedValue.b.toString(16))
        })
    })

    it('test encode -> encryption -> decryption -> decode memo', () => {
        Array.from({ length: 20 }, () => {
            const myOption = 1
            const memo = encodeMemo(myOption)

            const { privateKey, publicKey } = createEncryptionKeypair(128)

            const pub = decodePublicKey(publicKey)
            const priv = decodePrivateKey(privateKey)

            const encryptor = ElGamal.fromPublicKey(pub.p.toString(), pub.g.toString(), pub.y.toString())
            const cipherText = encryptMemo(memo, encryptor)

            const decryptor = ElGamal.fromPrivateKey(priv.p.toString(), priv.g.toString(), priv.y.toString(), priv.x.toString())
            const decryptedMemo = decryptMemo(cipherText, decryptor)

            expect(memo).toEqual(decryptedMemo)
        })
    })
})