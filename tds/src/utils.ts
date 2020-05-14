import { rand } from 'elliptic'
import BN from 'bn.js'

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

export function randomScalar() {
  return new BN(rand(32).toString('hex'), 16)
}

export function randomBytes(bytes: number) {
  return rand(bytes)
}

export function encodeMemo(candidateCode: number): Buffer {
  const randomMemo: Buffer = rand(32);
  // Write question 0
  randomMemo.writeUInt8(0, 0);
  // Write answer 0
  randomMemo.writeUInt8(candidateCode, 1);
  return randomMemo
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function encryptMemo(memo: Buffer, publicKey: Buffer): Buffer {
  // TODO implement later
  console.log(publicKey);
  return memo
}

export function decodeCandidateCodeFromMemo(memo: Buffer | string): number {
  if (typeof memo === 'string') {
    // eslint-disable-next-line no-param-reassign
    memo = Buffer.from(memo)
  }
  // TODO allow multiple Q&A
  // const questionCode = memo.readUInt8(0);
  const candidateCode = memo.readUInt8(1);
  return candidateCode
}