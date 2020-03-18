export const VOTING = 'Voting';
export const KEYCHAIN = 'Keychain';

// Don't change order because of cyclic dependency
import Voting from './Voting'
import Keychain from './Keychain'

export {
  Voting, Keychain,
}
