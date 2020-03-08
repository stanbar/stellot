import { rand } from 'elliptic'
import BN from 'bn.js'

export function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max))
}

export function randomScalar() {
  return new BN(rand(32).toString('hex'), 16)
}
