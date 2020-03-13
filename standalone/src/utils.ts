import { rand } from 'elliptic'
import BN from 'bn.js'

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

export function randomScalar() {
  return new BN(randomBytes(32))
}

export function randomBytes(bytes: number) {
  return rand(bytes)
}

export function encodeMemo(candidateCode: number): Buffer {
  if (candidateCode === 0) {
    throw new Error('Code 0 will be skipped by ascii encoding, please start enumeration with code 1')
  }
  const randomMemo: Buffer = Buffer.from(rand(28));
  // Write answer 0
  randomMemo.writeUInt8(candidateCode, 0);
  return randomMemo
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function encryptMemo(memo: Buffer, _publicKey: Buffer): Buffer {
  // TODO implement later
  return memo
}

export function decodeAnswersFromMemo(memo: Buffer | string, answerCount: number)
  : Array<number> {
  if (typeof memo === 'string') {
    // eslint-disable-next-line no-param-reassign
    memo = Buffer.from(memo, 'ascii');
  }
  const answers = new Array<number>(answerCount);
  for (let i = 0; i < answerCount; i += 1) {
    answers[i] = memo.readUInt8(i)
  }
  return answers;
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
