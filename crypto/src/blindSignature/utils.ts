
import BN from 'bn.js'
import rand from 'randombytes'

export function randomScalar() {
  return new BN(rand(32))
}

