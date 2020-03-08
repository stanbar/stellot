import { rand } from 'elliptic'
import BN from 'bn.js'

export function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max))
}

export function randomScalar() {
  return new BN(rand(32).toString('hex'), 16)
}

export function randomBytes(bytes: number) {
  return rand(bytes)
}

export function createMemo(candidateCode: number) {
  const randomMemo = rand(32)
  // Write question 0
  randomMemo.writeUInt8(0, 0)
  // Write answer 0
  randomMemo.writeUInt8(candidateCode, 1)
  return randomMemo
}

export function decodeCandidateCodeFromMemo(memo: Buffer): number {
  const question = randomMemo.readUInt8(0)
  const candidateCode = randomMemo.readUInt8(1)
  return candidateCode
}
