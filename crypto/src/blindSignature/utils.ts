
import BN from 'bn.js'
import { rand } from 'elliptic'

export function randomScalar() {
  return new BN(rand(32))
}

