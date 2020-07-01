import rand from 'randombytes'
import BN from 'bn.js'
import { EncryptionElGamal, DecryptionElGamal, EncryptedValue, toBuffer } from '@stellot/crypto';

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

export function encodeMemo(candidateCode: number): Buffer {
  if (candidateCode === 0) {
    throw new Error('Code 0 will be skipped by ascii encoding, please start enumeration with code 1')
  }
  const randomMemo: Buffer = new Buffer(rand(32));
  // Write answer 0
  randomMemo.writeUInt8(candidateCode, 0);
  return randomMemo
}

export function decodeMemo(memo: Buffer | string, answerCount: number): number[] {
  if (typeof memo === 'string') {
    // eslint-disable-next-line no-param-reassign
    memo = Buffer.from(memo, 'hex');
  }
  const answers = new Array<number>(answerCount);
  for (let i = 0; i < answerCount; i += 1) {
    answers[i] = memo.readUInt8(i)
  }
  return answers
}

export function decodeAnswersFromMemo(memo: Buffer | string, answerCount: number)
  : Array<number> {
  if (typeof memo === 'string') {
    // eslint-disable-next-line no-param-reassign
    memo = Buffer.from(memo, 'hex');
  }
  const answers = new Array<number>(answerCount);
  for (let i = 0; i < answerCount; i += 1) {
    answers[i] = memo.readUInt8(i)
  }
  return answers;
}

export function padMemoWithNonce(memo: Buffer) {
  if (memo.length != 16) {
    throw new Error('Only 16 bytes memos should be padded')
  }
  return Buffer.concat([memo, rand(16)])

}

export function encryptMemo(memo: Buffer, encryptor: EncryptionElGamal): Buffer {
  const { a, b } = encryptor.encrypt(memo)
  const aBuff = toBuffer(a)
  const bBuff = toBuffer(b)

  if (aBuff.length > 16) {
    throw new Error(`a.Length ${aBuff.length} is longer than 16bytes`)
  }
  if (bBuff.length > 16) {
    throw new Error(`b.Length ${bBuff.length} is longer than 16bytes`)
  }

  const aBuffer = new Buffer(16).fill(aBuff)
  const bBuffer = new Buffer(16).fill(bBuff)

  // Create empty buffer filled with 0
  const cipherText = Buffer.alloc(32)
  // Write part a to the [0-15] offset bytes
  for (let i = 0; i < 16; i += 1) {
    cipherText.writeUInt8(aBuffer.readUInt8(i), i)
  }
  // Write part b to the [16-31] offset bytes
  for (let i = 16; i < 32; i += 1) {
    cipherText.writeUInt8(bBuffer.readUInt8(i - 16), i)
  }
  return cipherText
}

export function decryptMemo(cipherText: Buffer, decryptor: DecryptionElGamal): Buffer {
  const aBuffer = new BN(cipherText.slice(0, 16))
  const bBuffer = new BN(cipherText.slice(16, 32))

  const encryptedValue = new EncryptedValue(aBuffer.toString('hex'), bBuffer.toString('hex'))
  const decryptedBigInt = decryptor.decrypt(encryptedValue)
  return new Buffer(decryptedBigInt.toByteArray())
}

const base64abc = (() => {
  const abc = [];
  const A = 'A'.charCodeAt(0);
  const a = 'a'.charCodeAt(0);
  const n = '0'.charCodeAt(0);
  for (let i = 0; i < 26; i += 1) {
    abc.push(String.fromCharCode(A + i));
  }
  for (let i = 0; i < 26; i += 1) {
    abc.push(String.fromCharCode(a + i));
  }
  for (let i = 0; i < 10; i += 1) {
    abc.push(String.fromCharCode(n + i));
  }
  abc.push('+');
  abc.push('/');
  return abc;
})();

export function bytesToBase64(bytes: any) { /* eslint-disable no-bitwise */
  let result = '';
  let i;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
    result += base64abc[bytes[i] & 0x3F];
  }
  if (i === l + 1) { // 1 octet missing
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 0x03) << 4];
    result += '==';
  }
  if (i === l) { // 2 octets missing
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += base64abc[(bytes[i - 1] & 0x0F) << 2];
    result += '=';
  }
  return result;
}